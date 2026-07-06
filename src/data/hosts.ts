import type { Host } from "@/lib/types";

export const hosts: Host[] = [
  {
    id: "host-ama",
    slug: "ama-boateng",
    name: "Ama Boateng",
    avatarUrl: "https://i.pravatar.cc/150?img=47",
    bio: "Potter and ceramicist running a studio in Osu for six years.",
    joinedYear: 2021,
    rating: 4.9,
    reviewCount: 132,
  },
  {
    id: "host-kwabena",
    slug: "kwabena-mensah",
    name: "Kwabena Mensah",
    avatarUrl: "https://i.pravatar.cc/150?img=13",
    bio: "Chef and food tour guide showcasing Accra's street food scene.",
    joinedYear: 2020,
    rating: 4.8,
    reviewCount: 210,
  },
  {
    id: "host-esi",
    slug: "esi-arthur",
    name: "Esi Arthur",
    avatarUrl: "https://i.pravatar.cc/150?img=32",
    bio: "Yoga instructor and wellness coach hosting sunrise sessions.",
    joinedYear: 2022,
    rating: 5.0,
    reviewCount: 76,
  },
  {
    id: "host-kojo",
    slug: "kojo-annan",
    name: "Kojo Annan",
    avatarUrl: "https://i.pravatar.cc/150?img=15",
    bio: "Hiking guide and outdoors enthusiast covering the Eastern Region.",
    joinedYear: 2019,
    rating: 4.7,
    reviewCount: 305,
  },
  {
    id: "host-abena",
    slug: "abena-owusu",
    name: "Abena Owusu",
    avatarUrl: "https://i.pravatar.cc/150?img=44",
    bio: "Gallery curator running weekend art walks in Jamestown.",
    joinedYear: 2023,
    rating: 4.9,
    reviewCount: 58,
  },
  {
    id: "host-yaw",
    slug: "yaw-darko",
    name: "Yaw Darko",
    avatarUrl: "https://i.pravatar.cc/150?img=51",
    bio: "DJ and nightlife curator booking Accra's best rooftop sets.",
    joinedYear: 2021,
    rating: 4.6,
    reviewCount: 141,
  },
  {
    id: "host-adjoa",
    slug: "adjoa-frimpong",
    name: "Adjoa Frimpong",
    avatarUrl: "https://i.pravatar.cc/150?img=29",
    bio: "Photographer leading golden-hour shoot-along walks.",
    joinedYear: 2022,
    rating: 4.9,
    reviewCount: 89,
  },
  {
    id: "host-nana",
    slug: "nana-agyeman",
    name: "Nana Agyeman",
    avatarUrl: "https://i.pravatar.cc/150?img=60",
    bio: "History buff running heritage trail walks through Jamestown.",
    joinedYear: 2020,
    rating: 4.8,
    reviewCount: 97,
  },
];

export function getHostById(id: string) {
  return hosts.find((h) => h.id === id);
}

export function getHostBySlug(slug: string) {
  return hosts.find((h) => h.slug === slug);
}
