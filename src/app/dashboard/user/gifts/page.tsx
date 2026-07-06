"use client";

import Image from "next/image";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useBookings } from "@/lib/bookings-store";
import { getExperienceBySlug } from "@/data/experiences";
import { formatGHS } from "@/lib/format";

const demoReceivedGifts = [
  {
    id: "demo-gift-1",
    sender: "Abena Owusu",
    slug: "sunrise-beach-yoga",
    message: "Thought you'd love a peaceful morning — enjoy!",
    expiresInDays: 148,
  },
];

export default function GiftsPage() {
  const sent = useBookings().filter((b) => b.isGift);

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground">Gifts</h1>
      <p className="mt-1 text-muted-foreground">
        Experiences you&apos;ve gifted, and gifts sent to you.
      </p>

      <Tabs defaultValue="sent" className="mt-6">
        <TabsList>
          <TabsTrigger value="sent">Sent ({sent.length})</TabsTrigger>
          <TabsTrigger value="received">Received ({demoReceivedGifts.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="sent" className="mt-4 flex flex-col gap-4">
          {sent.length === 0 ? (
            <EmptyState message="You haven't sent any gifts yet." />
          ) : (
            sent.map((gift) => (
              <div
                key={gift.reference}
                className="flex flex-col gap-3 rounded-2xl border border-border p-4 sm:flex-row sm:items-center"
              >
                <div className="relative h-24 w-full shrink-0 overflow-hidden rounded-xl sm:w-24">
                  <Image src={gift.experienceImage} alt={gift.experienceTitle} fill className="object-cover" />
                </div>
                <div className="flex-1">
                  <p className="font-heading font-semibold text-foreground">
                    {gift.experienceTitle}
                  </p>
                  <p className="text-sm text-muted-foreground">To: {gift.recipientEmail}</p>
                  <p className="text-sm text-muted-foreground">{formatGHS(gift.total)} paid</p>
                </div>
                <Badge variant="secondary">Pending redemption</Badge>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="received" className="mt-4 flex flex-col gap-4">
          {demoReceivedGifts.length === 0 ? (
            <EmptyState message="No gifts received yet." />
          ) : (
            demoReceivedGifts.map((gift) => {
              const experience = getExperienceBySlug(gift.slug);
              if (!experience) return null;
              return (
                <div
                  key={gift.id}
                  className="flex flex-col gap-3 rounded-2xl border border-border p-4 sm:flex-row sm:items-center"
                >
                  <div className="relative h-24 w-full shrink-0 overflow-hidden rounded-xl sm:w-24">
                    <Image src={experience.images[0]} alt={experience.title} fill className="object-cover" />
                  </div>
                  <div className="flex-1">
                    <p className="font-heading font-semibold text-foreground">
                      {experience.title}
                    </p>
                    <p className="text-sm text-muted-foreground">From {gift.sender}</p>
                    <p className="text-sm text-muted-foreground italic">
                      &ldquo;{gift.message}&rdquo;
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Expires in {gift.expiresInDays} days
                    </p>
                  </div>
                  <Button asChild>
                    <Link href={`/activities/${gift.slug}`}>Redeem Now</Link>
                  </Button>
                </div>
              );
            })
          )}
          <p className="text-xs text-muted-foreground">
            This tab shows sample data to illustrate the feature — gifting between real accounts
            requires the full backend.
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border p-10 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
