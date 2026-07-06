import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/container";
import { ActivityCard } from "@/components/activity-card";
import { listPopularExperiences } from "@/lib/repository";

export function PopularActivities() {
  const experiences = listPopularExperiences(8);

  return (
    <section className="py-16 sm:py-20">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
              Popular in your Area
            </h2>
            <p className="mt-1 text-muted-foreground">
              Handpicked experiences trending near you
            </p>
          </div>
          <Link
            href="/activities"
            className="flex items-center gap-1 text-sm font-semibold text-primary transition-colors duration-200 hover:text-primary/80"
          >
            Explore all activities
            <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {experiences.map((experience) => (
            <ActivityCard key={experience.id} experience={experience} />
          ))}
        </div>
      </Container>
    </section>
  );
}
