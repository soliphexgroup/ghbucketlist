"use client";

import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const notificationToggles = [
  { id: "notif-booking", label: "Booking confirmations", defaultChecked: true },
  { id: "notif-gp", label: "GP point updates", defaultChecked: true },
  { id: "notif-nearby", label: "New activities near me", defaultChecked: false },
  { id: "notif-newsletter", label: "Platform newsletter", defaultChecked: false },
];

export default function SettingsPage() {
  const router = useRouter();

  function exportData() {
    const data = {
      bookings: JSON.parse(window.localStorage.getItem("ghbucketlist:bookings") ?? "[]"),
      reviews: JSON.parse(window.localStorage.getItem("ghbucketlist:my-reviews") ?? "[]"),
      wishlist: JSON.parse(window.localStorage.getItem("ghbucketlist:wishlist") ?? "[]"),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "gh-bucketlist-my-data.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function deleteAllData() {
    window.localStorage.removeItem("ghbucketlist:bookings");
    window.localStorage.removeItem("ghbucketlist:my-reviews");
    window.localStorage.removeItem("ghbucketlist:wishlist");
    router.push("/");
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground">Profile & Settings</h1>
      <p className="mt-1 text-muted-foreground">Manage your account details and preferences.</p>

      <Tabs defaultValue="profile" className="mt-6">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6 max-w-lg">
          <form className="flex flex-col gap-4">
            <div>
              <Label htmlFor="full-name">Full name</Label>
              <Input id="full-name" placeholder="Jane Doe" className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="username">Username</Label>
              <Input id="username" placeholder="janedoe" className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea id="bio" placeholder="Tell us a bit about yourself" className="mt-1.5" rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input id="city" placeholder="Accra" className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="dob">Date of birth</Label>
                <Input id="dob" type="date" className="mt-1.5" />
              </div>
            </div>
            <Button type="submit" className="mt-2 w-fit">
              Save changes
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="account" className="mt-6 max-w-lg">
          <form className="flex flex-col gap-4">
            <div>
              <Label htmlFor="account-email">Email</Label>
              <Input id="account-email" type="email" placeholder="you@email.com" className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="account-phone">Phone</Label>
              <Input id="account-phone" type="tel" placeholder="+233 20 000 0000" className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="new-password">New password</Label>
              <Input id="new-password" type="password" placeholder="••••••••" className="mt-1.5" />
            </div>
            <Button type="submit" className="mt-2 w-fit">
              Update account
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="notifications" className="mt-6 max-w-lg">
          <div className="flex flex-col gap-4">
            {notificationToggles.map((toggle) => (
              <div
                key={toggle.id}
                className="flex items-center justify-between rounded-lg border border-border px-4 py-3"
              >
                <Label htmlFor={toggle.id} className="text-sm font-medium">
                  {toggle.label}
                </Label>
                <Switch id={toggle.id} defaultChecked={toggle.defaultChecked} />
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="privacy" className="mt-6 max-w-lg">
          <div className="flex flex-col gap-6">
            <div>
              <p className="font-medium text-foreground">Export your data</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Download a copy of your bookings, reviews, and wishlist stored on this device.
              </p>
              <Button variant="outline" className="mt-3" onClick={exportData}>
                Request Data Export
              </Button>
            </div>

            <div className="rounded-xl border border-destructive/30 p-4">
              <p className="font-medium text-destructive">Delete account</p>
              <p className="mt-1 text-sm text-muted-foreground">
                This clears all locally stored demo data (bookings, reviews, wishlist) from this
                browser. This can&apos;t be undone.
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="mt-3">
                    Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete all local data?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently remove your demo bookings, reviews, and wishlist from
                      this browser.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={deleteAllData}>Delete everything</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
