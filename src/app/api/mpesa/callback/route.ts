import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { readCallbackMetadata } from "@/lib/daraja";

export const dynamic = "force-dynamic";

type StkCallback = {
  MerchantRequestID?: string;
  CheckoutRequestID?: string;
  ResultCode?: number;
  ResultDesc?: string;
  CallbackMetadata?: { Item?: Array<{ Name?: string; Value?: unknown }> };
};

/**
 * Public M-PESA callback from Safaricom Daraja (no user session), so it uses
 * the service-role key (server-only) to update the contribution.
 * Always acknowledge with 200 so Daraja stops retrying.
 */
export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const callback: StkCallback | undefined =
      payload?.Body?.stkCallback;

    if (!callback?.CheckoutRequestID) {
      console.warn("M-Pesa callback without CheckoutRequestID");
      return NextResponse.json({ ResultCode: 0 });
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!serviceKey || !supabaseUrl) {
      console.error(
        "M-Pesa callback: SUPABASE_SERVICE_ROLE_KEY / NEXT_PUBLIC_SUPABASE_URL not set"
      );
      return NextResponse.json({ ResultCode: 0 });
    }

    const admin = createSupabaseClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: contribution, error: findError } = await admin
      .from("contributions")
      .select("id, amount, chama_id, member_name, status")
      .eq("checkout_request_id", callback.CheckoutRequestID)
      .maybeSingle();

    if (findError) {
      console.error("M-Pesa callback lookup failed:", findError.message);
      return NextResponse.json({ ResultCode: 0 });
    }
    if (!contribution) {
      console.warn(
        "M-Pesa callback for unknown checkout id:",
        callback.CheckoutRequestID
      );
      return NextResponse.json({ ResultCode: 0 });
    }

    // Idempotent: Daraja may deliver the same callback more than once.
    if (contribution.status === "paid") {
      return NextResponse.json({ ResultCode: 0 });
    }

    if (Number(callback.ResultCode) === 0) {
      const receipt = String(
        readCallbackMetadata(callback.CallbackMetadata?.Item, "MpesaReceiptNumber") ??
          ""
      );
      const paidAmount = Number(
        readCallbackMetadata(callback.CallbackMetadata?.Item, "Amount")
      );

      if (paidAmount && paidAmount !== Number(contribution.amount)) {
        console.error(
          `M-Pesa amount mismatch for ${contribution.id}: expected ${contribution.amount}, got ${paidAmount}`
        );
        return NextResponse.json({ ResultCode: 0 });
      }

      const { error: updateError } = await admin
        .from("contributions")
        .update({
          status: "paid",
          mpesa_receipt: receipt || null,
          payment_method: "mpesa",
        })
        .eq("id", contribution.id)
        .eq("status", "pending");

      if (updateError) {
        console.error("M-Pesa callback update failed:", updateError.message);
        return NextResponse.json({ ResultCode: 0 });
      }

      // Mirror the payment into the chama ledger (trigger updates totals).
      if (contribution.chama_id) {
        const { error: txError } = await admin.from("transactions").insert({
          chama_id: contribution.chama_id,
          type: "deposit",
          amount: contribution.amount,
          description: `M-PESA contribution ${receipt}`.trim(),
          member: contribution.member_name ?? null,
          status: "completed",
          method: "mpesa",
        });
        if (txError) {
          console.error(
            "M-Pesa callback transaction insert failed:",
            txError.message
          );
        }
      }
    } else {
      console.warn(
        `M-PESA payment not completed for contribution ${contribution.id}: ${callback.ResultDesc}`
      );
    }

    return NextResponse.json({ ResultCode: 0 });
  } catch (err) {
    console.error("M-Pesa callback error:", err);
    return NextResponse.json({ ResultCode: 0 });
  }
}