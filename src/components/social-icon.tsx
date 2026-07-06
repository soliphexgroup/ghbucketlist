type SocialName = "instagram" | "tiktok" | "x";

export function SocialIcon({
  name,
  className,
}: {
  name: SocialName;
  className?: string;
}) {
  const common = {
    className,
    viewBox: "0 0 24 24",
    fill: "none" as const,
    xmlns: "http://www.w3.org/2000/svg",
    "aria-hidden": true,
  };

  if (name === "instagram") {
    return (
      <svg {...common}>
        <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="17.3" cy="6.7" r="1.1" fill="currentColor" />
      </svg>
    );
  }

  if (name === "tiktok") {
    return (
      <svg {...common}>
        <path
          d="M14 3v10.2a2.8 2.8 0 1 1-2.3-2.75V8.3a5 5 0 1 0 4.3 4.95V9.9a6.6 6.6 0 0 0 3.7 1.13V8.9a3.9 3.9 0 0 1-2.5-1.02A3.9 3.9 0 0 1 16.1 5h-2.1"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path
        d="M4 4l7.2 8.6L4.4 20H6l6-6.9L17 20H20l-7.5-9L19.6 4H18l-5.6 6.4L7 4H4z"
        stroke="currentColor"
        strokeWidth="0.4"
        fill="currentColor"
      />
    </svg>
  );
}
