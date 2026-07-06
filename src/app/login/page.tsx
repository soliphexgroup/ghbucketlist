import type { Metadata } from "next";
import { Suspense } from "react";
import { Container } from "@/components/container";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <Container className="flex justify-center py-16">
      <div className="w-full max-w-sm">
        <h1 className="text-center font-heading text-2xl font-bold text-foreground">
          Welcome back
        </h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          Log in to book, wishlist, and manage your experiences.
        </p>

        <div className="mt-6">
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </Container>
  );
}
