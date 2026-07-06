import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Container } from "@/components/container";
import { Button } from "@/components/ui/button";

export function ComingSoon({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Container className="flex flex-col items-center py-24 text-center sm:py-32">
      <span className="flex size-14 items-center justify-center rounded-full bg-secondary text-primary">
        <Sparkles className="size-6" />
      </span>
      <h1 className="mt-6 font-heading text-3xl font-bold text-foreground sm:text-4xl">
        {title}
      </h1>
      <p className="mt-3 max-w-md text-muted-foreground">{description}</p>
      <Button asChild className="mt-8">
        <Link href="/activities">Browse Activities</Link>
      </Button>
    </Container>
  );
}
