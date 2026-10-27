/**
 * Safaricom M-Pesa Daraja (Lipa na M-PESA Online / STK Push) helpers.
 * Server-side only: every credential here stays in environment variables.
 *
 * Docs: https://developer.safaricom.co.ke/
 */

type MpesaConfig = {
  baseUrl: string;
  consumerKey: string;
  consumerSecret: string;
  shortcode: string;
  passkey: string;
  callbackUrl: string;
};

const SANDBOX_BASE = "https://sandbox.safaricom.co.ke";
const PRODUCTION_BASE = "https://api.safaricom.co.ke";

export function isMpesaConfigured(): boolean {
  return Boolean(
    process.env.MPESA_CONSUMER_KEY &&
      process.env.MPESA_CONSUMER_SECRET &&
      process.env.MPESA_SHORTCODE &&
      process.env.MPESA_PASSKEY
  );
}

function getMpesaConfig(): MpesaConfig {
  const isProduction = (process.env.MPESA_ENV ?? "sandbox") === "production";
  const vercelUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

  return {
    baseUrl: isProduction ? PRODUCTION_BASE : SANDBOX_BASE,
    consumerKey: process.env.MPESA_CONSUMER_KEY ?? "",
    consumerSecret: process.env.MPESA_CONSUMER_SECRET ?? "",
    shortcode: process.env.MPESA_SHORTCODE ?? "",
    passkey: process.env.MPESA_PASSKEY ?? "",
    callbackUrl:
      process.env.MPESA_CALLBACK_URL ?? `${vercelUrl}/api/mpesa/callback`,
  };
}

/** Access tokens are valid ~3599s; cache and refresh lazily. */
let tokenCache: { token: string; expiresAt: number } | null = null;

async function getAccessToken(config: MpesaConfig): Promise<string> {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 30_000) {
    return tokenCache.token;
  }

  const auth = Buffer.from(
    `${config.consumerKey}:${config.consumerSecret}`
  ).toString("base64");

  const res = await fetch(
    `${config.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
    {
      headers: { Authorization: `Basic ${auth}` },
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
    }
  );

  if (!res.ok) {
    throw new Error(`M-Pesa token request failed (${res.status})`);
  }

  const data = (await res.json()) as {
    access_token: string;
    expires_in: string;
  };

  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + Number(data.expires_in ?? 3599) * 1000,
  };
  return tokenCache.token;
}

function buildStkCredentials(config: MpesaConfig) {
  // Timestamp: YYYYMMDDHHmmss — same string used for password and payload.
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const timestamp =
    `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
    `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

  const password = Buffer.from(
    `${config.shortcode}${config.passkey}${timestamp}`
  ).toString("base64");

  return { password, timestamp };
}

export type StkPushResult = {
  checkoutRequestId: string;
  merchantRequestId: string;
  customerMessage: string;
};

export class MpesaError extends Error {
  constructor(message: string, public readonly status = 502) {
    super(message);
  }
}

/**
 * Initiates an STK push to the customer's phone. A successful call only means
 * Safaricom accepted the request — the payment itself is confirmed by the
 * callback to /api/mpesa/callback.
 */
export async function stkPush(params: {
  phone: string; // 2547XXXXXXXX
  amount: number; // whole KES
  accountReference: string; // max ~12 chars shown on the STK prompt
  description: string; // max ~13 chars
}): Promise<StkPushResult> {
  const config = getMpesaConfig();
  const token = await getAccessToken(config);
  const { password, timestamp } = buildStkCredentials(config);

  const res = await fetch(
    `${config.baseUrl}/mpesa/stkpush/v1/processrequest`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        BusinessShortCode: config.shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: Math.ceil(params.amount),
        PartyA: params.phone,
        PartyB: config.shortcode,
        PhoneNumber: params.phone,
        CallBackURL: config.callbackUrl,
        AccountReference: params.accountReference.slice(0, 12),
        TransactionDesc: params.description.slice(0, 13),
      }),
      signal: AbortSignal.timeout(20_000),
      cache: "no-store",
    }
  );

  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;

  if (!res.ok || String(data.ResponseCode ?? "1") !== "0") {
    const message =
      (data.errorMessage as string) ||
      (data.ResponseDescription as string) ||
      `M-Pesa request failed (${res.status})`;
    throw new MpesaError(message);
  }

  return {
    checkoutRequestId: String(data.CheckoutRequestID ?? ""),
    merchantRequestId: String(data.MerchantRequestID ?? ""),
    customerMessage:
      String(data.CustomerMessage ?? "") || "Enter your M-PESA PIN to pay.",
  };
}

/** Result of an STK push lookup, used for reconciliation/debugging. */
export async function stkQuery(checkoutRequestId: string): Promise<{
  resultCode: number;
  resultDesc: string;
}> {
  const config = getMpesaConfig();
  const token = await getAccessToken(config);
  const { password, timestamp } = buildStkCredentials(config);

  const res = await fetch(`${config.baseUrl}/mpesa/stkpushquery/v1/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      BusinessShortCode: config.shortcode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId,
    }),
    signal: AbortSignal.timeout(20_000),
    cache: "no-store",
  });

  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;

  if (!res.ok && data.errorCode) {
    throw new MpesaError(String(data.errorMessage ?? "STK query failed"));
  }

  return {
    resultCode: Number(data.ResultCode ?? -1),
    resultDesc: String(data.ResultDesc ?? ""),
  };
}

/** Extracts named items from a Daraja CallbackMetadata. */
export function readCallbackMetadata(
  items: Array<{ Name?: string; Value?: unknown }> | undefined,
  name: string
): unknown {
  return items?.find((item) => item.Name === name)?.Value;
}