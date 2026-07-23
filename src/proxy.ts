import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/session";

const protectedPrefixes = ["/dashboard"];
const authPages = ["/login", "/signup"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { response, user } = await updateSession(request);

  const isProtected = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));
  const isAuthPage = authPages.includes(pathname);

  // Demo affordance: the host dashboard preview shows only seeded mock data, so let it
  // through without a session when the preview cookie (or the ?preview=1 that sets it) is present.
  const isHostPreview =
    pathname.startsWith("/dashboard/host") &&
    (request.cookies.get("demo-host-preview")?.value === "1" ||
      request.nextUrl.searchParams.get("preview") === "1");

  if (isProtected && !user && !isHostPreview) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (isAuthPage && user) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
