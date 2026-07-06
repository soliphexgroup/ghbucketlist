export type UserRole = "customer" | "host" | "admin";

export type Profile = {
  id: string;
  role: UserRole;
  full_name: string | null;
  avatar_url: string | null;
};
