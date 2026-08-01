# House of Romano — Landing Page Setup

## 1. Drop the file in
Copy `page.tsx` into your project at:

```
src/app/page.tsx
```

(replace whatever placeholder is already there)

## 2. Install the one dependency it needs
```bash
npm install lucide-react
```
Tailwind and Next.js are already in your `package.json`, so nothing else to add.

## 3. Fonts
The component pulls **Fraunces** (display serif) and **Inter** (body) from Google Fonts via
an `@import` inside its own `<style>` block, so it works immediately with zero config.

For production, it's better to load fonts through `next/font` instead (avoids a render-blocking
request). If you want that, say so and I'll swap the `@import` for a proper
`next/font/google` setup in `layout.tsx` — trivial change, just didn't want to touch your
`layout.tsx` without seeing it first.

## 4. Design system used
| Token | Hex | Use |
|---|---|---|
| Stone | `#EDE6D8` | page background |
| Ink | `#1C1815` | body text |
| Verde (Roman green) | `#2B3A2A` | primary buttons, marquee |
| Brass | `#A9813F` | eyebrows, accents |
| Oxide | `#8A3B2A` | small accent (cart badge) |

Signature visual motif: thin "pattern-room" construction lines (grainline, darts, notches) —
a nod to bespoke tailoring, drawn as inline SVG so there's no image dependency yet.

## 5. What's next (not built yet — you said landing first)
- **Catalog** — product grid + product detail pages, backed by a Supabase `products` table
- **Cart** — likely client-side state (Zustand or React context) synced to a Supabase `cart_items`
  table for logged-in users
- **Orders** — `orders` + `order_items` tables, checkout flow, and a payment provider (Stripe is
  the natural fit alongside Supabase)
- **Auth** — Supabase Auth for accounts/login, tied to the cart and order history

Happy to scaffold the Supabase schema and the catalog page next — just say the word.
