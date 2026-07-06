export function VenueMap({ query }: { query: string }) {
  const src = `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;

  return (
    <div className="overflow-hidden rounded-2xl border border-border">
      <iframe
        title="Experience location map"
        src={src}
        width="100%"
        height="320"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="block"
      />
    </div>
  );
}
