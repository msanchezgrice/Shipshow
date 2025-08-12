# ProjectProof.io — Show your work. Get hired.

Dead-simple MVP: one page per user, 5 projects free, $9/mo for unlimited + custom domain.

## Stack & Why

- **Next.js 14 (App Router) + Tailwind** — simple, fast, works on Vercel.
- **Clerk** — plug-and-play auth with great DX.
- **Supabase Postgres (via Prisma)** — reliable Postgres you already know.
- **Stripe** — 1 subscription ($9/mo). Webhook updates your status.
- **Vercel Domains API** — connect custom domains, then map host → handle via middleware.

## Features

- Public landing page with clear positioning + pricing.
- Auth (sign in/up with Clerk).
- Dashboard: pick handle, add/edit projects, connect custom domain (paid).
- Public profile: `/{handle}` listing your projects.
- Free tier limits to 5 projects. Paid tier removes the limit + unlocks custom domain.
- Custom domains: CNAME → `cname.vercel-dns.com` + domain mapping in DB + middleware rewrite.

---

## Local Setup

1) **Clone & install**

```bash
npm install
```

2) (Optional) **Dev without external services (mock mode)**

Add this env to use built-in mocks for Clerk, Stripe, and an in-memory Prisma:

```
NEXT_PUBLIC_USE_MOCKS=1
```

Then run `npm run dev` and use Sign in/Sign up normally. The dashboard, billing, and CRUD flows will work locally without any external keys. Set `NEXT_PUBLIC_USE_MOCKS=0` to use real services.

3) **Create database** (Supabase or any Postgres). Grab the pooled connection string (PgBouncer/Transaction). Put it in `.env`:

```
DATABASE_URL=postgresql://postgres:[password]@[host]:6543/postgres?sslmode=require&pgbouncer=true
```

4) **Clerk keys** (Dashboard → API Keys).

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
```

5) **Stripe**

- Create product “ProjectProof Unlimited” with a **recurring $9/month** price.
- Put its price id here:

```
NEXT_PUBLIC_STRIPE_PRICE_ID=price_xxx
STRIPE_SECRET_KEY=sk_test_xxx
```

- Add a webhook endpoint to your deployed URL: `/api/webhooks/stripe` with events:
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`

6) **App URLs**

```
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_ROOT_DOMAIN=localhost:3000
```

7) **Prisma & DB schema**

```bash
npx prisma generate
npx prisma migrate dev --name init
```

8) **Run dev**

```bash
npm run dev
```

---

## Deploy on Vercel

1) Push to GitHub and **Import** the repo in Vercel.
2) Add all **Environment Variables** from `.env.example` to Vercel.
3) **Postgres**: use your Supabase connection string (pooled) in `DATABASE_URL`.
4) Run `npx prisma migrate deploy` in a CI step or Vercel build command includes `prisma generate`.
5) **Stripe webhook**: set it to `https://YOUR_DEPLOYMENT_URL/api/webhooks/stripe` with the 3 events above.
6) **Domains**:
   - Add `VERCEL_PROJECT_ID` and `VERCEL_AUTH_TOKEN` to enable the “Connect” button.
   - Paid users can add `yourdomain.com`. We call Vercel Domains API to attach it to your project.
   - Set a **CNAME** for your domain to `cname.vercel-dns.com`.
   - Our middleware rewrites `yourdomain.com` → `/{handle}` after you save the domain mapping.

> Note: Middleware fetches `GET /api/domain/resolve?host={domain}` to find the handle and rewrites to `/{handle}`. Keep this endpoint fast.

---

## Notes on Limits & Safety

- Free tier limit is enforced server-side on creation (`MAX_FREE_PROJECTS = 5`).
- CRUD endpoints verify the authenticated owner via Clerk `userId`.
- Stripe status drives gating: `subscription.status` = `active` unlocks unlimited + domains.

---

## What’s Missing (nice-to-haves)

- Image uploads (use Supabase Storage or UploadThing).
- Handle availability UI (currently validates on submit only).
- Better domain verification UI (poll Vercel domain config).
- Analytics and OpenGraph preview cards.

---

## Scripts

- `npm run dev` — start local dev.
- `npm run build` — build for production.
- `npm run start` — start production server.
- `npm run prisma:studio` — browse DB.

Enjoy 🚀
