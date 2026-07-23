import type { StoredCarBooking } from "@/lib/car-bookings-store";

// Seeded demo car bookings for host-kwabena's two vehicles, so the host dashboard has
// rental activity to show. Fiction, not live data. Total follows the car booking maths:
// dailyRate × days + 5% service fee.

const COROLLA = {
  carId: "car-corolla-economy",
  carSlug: "toyota-corolla-2023",
  carTitle: "Toyota Corolla 2023",
  carImage: "https://picsum.photos/seed/corolla-2023-0/1200/900",
  pickupLocation: "Kotoka International Airport",
  city: "Accra",
};

const SPRINTER = {
  carId: "car-sprinter-van",
  carSlug: "mercedes-sprinter-2022",
  carTitle: "Mercedes-Benz Sprinter 2022",
  carImage: "https://picsum.photos/seed/sprinter-2022-0/1200/900",
  pickupLocation: "Kotoka International Airport",
  city: "Accra",
};

const VENDOR_NAME = "Kwabena Mensah";

function total(dailyRate: number, days: number) {
  return dailyRate * days * 1.05;
}

export const hostCarBookings: StoredCarBooking[] = [
  {
    ...COROLLA,
    reference: "CAR-DEMO-C1",
    vendorName: VENDOR_NAME,
    guestName: "Nana Adjei",
    guestEmail: "nana.adjei@example.com",
    guestAvatar: "https://i.pravatar.cc/100?img=13",
    pickupDateISO: "2026-06-05T00:00:00.000Z",
    returnDateISO: "2026-06-08T00:00:00.000Z",
    days: 3,
    withDriver: false,
    dailyRate: 280,
    total: total(280, 3),
    bookingType: "instant",
    status: "completed",
    createdAtISO: "2026-05-25T10:12:00.000Z",
  },
  {
    ...COROLLA,
    reference: "CAR-DEMO-C2",
    vendorName: VENDOR_NAME,
    guestName: "Abena Owusu",
    guestEmail: "abena.owusu@example.com",
    guestAvatar: "https://i.pravatar.cc/100?img=44",
    pickupDateISO: "2026-08-10T00:00:00.000Z",
    returnDateISO: "2026-08-14T00:00:00.000Z",
    days: 4,
    withDriver: false,
    dailyRate: 280,
    total: total(280, 4),
    bookingType: "instant",
    status: "confirmed",
    createdAtISO: "2026-07-18T16:30:00.000Z",
  },
  {
    ...COROLLA,
    reference: "CAR-DEMO-C3",
    vendorName: VENDOR_NAME,
    guestName: "Kwesi Appiah",
    guestEmail: "kwesi.appiah@example.com",
    guestAvatar: "https://i.pravatar.cc/100?img=59",
    pickupDateISO: "2026-07-01T00:00:00.000Z",
    returnDateISO: "2026-07-03T00:00:00.000Z",
    days: 2,
    withDriver: false,
    dailyRate: 280,
    total: total(280, 2),
    bookingType: "instant",
    status: "cancelled",
    createdAtISO: "2026-06-22T09:05:00.000Z",
  },
  {
    ...SPRINTER,
    reference: "CAR-DEMO-S1",
    vendorName: VENDOR_NAME,
    guestName: "Adjoa Frimpong",
    guestEmail: "adjoa.f@example.com",
    guestAvatar: "https://i.pravatar.cc/100?img=41",
    pickupDateISO: "2026-06-20T00:00:00.000Z",
    returnDateISO: "2026-06-22T00:00:00.000Z",
    days: 2,
    withDriver: true,
    dailyRate: 1100,
    total: total(1100, 2),
    bookingType: "request",
    status: "completed",
    createdAtISO: "2026-06-08T12:45:00.000Z",
  },
  {
    ...SPRINTER,
    reference: "CAR-DEMO-S2",
    vendorName: VENDOR_NAME,
    guestName: "Selorm Dzokoto",
    guestEmail: "selorm.d@example.com",
    guestAvatar: "https://i.pravatar.cc/100?img=33",
    pickupDateISO: "2026-08-01T00:00:00.000Z",
    returnDateISO: "2026-08-03T00:00:00.000Z",
    days: 2,
    withDriver: false,
    dailyRate: 850,
    total: total(850, 2),
    bookingType: "instant",
    status: "confirmed",
    createdAtISO: "2026-07-14T19:20:00.000Z",
  },
  {
    ...SPRINTER,
    reference: "CAR-DEMO-S3",
    vendorName: VENDOR_NAME,
    guestName: "Yaa Asantewaa",
    guestEmail: "yaa.a@example.com",
    guestAvatar: "https://i.pravatar.cc/100?img=25",
    pickupDateISO: "2026-08-20T00:00:00.000Z",
    returnDateISO: "2026-08-22T00:00:00.000Z",
    days: 2,
    withDriver: true,
    dailyRate: 1100,
    total: total(1100, 2),
    bookingType: "request",
    status: "pending_request",
    createdAtISO: "2026-07-21T08:10:00.000Z",
  },
];
