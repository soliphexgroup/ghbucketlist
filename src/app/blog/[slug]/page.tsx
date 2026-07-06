import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { Container } from "@/components/container";
import { Button } from "@/components/ui/button";
import { blogPosts, getBlogPostBySlug } from "@/data/blog";

export function generateStaticParams() {
  return blogPosts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: { title: post.title, description: post.excerpt, images: [post.coverImage] },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);
  if (!post) notFound();

  const related = blogPosts.filter((p) => p.slug !== post.slug).slice(0, 3);

  return (
    <Container className="py-8 sm:py-10">
      <nav className="mb-5 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-primary">
          Home
        </Link>
        <ChevronRight className="size-3.5" />
        <Link href="/blog" className="hover:text-primary">
          Blog
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="truncate text-foreground">{post.title}</span>
      </nav>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_300px]">
        <article>
          <span className="text-xs font-semibold uppercase tracking-wide text-brand-coral">
            {post.category}
          </span>
          <h1 className="mt-2 font-heading text-3xl font-bold text-foreground sm:text-4xl">
            {post.title}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {post.author} ·{" "}
            {new Date(post.date).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}{" "}
            · {post.readTime}
          </p>

          <div className="relative mt-6 aspect-16/9 w-full overflow-hidden rounded-2xl">
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              priority
              sizes="(min-width: 1024px) 700px, 100vw"
              className="object-cover"
            />
          </div>

          <div className="mt-8 flex flex-col gap-5">
            {post.content.map((paragraph, i) => (
              <p key={i} className="leading-relaxed text-muted-foreground">
                {paragraph}
              </p>
            ))}
          </div>
        </article>

        <aside className="flex flex-col gap-6">
          <div className="rounded-2xl border border-border bg-secondary/40 p-5">
            <h2 className="font-heading text-base font-semibold text-foreground">
              Ready to explore?
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Find your next experience on GH Bucketlist.
            </p>
            <Button asChild className="mt-4 w-full">
              <Link href="/activities">Explore Activities</Link>
            </Button>
          </div>

          {related.length > 0 && (
            <div>
              <h2 className="font-heading text-sm font-semibold text-foreground">
                More from the blog
              </h2>
              <div className="mt-3 flex flex-col gap-3">
                {related.map((r) => (
                  <Link
                    key={r.id}
                    href={`/blog/${r.slug}`}
                    className="flex gap-3 rounded-xl border border-border p-2 transition-colors duration-200 hover:border-primary"
                  >
                    <div className="relative size-16 shrink-0 overflow-hidden rounded-lg">
                      <Image src={r.coverImage} alt={r.title} fill className="object-cover" />
                    </div>
                    <p className="line-clamp-3 text-sm font-medium text-foreground">
                      {r.title}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </Container>
  );
}
