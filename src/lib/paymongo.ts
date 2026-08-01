// Thin wrapper around the PayMongo Payment Intent API.
// Docs: https://docs.paymongo.com/docs/payment-acceptance-introduction
//
// Everything here runs on the server (inside app/api/checkout/route.ts),
// so it's safe to use the PAYMONGO_SECRET_KEY. Never import this file
// from a "use client" component.

const PAYMONGO_API = "https://api.paymongo.com/v1";

function authHeader() {
  const secretKey = process.env.PAYMONGO_SECRET_KEY;
  if (!secretKey) {
    throw new Error("PAYMONGO_SECRET_KEY is not set in your environment variables.");
  }
  // PayMongo uses HTTP Basic auth: the API key as the username, empty password.
  return "Basic " + Buffer.from(`${secretKey}:`).toString("base64");
}

async function paymongoRequest(path: string, method: "GET" | "POST", body?: unknown) {
  const res = await fetch(`${PAYMONGO_API}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader(),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();

  if (!res.ok) {
    const detail = data?.errors?.[0]?.detail || `PayMongo request to ${path} failed (${res.status}).`;
    throw new Error(detail);
  }

  return data;
}

/** GCash and Maya/GrabPay/ShopeePay all use this same "type" as an e-wallet. */
export type EwalletType = "gcash";

/**
 * Direct bank payment method types. BPI and UnionBank go through PayMongo's
 * own "dob" (Direct Online Banking) integration; BDO, Landbank, and Metrobank
 * go through their Brankas-powered "brankas" integration. Both attach to a
 * Payment Intent the same way and both redirect to the bank's own login page.
 * See: https://docs.paymongo.com/docs/payment-acceptance-direct-online-banking
 */
export type BankMethodType = "dob" | "brankas";

export const BANK_CODE_TO_METHOD_TYPE: Record<string, BankMethodType> = {
  bpi: "dob",
  ubp: "dob",
  bdo: "brankas",
  landbank: "brankas",
  metrobank: "brankas",
};

export const BANK_OPTIONS: { code: string; label: string }[] = [
  { code: "bpi", label: "BPI Online" },
  { code: "ubp", label: "UnionBank Online" },
  { code: "bdo", label: "BDO Online Banking" },
  { code: "metrobank", label: "Metrobank Online" },
  { code: "landbank", label: "Landbank iAccess" },
];

/** Step 1 of 3: open a Payment Intent for the order total. */
export async function createPaymentIntent(params: {
  amountCentavos: number;
  methodTypes: string[];
  description: string;
}) {
  return paymongoRequest("/payment_intents", "POST", {
    data: {
      attributes: {
        amount: params.amountCentavos,
        currency: "PHP",
        payment_method_allowed: params.methodTypes,
        description: params.description,
        capture_type: "automatic",
      },
    },
  });
}

/** Step 2 of 3: create the Payment Method the customer picked. */
export async function createPaymentMethod(type: EwalletType | BankMethodType, bankCode?: string) {
  return paymongoRequest("/payment_methods", "POST", {
    data: {
      attributes: bankCode ? { type, details: { bank_code: bankCode } } : { type },
    },
  });
}

/**
 * Step 3 of 3: attach the Payment Method to the Payment Intent. The response's
 * next_action.redirect.url is the GCash / bank login page to send the
 * customer to — this is the actual "confirm to pay" screen, hosted by
 * PayMongo / GCash / the bank, not something we build ourselves.
 */
export async function attachPaymentMethod(params: {
  paymentIntentId: string;
  paymentMethodId: string;
  returnUrl: string;
}) {
  return paymongoRequest(`/payment_intents/${params.paymentIntentId}/attach`, "POST", {
    data: {
      attributes: {
        payment_method: params.paymentMethodId,
        return_url: params.returnUrl,
      },
    },
  });
}

/** Fallback check used by the success page in case the webhook is delayed. */
export async function retrievePaymentIntent(paymentIntentId: string) {
  return paymongoRequest(`/payment_intents/${paymentIntentId}`, "GET");
}
