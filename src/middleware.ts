import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const userRole = req.auth?.user?.role;

  // Public routes
  const isPublicRoute =
    nextUrl.pathname === "/" ||
    nextUrl.pathname.startsWith("/login") ||
    nextUrl.pathname.startsWith("/register") ||
    nextUrl.pathname.startsWith("/api/auth");

  // Auth routes (login/register)
  const isAuthRoute =
    nextUrl.pathname.startsWith("/login") ||
    nextUrl.pathname.startsWith("/register");

  // Protected route groups
  const isClientRoute = nextUrl.pathname.startsWith("/client");
  const isCleanerRoute = nextUrl.pathname.startsWith("/cleaner");
  const isAdminRoute = nextUrl.pathname.startsWith("/admin");

  // If on auth route and logged in, redirect to appropriate dashboard
  if (isAuthRoute && isLoggedIn) {
    if (userRole === "ADMIN") {
      return NextResponse.redirect(new URL("/admin", nextUrl));
    } else if (userRole === "CLEANER") {
      return NextResponse.redirect(new URL("/cleaner", nextUrl));
    } else {
      return NextResponse.redirect(new URL("/client", nextUrl));
    }
  }

  // If not logged in and trying to access protected route
  if (!isLoggedIn && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  // Role-based access control
  if (isLoggedIn) {
    if (isClientRoute && userRole !== "CLIENT" && userRole !== "ADMIN") {
      return NextResponse.redirect(new URL("/", nextUrl));
    }
    if (isCleanerRoute && userRole !== "CLEANER" && userRole !== "ADMIN") {
      return NextResponse.redirect(new URL("/", nextUrl));
    }
    if (isAdminRoute && userRole !== "ADMIN") {
      return NextResponse.redirect(new URL("/", nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
