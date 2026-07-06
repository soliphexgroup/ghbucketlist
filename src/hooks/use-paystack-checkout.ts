"use client";

import { useCallback } from "react";
import { PAYSTACK_PUBLIC_KEY, isPaystackConfigured, ghsToPesewas, paystackReference } from "@/lib/paystack";

export type PaystackCheckoutParams = {
  email: string;
  amountGHS: number;
  metadata?: Record<string, unknown>;
};

export type PaystackCheckoutResult =
  | { success: true; reference: string }
  | {
      success: false;
      reason: "not_configured" | "cancelled" | "error" | "verification_failed";
      message?: string;
    };

export function usePaystackCheckout() {
  return useCallback((params: PaystackCheckoutParams): Promise<PaystackCheckoutResult> => {
    if (params.amountGHS <= 0) {
      return Promise.resolve({ success: true, reference: paystackReference() });
    }

    return new Promise((resolve) => {
      if (typeof window === "undefined" || !isPaystackConfigured() || !window.PaystackPop) {
        resolve({
          success: false,
          reason: "not_configured",
          message: "Paystack isn't configured yet — add your API keys to .env.local.",
        });
        return;
      }

      const reference = paystackReference();
      const amountPesewas = ghsToPesewas(params.amountGHS);
      const popup = new window.PaystackPop();

      popup.newTransaction({
        key: PAYSTACK_PUBLIC_KEY,
        email: params.email,
        amount: amountPesewas,
        currency: "GHS",
        ref: reference,
        metadata: params.metadata,
        onSuccess: async (transaction) => {
          try {
            const res = await fetch("/api/paystack/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                reference: transaction.reference,
                expectedAmountPesewas: amountPesewas,
              }),
            });
            const result = await res.json();
            if (result.verified) {
              resolve({ success: true, reference: transaction.reference });
            } else {
              resolve({ success: false, reason: "verification_failed", message: result.message });
            }
          } catch {
            resolve({
              success: false,
              reason: "error",
              message: "Payment went through but we couldn't verify it. Contact support with your reference.",
            });
          }
        },
        onCancel: () => resolve({ success: false, reason: "cancelled" }),
        onError: (error) =>
          resolve({
            success: false,
            reason: "error",
            message: error?.message || "Paystack could not start this transaction.",
          }),
      });
    });
  }, []);
}
