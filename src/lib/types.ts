export type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  colorHex: string;
  description: string;
};

export type Host = {
  id: string;
  slug: string;
  name: string;
  avatarUrl: string;
  bio: string;
  joinedYear: number;
  rating: number;
  reviewCount: number;
};

export type TicketType = {
  id: string;
  name: string;
  priceGHS: number;
  description?: string;
};

export type Experience = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  categoryId: string;
  hostId: string;
  images: string[];
  venueName: string;
  neighbourhood: string;
  city: string;
  durationMinutes: number;
  maxCapacity: number;
  minAttendees: number;
  isFree: boolean;
  acceptsDonations: boolean;
  ticketTypes: TicketType[];
  scheduleDays: string[];
  scheduleTime: string;
  whatsIncluded: string[];
  gpPoints: number;
  rating: number;
  reviewCount: number;
  visibility: "public" | "private";
  createdAt: string;
};

export type Review = {
  id: string;
  experienceId: string;
  userName: string;
  userAvatar: string;
  rating: number;
  text: string;
  date: string;
};

export type Testimonial = {
  id: string;
  name: string;
  location: string;
  avatarUrl: string;
  rating: number;
  text: string;
  activityName: string;
};

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string[];
  coverImage: string;
  author: string;
  date: string;
  readTime: string;
  category: string;
};
