import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";

// Verifies the "Paymongo-Signature" header so random requests can't fake a paid order.
// Header looks like: t=1700000000,te=<test_hmac>,li=<live_hmac>
function verifySignature(rawBody: string, signatureHeader: string | null, secret: string) {
  if (!signatureHeader) return false;

  const parts = Object.fromEntries(
    signatureHeader.split(",").map((p) => p.split("=") as [string, string])
  );
  const timestamp = parts.t;
  const candidate = parts.li || parts.te; // live signature if present, else test
  if (!timestamp || !candidate) return false;

  const signedPayload = `${timestamp}.${rawBody}`;
  const expected = crypto.createHmac("sha256", secret).update(signedPayload).digest("hex");

  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(candidate));
  } catch {
    return false; // length mismatch etc.
  }
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signatureHeader = req.headers.get("paymongo-signature");

  if (!process.env.PAYMONGO_WEBHOOK_SECRET) {
    console.error("PAYMONGO_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  if (!verifySignature(rawBody, signatureHeader, process.env.PAYMONGO_WEBHOOK_SECRET)) {
    console.error("Webhook signature verification failed");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody);
  const eventType = event?.data?.attributes?.type;
  const eventData = event?.data?.attributes?.data;

  console.log("PayMongo webhook received:", eventType);

  try {
    if (eventType === "checkout_session.payment.paid") {
      const orderId = eventData?.attributes?.metadata?.order_id;

      if (!orderId) {
        console.error("No order_id in webhook metadata", eventData?.attributes?.metadata);
        return NextResponse.json({ received: true }); // ack anyway, nothing to do
      }

      // Only proceed if this order hasn't already been marked paid — .select()
      // afterward tells us whether the update actually matched a row.
      const { data: updatedOrders, error: updateError } = await supabaseAdmin
        .from("orders")
        .update({ status: "placed", paid_at: new Date().toISOString() })
        .eq("id", orderId)
        .eq("status", "pending_payment")
        .select("id, items");

      if (updateError) {
        console.error("Failed to update order:", updateError.message);
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      const order = updatedOrders?.[0];
      if (order?.items) {
        // Decrement stock for each purchased item now that payment is confirmed.
        const items = order.items as { id: string }[];
        for (const item of items) {
          const { error: stockError } = await supabaseAdmin.rpc("decrement_stock", {
            product_id: item.id,
            qty: 1,
          });
          if (stockError) {
            console.error(`Failed to decrement stock for product ${item.id}:`, stockError.message);
          }
        }
      } else {
        console.log(`Order ${orderId} already processed or not found — skipping stock update.`);
      }
    }

    if (
      eventType === "checkout_session.payment.failed" ||
      eventType === "checkout_session.expired"
    ) {
      const orderId = eventData?.attributes?.metadata?.order_id;
      if (orderId) {
        await supabaseAdmin
          .from("orders")
          .update({ status: "failed" })
          .eq("id", orderId)
          .eq("status", "pending_payment");
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("Webhook handler error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
