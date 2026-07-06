import type { Metadata } from "next";
import { Container } from "@/components/container";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = { title: "Sign up" };

export default function SignupPage() {
  return (
    <Container className="flex justify-center py-16">
      <div className="w-full max-w-sm">
        <h1 className="text-center font-heading text-2xl font-bold text-foreground">
          Join GH Bucketlist
        </h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          Create an account to start booking curated experiences.
        </p>

        <div className="mt-6">
          <SignupForm />
        </div>
      </div>
    </Container>
  );
}
