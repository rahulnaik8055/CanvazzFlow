import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher(["/", "/invitations/[token]"]);
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/project(.*)",
  "/editor(.*)",
  "/sync",
  "/invitations(.*)",
  "/profile(.*)",
  "/settings(.*)",
  "/requests(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();

  if (isProtectedRoute(req) && !userId) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (isPublicRoute(req) && userId && req.nextUrl.pathname === "/") {
    return NextResponse.redirect(new URL("/sync", req.url));
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
