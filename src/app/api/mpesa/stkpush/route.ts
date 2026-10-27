import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  isMpesaConfigured,
  stkPush,
  MpesaError,
} from "@/lib/daraja";
import { normalizeKenyanPhone } from "@/lib/kenya";

export const dynamic = "force-dynamic";

/**
 * Creates a pending contribution and initiates an M-PESA STK push to the
 * signed-in user's phone. Payment confirmation arrives via /api/mpesa/callback.
 */
export async function POST(request: Request) {
  if (!isMpesaConfigured()) {
    return NextResponse.json(
      {
        error:
          "M-PESA is not configured yet. Set MPESA_* environment variables (see .env.example).",
      },
      { status: 503 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  let body: {
    amount?: number;
    chamaId?: string | null;
    description?: string;
    memberName?: string;
    phone?: string;
    date?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const amount = Math.ceil(Number(body.amount));
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json(
      { error: "Amount must be a positive number of KES." },
      { status: 400 }
    );
  }

  const description = (body.description ?? "").trim();
  if (description.length < 3) {
    return NextResponse.json(
      { error: "Please provide a description for the contribution." },
      { status: 400 }
    );
  }

  // Pay from the user's own registered number unless they supply another.
  const phone = normalizeKenyanPhone(body.phone ?? user.phone ?? "");
  if (!phone) {
    return NextResponse.json(
      { error: "Enter a valid Kenyan mobile number (e.g. 0712 345 678)." },
      { status: 400 }
    );
  }

  if (body.chamaId) {
    const { data: chama } = await supabase
      .from("chamas")
      .select("id")
      .eq("id", body.chamaId)
      .maybeSingle();
    if (!chama) {
      return NextResponse.json(
        { error: "Chama not found or you are not a member." },
        { status: 404 }
      );
    }
  }

  // 1. Record the contribution as pending first so money always lands on a row.
  const { data: contribution, error: insertError } = await supabase
    .from("contributions")
    .insert({
      user_id: user.id,
      chama_id: body.chamaId ?? null,
      amount,
      contributed_on: body.date ?? new Date().toISOString().slice(0, 10),
      description,
      member_name: body.memberName?.trim() || null,
      status: "pending",
      payment_method: "mpesa",
    })
    .select("id")
    .single();

  if (insertError || !contribution) {
    return NextResponse.json(
      { error: insertError?.message ?? "Could not save the contribution." },
      { status: 500 }
    );
  }

  // 2. Trigger the STK push.
  try {
    const result = await stkPush({
      phone,
      amount,
      accountReference: contribution.id.replaceAll("-", "").slice(0, 12),
      description: "HustlePay",
    });

    const { error: updateError } = await supabase
      .from("contributions")
      .update({ checkout_request_id: result.checkoutRequestId })
      .eq("id", contribution.id);

    if (updateError) {
      console.error(
        "Failed to store CheckoutRequestID:",
        updateError.message
      );
    }

    return NextResponse.json({
      contributionId: contribution.id,
      checkoutRequestId: result.checkoutRequestId,
      message: result.customerMessage,
      phone,
    });
  } catch (err) {
    // Push failed: remove the pending row so nothing dangles.
    await supabase.from("contributions").delete().eq("id", contribution.id);

    const message =
      err instanceof MpesaError
        ? err.message
        : "Could not reach M-PESA. Please try again.";
    console.error("STK push failed:", err);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}