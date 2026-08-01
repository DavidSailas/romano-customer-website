# Automated GCash / Bank checkout — setup

This wires your checkout up to PayMongo's Payment Intent API so GCash and
Bank Transfer work the way Shopee/Lazada do: pick the method → get sent to
the real GCash/bank confirm-to-pay screen → get sent back → order is marked
paid automatically. Cash on Delivery is unaffected (still instant, no gateway).

## Files added / changed

- `supabase/orders_migration.sql` — new `orders` table (run this first).
- `lib/paymongo.ts` — server-only helper for PayMongo's API.
- `app/api/checkout/route.ts` — creates the pending order + PayMongo Payment
  Intent, returns the checkout URL to redirect the customer to.
- `app/api/webhooks/paymongo/route.ts` — PayMongo calls this when the
  customer actually confirms (or cancels) payment. **This is the only place
  that marks an order "paid."**
- `page.tsx` — updated checkout flow, bank picker, real order history.

> Adjust the `page.tsx` file path to wherever your dashboard route actually
> lives in your project (e.g. `app/dashboard/page.tsx`) — it was flattened
> here since only that one file was uploaded.

## 1. Run the migration

Paste `supabase/orders_migration.sql` into the Supabase SQL editor and run it.

## 2. Environment variables

Add to `.env.local` (and your hosting provider's env settings):

```
PAYMONGO_SECRET_KEY=sk_test_xxxxxxxx        # from PayMongo Dashboard → Developers
PAYMONGO_WEBHOOK_SECRET=whsk_xxxxxxxx       # from the webhook you create in step 3
SUPABASE_SERVICE_ROLE_KEY=xxxxxxxx          # Supabase → Settings → API (keep this server-only!)
```

You should already have `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_ANON_KEY` set for the rest of the app to work — the new
routes reuse those.

## 3. Register the webhook

In the PayMongo Dashboard: **Developer Tools → Webhooks → Add endpoint**

- URL: `https://yourdomain.com/api/webhooks/paymongo`
- Events: `payment.paid`, `payment.failed`

PayMongo shows you a webhook secret (`whsk_...`) once — copy it into
`PAYMONGO_WEBHOOK_SECRET`. Webhooks need a real HTTPS URL, so this step only
works once the app is deployed (or tunneled with something like ngrok for
local testing).

## 4. Go live checklist

- Swap `sk_test_...` for your live secret key, and register a **separate**
  live webhook endpoint (test and live webhooks are independent).
- BPI/UnionBank/BDO/Metrobank/Landbank each have per-transaction limits
  (₱50k–₱100k) — see PayMongo's Direct Online Banking docs if you expect
  larger orders.
- GCash payments expire after 4 hours if the customer never confirms; the
  order just stays "pending" — nothing is charged.

## How it behaves now

- **GCash / Bank**: order is written as `payment_status: "pending"` →
  customer is redirected to the real GCash/bank screen → they confirm (or
  cancel) there → PayMongo's webhook flips it to `paid` or `payment_failed`
  → customer lands back on `/dashboard` and sees the matching confirmation.
- **Cash on Delivery**: unchanged, written straight away as
  `payment_status: "cod_pending"`.
- **My Orders** only lists orders that are `paid` or `cod_pending`, so an
  abandoned GCash/bank attempt won't clutter the list.
