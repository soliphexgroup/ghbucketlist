import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const metadata: Metadata = { title: "Reset your password" };

export default function ForgotPasswordPage() {
  return (
    <Container className="flex justify-center py-16">
      <div className="w-full max-w-sm">
        <h1 className="text-center font-heading text-2xl font-bold text-foreground">
          Reset your password
        </h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          Enter your email and we&apos;ll send you a reset link.
        </p>

        <form className="mt-6 flex flex-col gap-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@email.com" className="mt-1.5" />
          </div>
          <Button type="submit" className="w-full">
            Send reset link
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Remembered your password?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </Container>
  );
}
