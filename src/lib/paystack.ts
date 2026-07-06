export const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ?? "";

export function isPaystackConfigured() {
  return (
    PAYSTACK_PUBLIC_KEY.length > 0 &&
    PAYSTACK_PUBLIC_KEY.startsWith("pk_") &&
    !PAYSTACK_PUBLIC_KEY.includes("xxxx")
  );
}

export function ghsToPesewas(amountGHS: number) {
  return Math.round(amountGHS * 100);
}

export function paystackReference() {
  return `ghb-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
