import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

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

        <Button variant="outline" className="mt-6 w-full gap-2">
          <svg viewBox="0 0 24 24" className="size-4">
            <path
              fill="#4285F4"
              d="M22.5 12.2c0-.8-.1-1.4-.2-2H12v3.9h5.9c-.1.9-.8 2.3-2.3 3.3l-.02.14 3.35 2.6.23.02c2.13-1.97 3.34-4.86 3.34-7.96Z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.85 0 5.24-.94 6.98-2.55l-3.33-2.58c-.9.61-2.1 1.03-3.65 1.03-2.8 0-5.17-1.87-6.02-4.4l-.13.01-3.48 2.7-.05.12A11 11 0 0 0 12 23Z"
            />
            <path
              fill="#FBBC05"
              d="M5.98 14.5A6.6 6.6 0 0 1 5.62 12c0-.87.15-1.71.35-2.5l-.01-.16-3.53-2.74-.11.05A11 11 0 0 0 1 12c0 1.77.42 3.45 1.32 4.94l3.66-2.44Z"
            />
            <path
              fill="#EA4335"
              d="M12 5.1c1.98 0 3.32.86 4.08 1.57l2.98-2.9C17.23 2.09 14.85 1 12 1a11 11 0 0 0-9.68 5.65l3.65 2.85C6.83 6.97 9.2 5.1 12 5.1Z"
            />
          </svg>
          Continue with Google
        </Button>

        <div className="my-6 flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground">OR</span>
          <Separator className="flex-1" />
        </div>

        <form className="flex flex-col gap-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@email.com" className="mt-1.5" />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
            <Input id="password" type="password" placeholder="••••••••" className="mt-1.5" />
          </div>
          <Button type="submit" className="mt-2 w-full">
            Log in
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </Container>
  );
}
