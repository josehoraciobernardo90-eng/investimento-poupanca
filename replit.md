# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Full-stack financial management web app — **Cofre Capital** — a collective savings/investment vault management system for Mozambican users (currency: MT Meticais).

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui
- **Frontend extras**: recharts, framer-motion, date-fns

## Application: Cofre Capital

A professional collective investment vault manager. Key features:

- **Dashboard**: Real-time stats (caixa, na rua, lucros, patrimônio total)
- **Members**: Manage member profiles, capital maps, balances
- **Loans**: Track active loans, traceability (who funded what), interest projections, liquidation
- **Requests**: Approve/reject loan and deposit requests (triggers capital allocation algorithm)
- **Audit**: Full audit trail of all operations

### Capital Allocation Algorithm
When a loan is approved:
1. Member with highest balance loses their entire balance first
2. Remaining amount is split equally among other members

### Interest Model (Simple Interest)
- Month 1 (0-30 days): 10%
- Month 2 (31-60 days): 20%
- Month 3+ (61+ days): 50%

On liquidation:
- 50% of interest → borrower (incentive)
- 50% of interest → investors proportional to their contribution

### Currency
All DB values stored as centavos (integer). Display: divide by 100, format as "1.234,56 MT" (pt-MZ locale).

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server (port 8080)
│   │   └── src/
│   │       ├── lib/capitalEngine.ts  # Core algorithm
│   │       └── routes/              # users, loans, requests, dashboard, audit
│   └── cofre/              # React + Vite frontend (port 20213, preview at /)
│       └── src/
│           ├── pages/      # dashboard, members, loans, requests, audit
│           ├── hooks/      # API hooks
│           └── components/ # UI components
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
└── scripts/                # Utility scripts (seed.ts for demo data)
```

## DB Schema

Tables: `users`, `loans`, `traceability`, `loan_requests`, `deposit_requests`, `audit_log`

## Seeding

Run `pnpm --filter @workspace/scripts run seed` to reset and seed demo data.

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.
