import type { Metadata } from "next";
import { Container } from "@/components/container";
import { HostApplicationPanel } from "@/components/hosting/host-application-panel";

export const metadata: Metadata = { title: "Become a Host" };

export default function HostingPage() {
  return (
    <Container className="py-10 sm:py-14">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">
          Turn your passion into extraordinary experiences
        </h1>
        <p className="mt-2 text-muted-foreground">
          List stays, cars, activities, or handyman services on GH Bucketlist. Apply below — our team
          reviews each application before unlocking your host dashboard.
        </p>
        <div className="mt-8">
          <HostApplicationPanel />
        </div>
      </div>
    </Container>
  );
}
