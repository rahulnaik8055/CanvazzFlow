import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/invitations/[token]",
]);
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/project(.*)",
  "/editor(.*)",
  "/sync",
  "/invitations(.*)",
  "/profile(.*)",
  "/settings(.*)",
  "/requests(.*)",
  "/access(.*)",
  "/notifications(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  const { pathname } = req.nextUrl;

  // Redirect old routes to Access Center
  if (["/invitations", "/invitations/", "/requests", "/requests/"].includes(pathname)) {
    return NextResponse.redirect(new URL("/access", req.url));
  }

  if (isProtectedRoute(req) && !userId) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (isPublicRoute(req) && userId && pathname === "/") {
    return NextResponse.redirect(new URL("/sync", req.url));
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
