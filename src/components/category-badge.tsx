import { cn } from "@/lib/utils";

export function CategoryBadge({
  name,
  colorHex,
  className,
}: {
  name: string;
  colorHex: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold text-white shadow-sm backdrop-blur-sm",
        className
      )}
      style={{ backgroundColor: colorHex }}
    >
      {name}
    </span>
  );
}
