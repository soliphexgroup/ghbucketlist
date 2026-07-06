import { Container } from "@/components/container";
import { UserSidebarNav } from "@/components/dashboard/user-sidebar";
import { DashboardMobileNav } from "@/components/dashboard/dashboard-mobile-nav";

export default function UserDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Container className="py-8 sm:py-10">
      <DashboardMobileNav />

      <div className="mt-6 grid grid-cols-1 gap-8 lg:mt-0 lg:grid-cols-[240px_1fr]">
        <aside className="hidden lg:block">
          <p className="mb-4 font-heading text-lg font-semibold text-foreground">My Account</p>
          <UserSidebarNav />
        </aside>

        <div>{children}</div>
      </div>
    </Container>
  );
}
