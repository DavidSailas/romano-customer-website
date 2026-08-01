# Patch for page.tsx

Paste this in two spots. Both use state/imports that already exist in your file
(`router`, `searchParams`, `setOrderPlaced`, `setPlacedOrderId`, `supabase`).

## 1. Add new state (near your other checkout state, ~line 217)

```ts
const [confirmingPayment, setConfirmingPayment] = useState(false);
const [paymentFailed, setPaymentFailed] = useState(false);
```

## 2. Add this effect (right after the existing `category` searchParams effect, ~line 244)

```ts
// Handles the redirect back from PayMongo. The webhook is what actually marks
// the order "placed" — this just polls until that's happened, so the customer
// sees an automatic confirmation instead of a static "thank you" that might be lying.
useEffect(() => {
  const orderStatus = searchParams.get("order");
  const orderId = searchParams.get("order_id");
  if (!orderId) return;

  if (orderStatus === "cancelled") {
    setPaymentFailed(true);
    router.replace("/dashboard");
    return;
  }

  if (orderStatus !== "success") return;

  setConfirmingPayment(true);
  let cancelled = false;
  let attempts = 0;

  async function poll() {
    attempts += 1;
    const { data } = await supabase
      .from("orders")
      .select("id, status")
      .eq("id", orderId)
      .single();

    if (cancelled) return;

    if (data?.status === "placed") {
      setConfirmingPayment(false);
      setOrderPlaced(true);
      setPlacedOrderId(orderId);
      router.replace("/dashboard"); // clean the URL
      return;
    }

    if (data?.status === "failed") {
      setConfirmingPayment(false);
      setPaymentFailed(true);
      router.replace("/dashboard");
      return;
    }

    // Webhooks usually land in 1-3s. Keep checking for up to ~30s in case
    // PayMongo is slow, then give up gracefully.
    if (attempts < 15) {
      setTimeout(poll, 2000);
    } else {
      setConfirmingPayment(false);
      setPaymentFailed(true);
      router.replace("/dashboard");
    }
  }

  poll();
  return () => {
    cancelled = true;
  };
}, [searchParams]);
```

## 3. Show a "confirming" state while it polls

Drop this wherever fits your layout (e.g. right before your existing order-success
modal/banner that sets on `orderPlaced`):

```tsx
{confirmingPayment && (
  <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(28,24,21,0.4)" }}>
    <div className="card p-8 text-center max-w-sm">
      <Loader2 className="animate-spin mx-auto mb-4" size={28} />
      <p className="font-display text-lg mb-1">Confirming your payment…</p>
      <p className="text-sm opacity-60">This usually takes a few seconds.</p>
    </div>
  </div>
)}

{paymentFailed && (
  <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(28,24,21,0.4)" }}>
    <div className="card p-8 text-center max-w-sm">
      <p className="font-display text-lg mb-1">Payment wasn't completed</p>
      <p className="text-sm opacity-60 mb-4">No charge was made. You can try again from your cart.</p>
      <button className="btn-primary" onClick={() => setPaymentFailed(false)}>Close</button>
    </div>
  </div>
)}
```

Your existing `orderPlaced` UI (whatever you already show for the COD flow) will
now fire automatically for GCash/bank too, once `setOrderPlaced(true)` runs above —
no extra work needed there.
