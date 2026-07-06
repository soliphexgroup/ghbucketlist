import Link from "next/link";
import { SocialIcon } from "@/components/social-icon";
import { Container } from "@/components/container";

const columns = [
  {
    heading: "GH Bucketlist",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Careers", href: "/careers" },
      { label: "Shop Merch", href: "/shop" },
      { label: "Blog", href: "/blog" },
    ],
  },
  {
    heading: "Community",
    links: [
      { label: "Activities", href: "/activities" },
      { label: "Guidelines", href: "/guidelines" },
      { label: "Curated Trips", href: "/trips" },
      { label: "Success Stories", href: "/about" },
    ],
  },
  {
    heading: "Hosting",
    links: [
      { label: "Hosting Overview", href: "/hosting" },
      { label: "Become a Host", href: "/host" },
      { label: "Resources", href: "/resources" },
      { label: "Guidelines", href: "/guidelines" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-secondary/40">
      <Container className="py-14">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
          {columns.map((col) => (
            <div key={col.heading}>
              <h3 className="font-heading text-sm font-semibold text-foreground">
                {col.heading}
              </h3>
              <ul className="mt-4 flex flex-col gap-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors duration-200 hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h3 className="font-heading text-sm font-semibold text-foreground">Connect</h3>
            <div className="mt-4 flex items-center gap-3">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                aria-label="GH Bucketlist on Instagram"
                className="flex size-9 items-center justify-center rounded-full border border-border text-foreground transition-colors duration-200 hover:border-primary hover:text-primary"
              >
                <SocialIcon name="instagram" className="size-4" />
              </a>
              <a
                href="https://tiktok.com"
                target="_blank"
                rel="noreferrer"
                aria-label="GH Bucketlist on TikTok"
                className="flex size-9 items-center justify-center rounded-full border border-border text-foreground transition-colors duration-200 hover:border-primary hover:text-primary"
              >
                <SocialIcon name="tiktok" className="size-4" />
              </a>
              <a
                href="https://x.com"
                target="_blank"
                rel="noreferrer"
                aria-label="GH Bucketlist on X"
                className="flex size-9 items-center justify-center rounded-full border border-border text-foreground transition-colors duration-200 hover:border-primary hover:text-primary"
              >
                <SocialIcon name="x" className="size-4" />
              </a>
            </div>
            <p className="mt-5 text-sm text-muted-foreground">Help Center</p>
            <a
              href="mailto:hello@ghbucketlist.com"
              className="text-sm font-medium text-primary hover:underline"
            >
              hello@ghbucketlist.com
            </a>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} GH Bucketlist. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="/terms" className="text-sm text-muted-foreground hover:text-primary">
              Terms
            </Link>
            <Link href="/privacypolicy" className="text-sm text-muted-foreground hover:text-primary">
              Privacy
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
