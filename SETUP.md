# Wiring up automatic GCash/bank confirmation

## 1. Database
Run `migration.sql` in Supabase SQL editor. Adds `items`, `delivery_fee`,
`payment_method`, `paymongo_checkout_session_id`, `paid_at` to `orders`.

## 2. Environment variables
Add to `.env.local` (and your host's env settings):

```
SUPABASE_SERVICE_ROLE_KEY=<Supabase → Project Settings → API → service_role key>
PAYMONGO_WEBHOOK_SECRET=<from step 3 below>
```

`SUPABASE_SERVICE_ROLE_KEY` is different from your anon key — it bypasses RLS,
so it must never be exposed to the browser or committed publicly (server-only,
which is why it only appears in `lib/supabase/admin.ts` and API routes).

## 3. Register the webhook in PayMongo
In test mode first:
1. PayMongo dashboard → **Developers → Webhooks → Add Webhook**
2. URL: `https://<your-domain>/api/webhooks/paymongo` (needs a public URL —
   use `ngrok http 3000` or similar while testing locally, since PayMongo can't
   reach `localhost`)
3. Events to send: `checkout_session.payment.paid`, `checkout_session.payment.failed`,
   `checkout_session.expired`
4. Copy the **Signing Secret** shown after creation → that's `PAYMONGO_WEBHOOK_SECRET`
5. Repeat once you go live, using your live domain — live and test webhooks are
   separate, each with their own secret

## 4. Files to drop in
```
lib/supabase/admin.ts                 → new
app/api/checkout/route.ts             → replaces existing
app/api/webhooks/paymongo/route.ts    → new (empty folder in your project already)
```
Then apply `page.tsx.patch.md` and `placeOrder.patch.md` to your existing `page.tsx`.

## 5. Test end-to-end
1. Place an order with GCash in **test mode** (test API key is already in your `.env.local`)
2. Use PayMongo's test GCash flow — it auto-approves without a real OTP
3. Watch your terminal/logs: the webhook should hit within a couple seconds
4. Dashboard should flip from "Confirming your payment…" to your normal
   order-placed confirmation, automatically — no manual check needed

## What changed conceptually
- Order now exists in the DB the moment checkout starts (`pending_payment`),
  not after — so nothing is lost if the customer closes the tab mid-payment
- PayMongo, not your frontend, is the source of truth for "did the money
  actually arrive" — the webhook is the only thing allowed to mark an order paid
- The frontend just asks "is it paid yet?" a few times after redirect, which is
  what makes the confirmation feel instant and automatic, same as Shopify/Lazada etc.
