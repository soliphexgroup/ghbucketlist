export type PlatformUser = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  role: "customer" | "host" | "admin";
  status: "active" | "suspended";
  joinDate: string;
  totalBookings: number;
  totalSpent: number;
  gpBalance: number;
};

export const platformUsers: PlatformUser[] = [
  { id: "u-1", name: "Naa Adjeley", email: "naa.adjeley@example.com", avatarUrl: "https://i.pravatar.cc/100?img=5", role: "customer", status: "active", joinDate: "2025-11-02", totalBookings: 6, totalSpent: 1840, gpBalance: 184 },
  { id: "u-2", name: "Kofi Tetteh", email: "kofi.tetteh@example.com", avatarUrl: "https://i.pravatar.cc/100?img=8", role: "customer", status: "active", joinDate: "2025-09-14", totalBookings: 9, totalSpent: 2960, gpBalance: 296 },
  { id: "u-3", name: "Abigail Mensah", email: "abigail.m@example.com", avatarUrl: "https://i.pravatar.cc/100?img=25", role: "customer", status: "active", joinDate: "2026-01-10", totalBookings: 3, totalSpent: 990, gpBalance: 99 },
  { id: "u-4", name: "Michael Boateng", email: "michael.b@example.com", avatarUrl: "https://i.pravatar.cc/100?img=33", role: "customer", status: "active", joinDate: "2025-08-22", totalBookings: 4, totalSpent: 1120, gpBalance: 112 },
  { id: "u-5", name: "Priscilla Asante", email: "priscilla.a@example.com", avatarUrl: "https://i.pravatar.cc/100?img=36", role: "customer", status: "active", joinDate: "2026-02-01", totalBookings: 2, totalSpent: 560, gpBalance: 56 },
  { id: "u-6", name: "Selorm Klu", email: "selorm.klu@example.com", avatarUrl: "https://i.pravatar.cc/100?img=11", role: "customer", status: "active", joinDate: "2025-10-05", totalBookings: 5, totalSpent: 1400, gpBalance: 140 },
  { id: "u-7", name: "Linda Osei", email: "linda.osei@example.com", avatarUrl: "https://i.pravatar.cc/100?img=20", role: "customer", status: "suspended", joinDate: "2026-01-28", totalBookings: 3, totalSpent: 1160, gpBalance: 0 },
  { id: "u-8", name: "Nana Yaw Boafo", email: "nanayaw.b@example.com", avatarUrl: "https://i.pravatar.cc/100?img=15", role: "customer", status: "active", joinDate: "2025-12-03", totalBookings: 1, totalSpent: 900, gpBalance: 0 },
  { id: "u-9", name: "Efua Darko", email: "efua.darko@example.com", avatarUrl: "https://i.pravatar.cc/100?img=9", role: "customer", status: "active", joinDate: "2026-03-11", totalBookings: 2, totalSpent: 2360, gpBalance: 236 },
  { id: "u-10", name: "Kwame Owusu", email: "kwame.owusu@example.com", avatarUrl: "https://i.pravatar.cc/100?img=13", role: "customer", status: "active", joinDate: "2025-06-15", totalBookings: 7, totalSpent: 2100, gpBalance: 210 },
  { id: "u-11", name: "Selasi Agbeko", email: "selasi.agbeko@example.com", avatarUrl: "https://i.pravatar.cc/100?img=51", role: "customer", status: "active", joinDate: "2026-02-14", totalBookings: 1, totalSpent: 960, gpBalance: 96 },
  { id: "u-12", name: "Ama Boateng", email: "ama.boateng@example.com", avatarUrl: "https://i.pravatar.cc/150?img=47", role: "host", status: "active", joinDate: "2021-04-01", totalBookings: 0, totalSpent: 0, gpBalance: 0 },
  { id: "u-13", name: "Kwabena Mensah", email: "kwabena.mensah@example.com", avatarUrl: "https://i.pravatar.cc/150?img=13", role: "host", status: "active", joinDate: "2020-02-18", totalBookings: 0, totalSpent: 0, gpBalance: 0 },
  { id: "u-14", name: "Esi Arthur", email: "esi.arthur@example.com", avatarUrl: "https://i.pravatar.cc/150?img=32", role: "host", status: "active", joinDate: "2022-06-09", totalBookings: 0, totalSpent: 0, gpBalance: 0 },
];
