import { Hero } from "@/components/home/hero";
import { PopularActivities } from "@/components/home/popular-activities";
import { BrowseByCategory } from "@/components/home/browse-by-category";
import { ExploreVerticals } from "@/components/home/explore-verticals";
import { HowItWorks } from "@/components/home/how-it-works";
import { TestimonialsCarousel } from "@/components/home/testimonials-carousel";
import { BlogSection } from "@/components/home/blog-section";
import { CtaBanner } from "@/components/home/cta-banner";

export default function Home() {
  return (
    <>
      <Hero />
      <PopularActivities />
      <ExploreVerticals />
      <BrowseByCategory />
      <HowItWorks />
      <TestimonialsCarousel />
      <BlogSection />
      <CtaBanner />
    </>
  );
}
