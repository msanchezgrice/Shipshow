# Shipshow.io – Engineering Handoff

This file summarizes the current state, what was implemented, known issues, and how to operate the app in development and production.

## Repo, Deploy, Stack
- Repo: msanchezgrice/Shipshow (remote moved from `projectproof`)
- Deploy: Vercel (Next.js 14 App Router + Tailwind)
- DB: Supabase Postgres via Prisma
- Auth: Clerk (prod) with a built‑in mock for dev
- Billing: Stripe (mockable)
- Domains: Vercel Domains API (optional)

## Implemented in this iteration
- Dev mock mode (no external services) via `@/lib/auth/*`, `@/lib/mockDb`, `@/lib/stripe`.
- Brand to `shipshow.io` across UI and metadata; added favicon.
- Clerk hardening: browser‑only init; safe sign out (`SignOutControl`).
- DB bootstrap in CI: `prisma db push` on build to create tables on fresh DBs.
- Type and UX polish in dashboard; ensured mock DB returns all relations.

## Vercel envs
Required:
- `DATABASE_URL` – Supabase pooled PgBouncer URL (`:6543` + `sslmode=require&pgbouncer=true`)
- `NEXT_PUBLIC_APP_URL` – e.g., `https://shipshow.io`
- `NEXT_PUBLIC_ROOT_DOMAIN` – e.g., `shipshow.io`
- `NEXT_PUBLIC_USE_MOCKS` – `0` for prod; `1` for dev without real services
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`

Optional (Stripe live): `NEXT_PUBLIC_STRIPE_PRICE_ID`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
Optional (Domains): `VERCEL_PROJECT_ID`, `VERCEL_AUTH_TOKEN`

## Clerk configuration
- Home URL: `https://shipshow.io/`
- Sign in: `https://shipshow.io/sign-in`
- Sign up: `https://shipshow.io/sign-up`
- After sign in/up: `/dashboard`
- Allowed origins include `https://shipshow.io`

Avoid using `accounts.shipshow.io` portal paths for now (caused client errors).

## Supabase schema – idempotent SQL
Run this in SQL editor.

```sql
create or replace function trigger_set_timestamp()
returns trigger as $$
begin
  new."updatedAt" = now();
  return new;
end;
$$ language plpgsql;

create table if not exists "User" (
  "id" text primary key,
  "handle" text not null unique,
  "name" text,
  "bio" text,
  "avatarUrl" text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create table if not exists "Project" (
  "id" text primary key,
  "userId" text not null,
  "title" text not null,
  "description" text,
  "url" text,
  "imageUrl" text,
  "sort" integer not null default 0,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  constraint "Project_userId_fkey" foreign key ("userId") references "User"("id") on delete cascade
);

create table if not exists "Subscription" (
  "id" text primary key,
  "userId" text not null unique,
  "stripeCustomerId" text,
  "stripeSubscriptionId" text,
  "status" text not null default 'free',
  "priceId" text,
  "currentPeriodEnd" timestamptz,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  constraint "Subscription_userId_fkey" foreign key ("userId") references "User"("id") on delete cascade
);

create table if not exists "Domain" (
  "id" text primary key,
  "userId" text not null,
  "domain" text not null unique,
  "handle" text not null,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  constraint "Domain_userId_fkey" foreign key ("userId") references "User"("id") on delete cascade
);

create index if not exists "Project_userId_sort_idx" on "Project" ("userId","sort");
create index if not exists "Domain_domain_idx" on "Domain" ("domain");

drop trigger if exists set_timestamp_user on "User";
drop trigger if exists set_timestamp_project on "Project";
drop trigger if exists set_timestamp_subscription on "Subscription";
drop trigger if exists set_timestamp_domain on "Domain";

create trigger set_timestamp_user before update on "User"
for each row execute function trigger_set_timestamp();
create trigger set_timestamp_project before update on "Project"
for each row execute function trigger_set_timestamp();
create trigger set_timestamp_subscription before update on "Subscription"
for each row execute function trigger_set_timestamp();
create trigger set_timestamp_domain before update on "Domain"
for each row execute function trigger_set_timestamp();
```

## Runtime gating
- Free plan: 5 projects (`MAX_FREE_PROJECTS = 5`)
- Paid: unlimited projects + custom domains
- Paid state: `Subscription.status = 'active'` (via Stripe webhook or mock checkout in dev)

## Known issues
- Occasional Clerk sign‑out error (mitigated by `SignOutControl`).
- CI uses `prisma db push` (no migrations). Should be replaced by proper migrations + `prisma migrate deploy`.
- Domain attach assumes Vercel token/project envs present; minimal error handling.
- If `/dashboard` 500s: DB tables missing or no user row yet. Run SQL above, confirm pooled `DATABASE_URL`, sign up again.

## Test flow
1. Sign up at `/sign-up` → redirected to `/dashboard`.
2. Set handle and save (creates/updates user row).
3. Add a project; it appears immediately.
4. Visit `/{handle}` to view public page.
5. Billing (if live Stripe configured): start checkout at `/billing`, confirm webhook updates subscription to `active`.
6. Domains (paid): add domain, set CNAME to `cname.vercel-dns.com`; middleware rewrites domain to `/{handle}`.

## Files to review first
- `app/(dashboard)/dashboard/page.tsx`, `app/page.tsx`, `app/layout.tsx`
- `components/Nav.tsx`, `components/Pricing.tsx`
- `lib/auth/client.tsx`, `lib/auth/server.ts`
- `lib/prisma.ts`, `lib/subscription.ts`
- `app/api/*` and `middleware.ts`
