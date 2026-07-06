import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/container";
import { listBlogPosts } from "@/lib/repository";

export function BlogSection() {
  const posts = listBlogPosts(3);

  return (
    <section className="py-16 sm:py-20">
      <Container>
        <div className="text-center">
          <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
            From the Blog
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-muted-foreground">
            Stories, guides, and conversations spotlighting the people and experiences
            shaping the city.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
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
                  sizes="(min-width: 640px) 33vw, 90vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-1 flex-col gap-2 p-5">
                <span className="text-xs font-semibold uppercase tracking-wide text-brand-coral">
                  {post.category}
                </span>
                <h3 className="font-heading text-lg font-semibold text-foreground">
                  {post.title}
                </h3>
                <p className="line-clamp-2 text-sm text-muted-foreground">{post.excerpt}</p>
                <span className="mt-auto flex items-center gap-1 pt-2 text-sm font-semibold text-primary">
                  Read more
                  <ArrowRight className="size-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <Link
            href="/blog"
            className="rounded-full border border-border px-6 py-2.5 text-sm font-semibold text-foreground transition-colors duration-200 hover:border-primary hover:text-primary"
          >
            Explore More
          </Link>
        </div>
      </Container>
    </section>
  );
}
