import { Sparkles } from "lucide-react";

export function AdminComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-border py-20 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-secondary text-primary">
        <Sparkles className="size-5" />
      </span>
      <h1 className="mt-5 font-heading text-2xl font-bold text-foreground">{title}</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
