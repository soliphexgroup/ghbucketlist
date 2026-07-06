export function EarningsSparkline({ points }: { points: number[] }) {
  const width = 600;
  const height = 160;
  const padding = 8;
  const max = Math.max(...points, 1);

  const coords = points.map((value, i) => {
    const x = padding + (i / (points.length - 1)) * (width - padding * 2);
    const y = height - padding - (value / max) * (height - padding * 2);
    return [x, y] as const;
  });

  const linePath = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ");
  const areaPath = `${linePath} L${coords[coords.length - 1][0]},${height} L${coords[0][0]},${height} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-40 w-full"
      preserveAspectRatio="none"
      role="img"
      aria-label="Earnings over the last 30 days"
    >
      <path d={areaPath} fill="var(--primary)" opacity={0.08} />
      <path d={linePath} fill="none" stroke="var(--primary)" strokeWidth={2} />
    </svg>
  );
}
