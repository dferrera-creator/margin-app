"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatCurrency } from "@/lib/utils";

interface MapPointInput {
  propertyId: string;
  nickname: string;
  title: string | null;
  margin: number;
}

interface GeocodedPoint extends MapPointInput {
  lat: number;
  lon: number;
}

const US_BOUNDS = {
  minLat: 24,
  maxLat: 50,
  minLon: -125,
  maxLon: -66,
};

function marginColor(score: number): string {
  if (score >= 0.75) return "hsl(142, 70%, 35%)";
  if (score >= 0.5) return "hsl(142, 55%, 45%)";
  if (score >= 0.25) return "hsl(48, 95%, 50%)";
  if (score >= 0) return "hsl(32, 95%, 55%)";
  return "hsl(0, 80%, 55%)";
}

function projectToMap(lat: number, lon: number): { x: number; y: number } {
  const x = ((lon - US_BOUNDS.minLon) / (US_BOUNDS.maxLon - US_BOUNDS.minLon)) * 100;
  const y = 100 - ((lat - US_BOUNDS.minLat) / (US_BOUNDS.maxLat - US_BOUNDS.minLat)) * 100;
  return { x, y };
}

async function geocode(query: string): Promise<{ lat: number; lon: number } | null> {
  const key = `map-geocode:${query.toLowerCase()}`;
  const cached = window.localStorage.getItem(key);
  if (cached) {
    return JSON.parse(cached);
  }

  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=us&q=${encodeURIComponent(query)}`
  );
  if (!res.ok) return null;
  const data = (await res.json()) as Array<{ lat: string; lon: string }>;
  if (!data[0]) return null;

  const point = { lat: Number(data[0].lat), lon: Number(data[0].lon) };
  window.localStorage.setItem(key, JSON.stringify(point));
  return point;
}

export function DashboardMapGraph({ properties }: { properties: MapPointInput[] }) {
  const [points, setPoints] = useState<GeocodedPoint[]>([]);

  const maxAbsMargin = useMemo(
    () => Math.max(1, ...properties.map((p) => Math.abs(p.margin))),
    [properties]
  );

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const next: GeocodedPoint[] = [];
      for (const property of properties) {
        const query = property.title || property.nickname;
        const geo = await geocode(query);
        if (!geo) continue;
        if (
          geo.lat < US_BOUNDS.minLat ||
          geo.lat > US_BOUNDS.maxLat ||
          geo.lon < US_BOUNDS.minLon ||
          geo.lon > US_BOUNDS.maxLon
        ) {
          continue;
        }
        next.push({ ...property, lat: geo.lat, lon: geo.lon });
      }

      if (!cancelled) {
        setPoints(next);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [properties]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Map Graph (Margin Heatmap)</CardTitle>
      </CardHeader>
      <CardContent>
        {points.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No geocoded locations yet. Sync listings with location-like titles to populate the map.
          </p>
        ) : (
          <div className="space-y-3">
            <div className="relative w-full h-[360px] rounded-md border bg-slate-100 overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(59,130,246,.15),transparent_35%),radial-gradient(circle_at_70%_70%,rgba(16,185,129,.15),transparent_35%)]" />
              {points.map((p) => {
                const score = (p.margin + maxAbsMargin) / (2 * maxAbsMargin);
                const { x, y } = projectToMap(p.lat, p.lon);
                return (
                  <div
                    key={p.propertyId}
                    className="absolute -translate-x-1/2 -translate-y-1/2 group"
                    style={{ left: `${x}%`, top: `${y}%` }}
                  >
                    <div
                      className={cn("h-3 w-3 rounded-full border border-white shadow")}
                      style={{ backgroundColor: marginColor(score) }}
                    />
                    <div className="hidden group-hover:block absolute z-10 mt-2 w-48 rounded-md border bg-white p-2 text-xs shadow-lg">
                      <div className="font-medium">{p.nickname}</div>
                      <div className={p.margin >= 0 ? "text-green-700" : "text-red-600"}>
                        Margin: {formatCurrency(p.margin)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="text-xs text-muted-foreground">
              Green = stronger margin, red = weaker margin.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
