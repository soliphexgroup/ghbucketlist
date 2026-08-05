import { redirect } from "next/navigation";

// Things to Do is now the home page. Keep the old /activities URL working.
export default function ActivitiesPage() {
  redirect("/");
}
