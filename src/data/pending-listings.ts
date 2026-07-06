export type PendingListing = {
  id: string;
  title: string;
  hostName: string;
  category: string;
  priceGHS: number;
  submittedDate: string;
  description: string;
};

export const pendingListings: PendingListing[] = [
  {
    id: "pl-1",
    title: "Rooftop Astronomy Night",
    hostName: "Yaw Darko",
    category: "Outdoor Adventures",
    priceGHS: 180,
    submittedDate: "2026-07-01",
    description: "Stargazing session with telescopes on an East Legon rooftop, guided by a local astronomy club.",
  },
  {
    id: "pl-2",
    title: "Ga Language Taster Class",
    hostName: "Nana Agyeman",
    category: "Workshops",
    priceGHS: 90,
    submittedDate: "2026-06-29",
    description: "A 90-minute introduction to conversational Ga for newcomers to Accra.",
  },
  {
    id: "pl-3",
    title: "Kayaking on the Volta",
    hostName: "Kojo Annan",
    category: "Outdoor Adventures",
    priceGHS: 250,
    submittedDate: "2026-06-25",
    description: "Half-day guided kayaking trip on a calm stretch of the Volta river, all equipment included.",
  },
];
