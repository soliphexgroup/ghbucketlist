import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/container";
import { listBlogPosts } from "@/lib/repository";

export const metadata: Metadata = {
  title: "Blog",
  description: "Stories, guides, and conversations spotlighting Accra's experiences.",
};

export default function BlogIndexPage() {
  const posts = listBlogPosts();

  return (
    <Container className="py-10 sm:py-14">
      <div className="text-center">
        <h1 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">
          From the Blog
        </h1>
        <p className="mx-auto mt-2 max-w-2xl text-muted-foreground">
          Stories, guides, and conversations spotlighting the people and experiences shaping
          the city.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <Link
            key={post.id}
            href={`/blog/${post.slug}`}
            className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-shadow duration-200 hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)]"
          >
            <div className="relative aspect-16/10 w-full overflow-hidden">
              <Image
                src={post.coverImage}
                alt={post.title}
                fill
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <div className="flex flex-1 flex-col gap-2 p-5">
              <span className="text-xs font-semibold uppercase tracking-wide text-brand-coral">
                {post.category}
              </span>
              <h2 className="font-heading text-lg font-semibold text-foreground">
                {post.title}
              </h2>
              <p className="line-clamp-2 text-sm text-muted-foreground">{post.excerpt}</p>
              <p className="mt-auto pt-2 text-xs text-muted-foreground">
                {post.author} · {post.readTime}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </Container>
  );
}
