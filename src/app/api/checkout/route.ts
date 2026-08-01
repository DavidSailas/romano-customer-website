import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const { items, deliveryFee, address, phone, customerEmail, customerId, paymentMethod } =
      await req.json();

    if (!items?.length) {
      return NextResponse.json({ error: "No items in order" }, { status: 400 });
    }

    const total = items.reduce((sum: number, i: any) => sum + i.price, 0) + (deliveryFee || 0);

    // 1. Save the order as pending BEFORE sending the customer to PayMongo.
    //    This is what the webhook will flip to "placed" once payment clears.
    const { data: order, error: insertError } = await supabaseAdmin
      .from("orders")
      .insert({
        customer_id: customerId ?? null,
        customer_email: customerEmail ?? null,
        total,
        delivery_fee: deliveryFee || 0,
        items,
        payment_method: paymentMethod,
        status: "pending_payment",
      })
      .select()
      .single();

    if (insertError || !order) {
      throw new Error(insertError?.message || "Could not create order");
    }

    const lineItems = items.map((item: any) => ({
      currency: "PHP",
      amount: item.price * 100, // PayMongo expects amounts in centavos
      name: item.title,
      quantity: 1,
    }));

    if (deliveryFee > 0) {
      lineItems.push({
        currency: "PHP",
        amount: deliveryFee * 100,
        name: "Delivery Fee",
        quantity: 1,
      });
    }

    const response = await fetch("https://api.paymongo.com/v1/checkout_sessions", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(process.env.PAYMONGO_SECRET_KEY + ":").toString("base64")}`,
      },
      body: JSON.stringify({
        data: {
          attributes: {
            line_items: lineItems,
            payment_method_types: ["gcash", "card", "paymaya"],
            // order id travels round-trip in the URL too, so the dashboard
            // can start polling for confirmation the instant the user lands back
            success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?order=success&order_id=${order.id}`,
            cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?order=cancelled&order_id=${order.id}`,
            description: "House of Romano Order Checkout",
            send_email_receipt: true,
            // this is how the webhook knows WHICH order just got paid
            metadata: { order_id: order.id },
            billing: {
              name: address.fullName || "Customer",
              email: customerEmail || "customer@example.com",
              phone: phone,
              address: {
                line1: address.houseStreet,
                city: address.city,
                state: address.province,
                postal_code: address.postalCode,
                country: "PH",
              },
            },
          },
        },
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      // roll back the pending order so it doesn't linger forever
      await supabaseAdmin.from("orders").delete().eq("id", order.id);
      throw new Error(result.errors?.[0]?.detail || "Failed to create checkout session");
    }

    await supabaseAdmin
      .from("orders")
      .update({ paymongo_checkout_session_id: result.data.id })
      .eq("id", order.id);

    return NextResponse.json({
      checkoutUrl: result.data.attributes.checkout_url,
      orderId: order.id,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
