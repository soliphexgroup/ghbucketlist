import { redirect } from "next/navigation";

// The old "Restaurants Guide" tab is now Bucket Rewards.
export default function RestaurantsPage() {
  redirect("/rewards");
}
