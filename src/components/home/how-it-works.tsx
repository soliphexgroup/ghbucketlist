import { Compass, CalendarCheck, Users, Sparkle } from "lucide-react";
import { Container } from "@/components/container";

const steps = [
  {
    icon: Compass,
    title: "Discover",
    description: "Browse hundreds of activities by interest, neighbourhood, or date.",
  },
  {
    icon: CalendarCheck,
    title: "Book",
    description: "Reserve your spot in a few clicks and get instant confirmation.",
  },
  {
    icon: Users,
    title: "Connect",
    description: "Meet new people, make friends, and create memories.",
  },
  {
    icon: Sparkle,
    title: "Host",
    description: "Share your passion by hosting your own activity.",
  },
];

export function HowItWorks() {
  return (
    <section className="py-16 sm:py-20">
      <Container>
        <div className="text-center">
          <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
            How It Works
          </h2>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <div key={step.title} className="relative flex flex-col items-center text-center">
              <span className="flex size-16 items-center justify-center rounded-full bg-secondary text-primary">
                <step.icon className="size-7" />
              </span>
              <span className="mt-4 font-heading text-sm font-semibold text-brand-coral">
                Step {i + 1}
              </span>
              <h3 className="mt-1 font-heading text-lg font-semibold text-foreground">
                {step.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
