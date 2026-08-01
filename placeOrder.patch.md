# Patch for placeOrder() (~line 404 in page.tsx)

Add `paymentMethod` and `customerId` to the request body so the new checkout
route can save them on the order:

```ts
body: JSON.stringify({
  items: checkoutItems,
  deliveryFee,
  address: checkoutAddress,
  phone: checkoutPhone,
  customerEmail: user?.email,
  customerId: user?.id,
  paymentMethod,
}),
```
