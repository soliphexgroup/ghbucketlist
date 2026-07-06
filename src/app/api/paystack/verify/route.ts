import { NextResponse } from "next/server";

type PaystackVerifyResponse = {
  status: boolean;
  message: string;
  data?: {
    status: "success" | "failed" | "abandoned";
    amount: number;
    currency: string;
    reference: string;
    gateway_response: string;
  };
};

export async function POST(request: Request) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey || !secretKey.startsWith("sk_")) {
    return NextResponse.json(
      { verified: false, message: "Paystack is not configured on the server yet." },
      { status: 500 }
    );
  }

  const body = await request.json().catch(() => null);
  const reference = typeof body?.reference === "string" ? body.reference : "";
  const expectedAmountPesewas = typeof body?.expectedAmountPesewas === "number" ? body.expectedAmountPesewas : null;

  if (!reference) {
    return NextResponse.json({ verified: false, message: "Missing transaction reference." }, { status: 400 });
  }

  const paystackRes = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: { Authorization: `Bearer ${secretKey}` },
      cache: "no-store",
    }
  );

  if (!paystackRes.ok) {
    return NextResponse.json(
      { verified: false, message: "Could not reach Paystack to verify this transaction." },
      { status: 502 }
    );
  }

  const result: PaystackVerifyResponse = await paystackRes.json();
  const data = result.data;

  if (!result.status || !data) {
    return NextResponse.json({ verified: false, message: result.message ?? "Verification failed." }, { status: 200 });
  }

  const amountMatches = expectedAmountPesewas === null || data.amount === expectedAmountPesewas;
  const verified = data.status === "success" && data.currency === "GHS" && amountMatches;

  return NextResponse.json({
    verified,
    status: data.status,
    amount: data.amount,
    currency: data.currency,
    reference: data.reference,
    message: verified ? "Payment verified." : (data.gateway_response ?? "Payment could not be verified."),
  });
}
