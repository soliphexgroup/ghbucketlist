import * as icons from "lucide-react";
import { Sparkles, type LucideProps } from "lucide-react";

export function CategoryIcon({
  name,
  ...props
}: { name: string } & LucideProps) {
  const Icon = (icons as unknown as Record<string, React.ComponentType<LucideProps>>)[name] ?? Sparkles;
  return <Icon {...props} />;
}
