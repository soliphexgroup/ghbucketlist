import Link from "next/link";
import { Container } from "@/components/container";
import { Button } from "@/components/ui/button";

export function CtaBanner() {
  return (
    <section className="bg-secondary/40 py-16 sm:py-20">
      <Container className="flex flex-col items-center text-center">
        <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
          Ready to Start Exploring?
        </h2>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Join thousands of people discovering new experiences every week.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button size="lg" asChild className="rounded-full px-8">
            <Link href="/activities">Browse Activities</Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            asChild
            className="rounded-full border-primary px-8 text-primary hover:bg-primary/10"
          >
            <Link href="/hosting">Host an Activity</Link>
          </Button>
        </div>
      </Container>
    </section>
  );
}
