/**
 * Guesty API client.
 *
 * Isolates all Guesty-specific HTTP logic in one module.
 * Field mapping is handled in ./mapper.ts to decouple Guesty's
 * response shape from our internal data model.
 *
 * NOTE: Guesty Open API field names may differ from what's documented.
 * If field names change, update mapper.ts — not this client.
 */

const GUESTY_BASE_URL =
  process.env.GUESTY_BASE_URL || "https://open-api.guesty.com/v1";

interface GuestyAuthToken {
  access_token: string;
  expires_in: number;
  token_type: string;
}

let cachedToken: { token: string; expiresAt: number } | null = null;

/**
 * Get an access token from Guesty using client credentials.
 * Caches the token until it expires.
 */
async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const apiKey = process.env.GUESTY_CLIENT_ID;
  const apiSecret = process.env.GUESTY_CLIENT_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error(
      "Guesty API credentials not configured. Set GUESTY_CLIENT_ID and GUESTY_CLIENT_SECRET."
    );
  }

  const res = await fetch("https://open-api.guesty.com/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: apiKey,
      client_secret: apiSecret,
    }),
  });

  if (!res.ok) {
    throw new Error(`Guesty auth failed: ${res.status} ${await res.text()}`);
  }

  const data: GuestyAuthToken = await res.json();
  cachedToken = {
    token: data.access_token,
    // Expire 5 min early to be safe
    expiresAt: Date.now() + (data.expires_in - 300) * 1000,
  };
  return cachedToken.token;
}

async function guestyFetch<T>(path: string, params?: Record<string, string>): Promise<T> {
  const token = await getAccessToken();
  const url = new URL(`${GUESTY_BASE_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(
      `Guesty API error: ${res.status} ${res.statusText} for ${path}`
    );
  }

  return res.json();
}

/** Raw Guesty listing response shape (partial — extend as needed) */
export interface GuestyListing {
  _id: string;
  nickname?: string;
  title?: string;
  active?: boolean;
  address?: {
    full?: string;
    city?: string;
    state?: string;
  };
  // Add more fields as needed from Guesty docs
  [key: string]: unknown;
}

/** Raw Guesty reservation response shape (partial — extend as needed) */
export interface GuestyReservation {
  _id: string;
  listingId?: string;
  guestName?: string;
  checkIn?: string;
  checkOut?: string;
  nightsCount?: number;
  status?: string;
  money?: {
    hostPayout?: number;
    ownerRevenue?: number;
    totalPaid?: number;
    fareAccommodation?: number;
    // Guesty may nest financial fields differently
    [key: string]: unknown;
  };
  source?: string;
  bookedAt?: string;
  [key: string]: unknown;
}

interface GuestyListingsResponse {
  results: GuestyListing[];
  count: number;
  limit: number;
  skip: number;
}

interface GuestyReservationsResponse {
  results: GuestyReservation[];
  count: number;
  limit: number;
  skip: number;
}

/**
 * Fetch all listings from Guesty, paginating automatically.
 */
export async function fetchAllListings(): Promise<GuestyListing[]> {
  const all: GuestyListing[] = [];
  let skip = 0;
  const limit = 100;

  while (true) {
    const data = await guestyFetch<GuestyListingsResponse>("/listings", {
      skip: String(skip),
      limit: String(limit),
      fields: "_id nickname title active address",
    });
    all.push(...data.results);
    if (all.length >= data.count || data.results.length < limit) break;
    skip += limit;
  }

  return all;
}

/**
 * Fetch reservations from Guesty for a date range, paginating automatically.
 *
 * NOTE: The date filter field names may vary in Guesty's API.
 * Common options: checkIn, checkOut, createdAt.
 * Adjust the filter if Guesty changes their API.
 */
export async function fetchReservations(
  from: string,
  to: string
): Promise<GuestyReservation[]> {
  const all: GuestyReservation[] = [];
  let skip = 0;
  const limit = 100;

  while (true) {
    const data = await guestyFetch<GuestyReservationsResponse>(
      "/reservations",
      {
        skip: String(skip),
        limit: String(limit),
        // Filter by checkout date range to capture all revenue in the period
        "filters[checkOut][$gte]": from,
        "filters[checkOut][$lte]": to,
        sort: "checkOut",
      }
    );
    all.push(...data.results);
    if (all.length >= data.count || data.results.length < limit) break;
    skip += limit;
  }

  return all;
}
