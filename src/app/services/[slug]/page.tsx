import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, MapPin } from "lucide-react";
import { notFound } from "next/navigation";
import { Container } from "@/components/container";
import { StarRating } from "@/components/star-rating";
import { ProviderDetailContent } from "@/components/services/provider-detail-content";
import { serviceProviders, getServiceProviderBySlug } from "@/data/service-providers";
import { serviceCategoryLabels } from "@/data/service-categories";

export function generateStaticParams() {
  return serviceProviders.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const provider = getServiceProviderBySlug(slug);
  if (!provider) return {};
  const title = `${provider.name} — ${serviceCategoryLabels[provider.category]}`;
  return {
    title,
    description: provider.bio,
    openGraph: { title, description: provider.bio, images: [provider.portfolioImages[0]] },
  };
}

export default async function ProviderDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const provider = getServiceProviderBySlug(slug);
  if (!provider) notFound();

  return (
    <Container className="py-6 sm:py-8">
      <nav className="mb-5 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-primary">Home</Link>
        <ChevronRight className="size-3.5" />
        <Link href="/services" className="hover:text-primary">Handyman Services</Link>
        <ChevronRight className="size-3.5" />
        <span className="truncate text-foreground">{provider.name}</span>
      </nav>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground">
            {serviceCategoryLabels[provider.category]}
          </span>
          <StarRating rating={provider.rating} reviewCount={provider.reviewCount} />
        </div>
        <h1 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">{provider.name}</h1>
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="size-4" />
          {provider.serviceArea}, {provider.city}
        </p>
      </div>

      <ProviderDetailContent provider={provider} />
    </Container>
  );
}
