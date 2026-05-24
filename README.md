# Inventory Reservation System

A full-stack inventory reservation service built with **Next.js 15**, **Prisma**, and **PostgreSQL**. It lets customers temporarily hold stock across warehouses before committing to purchase — preventing overselling without permanently reducing inventory until a sale is confirmed.

---

## Problem Understanding

### The Core Challenge: Soft vs Hard Inventory Locks

E-commerce inventory has a tricky lifecycle. When a user clicks "Buy", you don't want to:

- **Immediately deduct** stock — the user might abandon checkout
- **Do nothing** — two users could race to buy the last item, and one gets disappointed at payment

The solution is a **two-phase reservation**:

1. **Reserve** — temporarily lock units (stock is held, not sold)
2. **Confirm** — convert the hold to an actual sale, or **Release** — free the hold if the user leaves

This requires careful thinking about three failure modes:

| Failure Mode | Consequence | Mitigation |
|---|---|---|
| Two requests reserve the last unit simultaneously | Oversell | Atomic transaction on reservation creation |
| User abandons checkout | Units locked forever | TTL (10-min expiry) + cleanup job |
| Payment fails after confirm | Inventory already decremented | Separate refund/restock flow (future work) |

### Data Model Rationale

The key insight is splitting inventory into two counters:

```
availableUnits = totalUnits - reservedUnits
```

- `totalUnits` — physical units in the warehouse
- `reservedUnits` — units currently held by PENDING reservations
- `availableUnits` — what a new customer can actually buy

When a reservation is **confirmed**, both `totalUnits` and `reservedUnits` decrement (units leave the warehouse). When **released** or expired, only `reservedUnits` decrements — units return to the available pool without a physical move.

This avoids the common mistake of treating reserved stock as "gone" immediately, which makes reporting and rollback much harder.

### Reservation Lifecycle

```
                    ┌─────────┐
                    │ PENDING │  ← stock locked, 10-min TTL
                    └────┬────┘
            confirm/     │       \  release / expire
            payment      │        \
                         ▼         ▼
                   ┌──────────┐  ┌──────────┐
                   │CONFIRMED │  │ RELEASED │
                   └──────────┘  └──────────┘
                   (sale finalised) (stock freed)
```

---

## Running Locally

### Prerequisites

- Node.js 18+
- PostgreSQL — a local install, Docker, or a free [Supabase](https://supabase.com) project all work

### 1. Clone and install

```bash
git clone https://github.com/Sathwikaa7/inventory-reserve.git
cd inventory-reserve
npm install
```

### 2. Set environment variables

Create a `.env` file in the project root:

```env
# PostgreSQL connection string
# Local example:
DATABASE_URL="postgresql://postgres:password@localhost:5432/inventory_reserve"

# Supabase example (use the "Transaction" pooler URL from Project Settings → Database):
# DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string. Prisma uses this for all DB operations. |

> **Supabase note:** Use the **Transaction pooler** URL (port `6543`) rather than the direct connection (port `5432`) to stay within connection limits on the free tier. Append `?pgbouncer=true` to the URL.

### 3. Run migrations

```bash
npx prisma migrate dev --name init
```

This applies the schema in `prisma/schema.prisma` — creating the `Product`, `Warehouse`, `Inventory`, and `Reservation` tables.

### 4. Seed the database

```bash
npm run seed
```

This populates the database with 2 warehouses and 3 products (see [Seed Data](#seed-data) below). Re-run any time to reset to a clean state.

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You should see the product catalogue with per-warehouse availability.

### Full setup in one block

```bash
git clone https://github.com/Sathwikaa7/inventory-reserve.git
cd inventory-reserve
npm install
echo 'DATABASE_URL="postgresql://postgres:password@localhost:5432/inventory_reserve"' > .env
npx prisma migrate dev --name init
npm run seed
npm run dev
```

---

## How the Expiry Mechanism Works in Production

### What the TTL does

When a reservation is created, it is given an `expiresAt` timestamp 10 minutes in the future:

```ts
// src/app/api/reservations/route.ts
expiresAt: new Date(Date.now() + 10 * 60 * 1000)
```

The frontend countdown timer reads this value and shows the user how long they have. If the timer reaches zero, the UI shows an expiry toast and the confirm button is disabled.

However, **the expiry is not self-enforcing in the database**. A PENDING reservation with a past `expiresAt` does not automatically free its locked `reservedUnits` — something has to call the cleanup endpoint to do that.

### The cleanup endpoint

`POST /api/cleanup-expired-reservations` does the following in a loop:

1. Finds all PENDING reservations where `expiresAt < now`
2. For each one, opens a transaction that decrements `reservedUnits` on the inventory row and marks the reservation RELEASED

### Wiring it up in production (Vercel)

The cleanup endpoint is a standard Next.js API route. On Vercel, you schedule it with a **Vercel Cron Job** by adding a `vercel.json` at the project root:

```json
{
  "crons": [
    {
      "path": "/api/cleanup-expired-reservations",
      "schedule": "* * * * *"
    }
  ]
}
```

`"* * * * *"` runs every minute, which is fine for a 10-minute TTL — worst case, a user's freed stock is invisible for up to 60 seconds after their reservation expires. Cron Jobs are available on the Vercel Hobby plan (free tier).

> **Security note:** The cleanup endpoint currently has no auth. In production, protect it so only the scheduler can call it — the simplest approach is a shared secret:
>
> ```ts
> // In the route handler
> if (request.headers.get("x-cron-secret") !== process.env.CRON_SECRET) {
>   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
> }
> ```
>
> Set `CRON_SECRET` as an environment variable in Vercel and pass it in the cron request header via Vercel's cron authentication.

### On other platforms

| Platform | Approach |
|---|---|
| **Railway / Render** | Add a separate service that runs `node -e "fetch('https://yourapp.com/api/cleanup-expired-reservations', {method:'POST'})"` on a 1-minute cron |
| **Self-hosted** | System crontab: `* * * * * curl -X POST https://yourapp.com/api/cleanup-expired-reservations` |
| **Serverless (no cron)** | Piggyback cleanup on the `GET /api/products` route — run a lightweight expiry sweep on every product list load. Less precise, but zero infrastructure. |

---

## Trade-offs and What I'd Do Differently

### 1. Race condition on reservation creation

**What I built:** `POST /api/reservations` reads available inventory and then updates it in two separate queries — no wrapping transaction.

**The problem:** Under concurrent load, two simultaneous requests for the last unit can both pass the availability check before either has committed. Both reservations get created and `reservedUnits` ends up overcounting, meaning `availableUnits` goes negative.

**What I'd do:** Wrap the entire read-check-update in `prisma.$transaction`, or use a raw SQL `UPDATE ... WHERE reservedUnits + $quantity <= totalUnits RETURNING *` that fails atomically if there's no stock. The latter avoids a round-trip and is more correct under high concurrency.

```ts
// Safer approach with a single atomic update
const updated = await prisma.$executeRaw`
  UPDATE "Inventory"
  SET "reservedUnits" = "reservedUnits" + ${quantity}
  WHERE id = ${inventory.id}
    AND ("totalUnits" - "reservedUnits") >= ${quantity}
`;
if (updated === 0) return insufficientStockError();
```

### 2. Cleanup runs serially, not in parallel

**What I built:** The cleanup route processes expired reservations in a `for` loop, opening a new transaction for each one.

**The problem:** If there are many expired reservations (e.g., after a traffic spike), cleanup becomes slow and may time out on serverless with a short function timeout.

**What I'd do:** Batch the updates into a single transaction, or use `prisma.$transaction([...ops])` with all the updates built up front.

### 3. No input validation

**What I built:** `POST /api/reservations` destructures the request body and passes values straight to Prisma with no type or bounds checking.

**The problem:** A `quantity` of `0`, `-1`, or `"banana"` will either produce a confusing DB error or silently succeed with nonsensical data. The package.json already includes `zod` — it just isn't used in the API routes.

**What I'd do:** Add Zod schemas at the route boundary. This was a time trade-off — the Zod dependency is there, the schema would take 10 minutes to add.

```ts
const schema = z.object({
  productId: z.string().cuid(),
  warehouseId: z.string().cuid(),
  quantity: z.int().positive().max(100),
});
```

### 4. No auth or ownership

**What I built:** Any client that knows a reservation ID can confirm or release it. IDs are CUIDs (hard to guess) which provides minimal security by obscurity.

**The problem:** In a real system a customer should only be able to act on their own reservation. Without session tracking, a malicious actor who intercepts a reservation ID could confirm or release someone else's order.

**What I'd do:** Store a `userId` or `sessionToken` on the reservation at creation time and verify it on confirm/release. For this project's scope (no auth layer), a short-lived signed token (e.g. JWT with the reservation ID as the subject, 10-minute expiry) passed back to the client at reservation time would be the minimal viable approach.

### 5. Cleanup is best-effort, not guaranteed

**What I built:** Expiry enforcement depends on the cron calling the cleanup endpoint. If the cron fails, stock stays locked indefinitely.

**What I'd do with more time:** The `confirm` endpoint already checks `expiresAt` before finalising a sale, which is the critical path — so overselling from an expired reservation is impossible. But the stock remains invisible to new customers. A belt-and-suspenders approach would be to also filter out expired PENDING reservations when computing `availableUnits` in `GET /api/products`, so availability is always accurate even if cleanup hasn't run:

```ts
// In the products query, compute reservedUnits excluding expired reservations
reservedUnits = SUM(quantity WHERE status = 'PENDING' AND expiresAt > NOW())
```

---

## Architecture

```
src/
├── app/
│   ├── api/
│   │   ├── products/               # GET  — list products with per-warehouse availability
│   │   ├── warehouses/             # GET  — list warehouses
│   │   ├── reservations/
│   │   │   ├── route.ts            # POST — create reservation (locks stock)
│   │   │   └── [id]/
│   │   │       ├── route.ts        # GET  — fetch reservation details
│   │   │       ├── confirm/        # POST — confirm (deduct from totalUnits)
│   │   │       └── release/        # POST — release (free reservedUnits)
│   │   ├── sold-stats/             # GET  — sold quantity aggregates
│   │   ├── confirmation/[id]/      # GET  — post-purchase page data
│   │   └── cleanup-expired-reservations/ # POST — sweep expired PENDING reservations
│   ├── page.tsx                    # Product catalogue
│   ├── reservation/[id]/page.tsx   # Checkout / confirm flow with countdown timer
│   └── confirmation/[id]/page.tsx  # Post-purchase confirmation
├── lib/prisma.ts                   # Prisma singleton (prevents connection exhaustion)
└── types/index.ts                  # Shared TypeScript interfaces
prisma/
├── schema.prisma                   # Data model
└── seed.ts                         # Dev seed (2 warehouses, 3 products)
```

---

## API Reference

### `POST /api/reservations`
Creates a reservation and locks `reservedUnits` on the inventory row.

**Request**
```json
{ "productId": "...", "warehouseId": "...", "quantity": 1 }
```

**Response** `200 OK`
```json
{
  "id": "clx...",
  "status": "PENDING",
  "expiresAt": "2024-01-01T12:10:00.000Z"
}
```

**Errors:** `404` inventory not found · `409` insufficient stock

---

### `POST /api/reservations/:id/confirm`
Finalises the sale inside a transaction. Decrements both `totalUnits` and `reservedUnits`.

**Errors:** `410` reservation expired · `500` reservation not in PENDING state

---

### `POST /api/reservations/:id/release`
Cancels a reservation. Decrements `reservedUnits` only; no physical stock change.

---

### `POST /api/cleanup-expired-reservations`
Sweeps PENDING reservations past `expiresAt`, releasing their locked units. Intended to be called by a scheduler — not a user-facing endpoint.

**Response**
```json
{ "success": true, "cleaned": 3 }
```

---

## Seed Data

| Product | Mumbai Warehouse | Delhi Warehouse |
|---|---|---|
| iPhone 15 | 10 units | 5 units |
| PlayStation 5 | 7 units | 3 units |
| AirPods Pro | 15 units | 12 units |

Run `npm run seed` to reset to this state at any time.
