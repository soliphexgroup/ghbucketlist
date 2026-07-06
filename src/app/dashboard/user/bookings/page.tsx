"use client";

import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { BookingCard } from "@/components/dashboard/booking-card";
import { StayBookingCard } from "@/components/dashboard/stay-booking-card";
import { CarBookingCard } from "@/components/dashboard/car-booking-card";
import { ServiceRequestCard } from "@/components/dashboard/service-request-card";
import { useBookings, isUpcoming, isPast } from "@/lib/bookings-store";
import { useStayBookings } from "@/lib/stay-bookings-store";
import { useCarBookings } from "@/lib/car-bookings-store";
import { useServiceRequests } from "@/lib/service-requests-store";

export default function MyBookingsPage() {
  const bookings = useBookings().filter((b) => !b.isGift);
  const stayBookings = useStayBookings();
  const carBookings = useCarBookings();
  const serviceRequests = useServiceRequests();
  const now = new Date();

  const upcoming = bookings.filter((b) => isUpcoming(b, now));
  const past = bookings.filter((b) => isPast(b, now));
  const cancelled = bookings.filter((b) => b.status === "cancelled");

  const upcomingStays = stayBookings.filter(
    (b) => (b.status === "confirmed" || b.status === "pending_request") && new Date(b.checkInISO) >= now
  );
  const pastStays = stayBookings.filter(
    (b) => (b.status === "confirmed" || b.status === "completed") && new Date(b.checkInISO) < now
  );
  const otherStays = stayBookings.filter((b) => b.status === "cancelled" || b.status === "declined");

  const upcomingCars = carBookings.filter(
    (b) => (b.status === "confirmed" || b.status === "pending_request") && new Date(b.pickupDateISO) >= now
  );
  const pastCars = carBookings.filter(
    (b) => (b.status === "confirmed" || b.status === "completed") && new Date(b.pickupDateISO) < now
  );
  const otherCars = carBookings.filter((b) => b.status === "cancelled" || b.status === "declined");

  const activeRequests = serviceRequests.filter((r) => r.status === "pending" || r.status === "accepted");
  const completedRequests = serviceRequests.filter((r) => r.status === "completed");
  const otherRequests = serviceRequests.filter((r) => r.status === "cancelled" || r.status === "declined");

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground">My Bookings</h1>
      <p className="mt-1 text-muted-foreground">Manage your experiences and stays.</p>

      <Tabs defaultValue="activities" className="mt-6">
        <TabsList>
          <TabsTrigger value="activities">Activities & Experiences</TabsTrigger>
          <TabsTrigger value="stays">Places I&apos;ve Stayed</TabsTrigger>
          <TabsTrigger value="cars">Car Rentals</TabsTrigger>
          <TabsTrigger value="services">Handyman Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="activities" className="mt-4">
          <Tabs defaultValue="upcoming">
            <TabsList>
              <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
              <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
              <TabsTrigger value="cancelled">Cancelled ({cancelled.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="mt-4 flex flex-col gap-4">
              {upcoming.length === 0 ? (
                <EmptyState />
              ) : (
                upcoming.map((b) => <BookingCard key={b.reference} booking={b} variant="upcoming" />)
              )}
            </TabsContent>

            <TabsContent value="past" className="mt-4 flex flex-col gap-4">
              {past.length === 0 ? (
                <EmptyState message="No past experiences yet." />
              ) : (
                past.map((b) => <BookingCard key={b.reference} booking={b} variant="past" />)
              )}
            </TabsContent>

            <TabsContent value="cancelled" className="mt-4 flex flex-col gap-4">
              {cancelled.length === 0 ? (
                <EmptyState message="No cancelled bookings." />
              ) : (
                cancelled.map((b) => <BookingCard key={b.reference} booking={b} variant="cancelled" />)
              )}
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="stays" className="mt-4">
          <Tabs defaultValue="upcoming">
            <TabsList>
              <TabsTrigger value="upcoming">Upcoming ({upcomingStays.length})</TabsTrigger>
              <TabsTrigger value="past">Past ({pastStays.length})</TabsTrigger>
              <TabsTrigger value="other">Cancelled / Declined ({otherStays.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="mt-4 flex flex-col gap-4">
              {upcomingStays.length === 0 ? (
                <StayEmptyState />
              ) : (
                upcomingStays.map((b) => <StayBookingCard key={b.reference} booking={b} />)
              )}
            </TabsContent>

            <TabsContent value="past" className="mt-4 flex flex-col gap-4">
              {pastStays.length === 0 ? (
                <StayEmptyState message="No past stays yet." />
              ) : (
                pastStays.map((b) => <StayBookingCard key={b.reference} booking={b} />)
              )}
            </TabsContent>

            <TabsContent value="other" className="mt-4 flex flex-col gap-4">
              {otherStays.length === 0 ? (
                <StayEmptyState message="Nothing here." />
              ) : (
                otherStays.map((b) => <StayBookingCard key={b.reference} booking={b} />)
              )}
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="cars" className="mt-4">
          <Tabs defaultValue="upcoming">
            <TabsList>
              <TabsTrigger value="upcoming">Upcoming ({upcomingCars.length})</TabsTrigger>
              <TabsTrigger value="past">Past ({pastCars.length})</TabsTrigger>
              <TabsTrigger value="other">Cancelled / Declined ({otherCars.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="mt-4 flex flex-col gap-4">
              {upcomingCars.length === 0 ? (
                <CarEmptyState />
              ) : (
                upcomingCars.map((b) => <CarBookingCard key={b.reference} booking={b} />)
              )}
            </TabsContent>

            <TabsContent value="past" className="mt-4 flex flex-col gap-4">
              {pastCars.length === 0 ? (
                <CarEmptyState message="No past rentals yet." />
              ) : (
                pastCars.map((b) => <CarBookingCard key={b.reference} booking={b} />)
              )}
            </TabsContent>

            <TabsContent value="other" className="mt-4 flex flex-col gap-4">
              {otherCars.length === 0 ? (
                <CarEmptyState message="Nothing here." />
              ) : (
                otherCars.map((b) => <CarBookingCard key={b.reference} booking={b} />)
              )}
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="services" className="mt-4">
          <Tabs defaultValue="active">
            <TabsList>
              <TabsTrigger value="active">Active ({activeRequests.length})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({completedRequests.length})</TabsTrigger>
              <TabsTrigger value="other">Cancelled / Declined ({otherRequests.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="mt-4 flex flex-col gap-4">
              {activeRequests.length === 0 ? (
                <ServiceEmptyState />
              ) : (
                activeRequests.map((r) => <ServiceRequestCard key={r.reference} request={r} />)
              )}
            </TabsContent>

            <TabsContent value="completed" className="mt-4 flex flex-col gap-4">
              {completedRequests.length === 0 ? (
                <ServiceEmptyState message="No completed jobs yet." />
              ) : (
                completedRequests.map((r) => <ServiceRequestCard key={r.reference} request={r} />)
              )}
            </TabsContent>

            <TabsContent value="other" className="mt-4 flex flex-col gap-4">
              {otherRequests.length === 0 ? (
                <ServiceEmptyState message="Nothing here." />
              ) : (
                otherRequests.map((r) => <ServiceRequestCard key={r.reference} request={r} />)
              )}
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyState({ message = "No upcoming bookings yet." }: { message?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border p-10 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
      <Button asChild className="mt-4">
        <Link href="/activities">Browse Activities</Link>
      </Button>
    </div>
  );
}

function StayEmptyState({ message = "No upcoming stays yet." }: { message?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border p-10 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
      <Button asChild className="mt-4">
        <Link href="/stay">Browse Places to Stay</Link>
      </Button>
    </div>
  );
}

function CarEmptyState({ message = "No upcoming rentals yet." }: { message?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border p-10 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
      <Button asChild className="mt-4">
        <Link href="/cars">Browse Car Rentals</Link>
      </Button>
    </div>
  );
}

function ServiceEmptyState({ message = "No active requests yet." }: { message?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border p-10 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
      <Button asChild className="mt-4">
        <Link href="/services">Browse Handyman Services</Link>
      </Button>
    </div>
  );
}
