# Delmar Margin Dashboard

Internal financial dashboard for Delmar, a short-term rental property management company. Tracks property-level utility margins, revenue, and operating costs.

## Setup

```bash
# Install dependencies
npm install

# Set up database (SQLite)
npx prisma db push

# Seed with example data (4 properties, 49 reservations)
npm run db:seed

# Start dev server
npm run dev
```

Open http://localhost:3000

## Tech Stack

- **Next.js 14** (App Router) + TypeScript
- **Tailwind CSS** + shadcn/ui components
- **Prisma** ORM + SQLite (swap to PostgreSQL for production)
- **Recharts** for charts
- **Zod** for validation (ready for use in forms)

## Project Structure

```
src/
├── app/                    # Next.js pages
│   ├── dashboard/          # Main dashboard with summary cards + charts
│   ├── properties/         # Properties list + detail pages
│   │   └── [id]/           # Property detail with financials, overrides, settings
│   ├── settings/           # Guesty sync + global config
│   └── api/sync/guesty/    # Guesty sync API endpoint
├── components/             # UI components
│   ├── ui/                 # shadcn/ui primitives
│   ├── dashboard-cards.tsx # Summary KPI cards
│   ├── margin-chart.tsx    # Revenue vs expenses + margin % charts
│   ├── properties-table.tsx # Sortable/searchable properties table
│   ├── expense-override-form.tsx # Override estimated expenses with actuals
│   └── property-settings-form.tsx # Business model + expense defaults
├── lib/
│   ├── calculations/       # Isolated business logic
│   │   ├── expenses.ts     # Expense estimation + proration engine
│   │   └── margin.ts       # Margin calculation engine
│   ├── guesty/             # Guesty integration (isolated)
│   │   ├── client.ts       # HTTP client + auth
│   │   ├── mapper.ts       # Guesty → internal data mapping
│   │   └── sync.ts         # Sync orchestrator
│   ├── data.ts             # Data access layer
│   ├── actions.ts          # Server actions
│   ├── types.ts            # Core TypeScript types
│   └── utils.ts            # Formatting + utilities
└── prisma/
    ├── schema.prisma       # Database schema
    └── seed.ts             # Seed data
```

## Business Logic

### Business Models

1. **Commission-based**: Delmar takes a configurable % from gross payout. Owner gets the rest.
2. **Master Lease**: Delmar pays owner a fixed monthly amount regardless of performance.

### Utility Margin Formula

```
delmar_revenue = gross_payout - owner_payout
net_utility_margin = delmar_revenue - total_operating_expenses
utility_margin_% = net_utility_margin / gross_payout
```

### Expense Estimation

| Category      | Estimation Rule         | Override |
|---------------|------------------------|----------|
| Housekeeping  | stays * cost_per_stay  | Yes      |
| Laundry       | stays * cost_per_stay  | Yes      |
| Electricity   | nights * cost_per_night| Yes      |
| Water         | nights * cost_per_night| Yes      |
| Gas           | nights * cost_per_night| Yes      |
| Internet      | fixed monthly (prorated)| Yes     |
| HOA           | fixed monthly (prorated)| Yes     |

All expenses support manual override per property per month. Overrides take priority over estimates.

### Proration

Fixed monthly costs (internet, HOA) are prorated for custom date ranges using calendar-day fractions.

## Guesty Integration

Set environment variables:
```
GUESTY_API_KEY=your_key
GUESTY_API_SECRET=your_secret
```

Then use the Sync buttons on the Settings page.

**Important**: Guesty API field names may differ by account. If payout fields don't match, edit `src/lib/guesty/mapper.ts` — the mapping layer is isolated there.

Known fields to watch:
- `money.hostPayout` — main payout field
- `money.ownerRevenue` — owner payout (may not exist)
- `money.fareAccommodation` — accommodation revenue fallback

## Seed Data

The seed creates:
- **Beachfront Condo** — Commission (20%), high revenue
- **Downtown Loft** — Master Lease ($2,500/mo), steady bookings
- **Mountain Retreat** — Commission (25%), lower volume, higher nightly
- **Midtown Studio** — Master Lease ($1,800/mo), high turnover
- 49 reservations across 3 months
- 1 expense override example

## Scripts

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run db:generate  # Regenerate Prisma client
npm run db:push      # Push schema to database
npm run db:seed      # Seed database
npm run db:studio    # Open Prisma Studio
npm run db:reset     # Reset database
```

## Assumptions

1. Each reservation = 1 stay (for housekeeping/laundry estimation)
2. Reservations overlapping a period are included in that period's metrics
3. Owner payout for commission = actual if imported, else derived from rate
4. SQLite for MVP; swap `DATABASE_URL` and schema provider for PostgreSQL
5. No auth in MVP — internal use only

## TODO (Phase 2)

- [ ] CSV export for financial reports
- [ ] Monthly trend charts per property
- [ ] Audit trail for override changes
- [ ] Role-based access control
- [ ] Deeper Guesty field mapping (cleaning fees, management fees)
- [ ] Bulk expense override import
- [ ] Multi-month comparison view
- [ ] Email/Slack alerts for negative margin properties
- [ ] PostgreSQL migration for production
- [ ] Automated Guesty sync on schedule (cron)
