import type { Metadata } from "next";
import { Suspense } from "react";
import { Container } from "@/components/container";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = { title: "Set a new password" };

export default function ResetPasswordPage() {
  return (
    <Container className="flex justify-center py-16">
      <div className="w-full max-w-sm">
        <h1 className="text-center font-heading text-2xl font-bold text-foreground">
          Set a new password
        </h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          Choose a new password for your account.
        </p>

        <div className="mt-6">
          <Suspense fallback={null}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </Container>
  );
}
