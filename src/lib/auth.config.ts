import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import type { UserRole } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string | null;
      image: string | null;
      role: UserRole;
    };
  }

  interface User {
    role: UserRole;
  }
}

// Extend JWT type
declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
  }
}

// This config is used by middleware (Edge runtime compatible - no database imports)
export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    // Credentials provider is added in auth.ts (needs database access)
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const userRole = auth?.user?.role;

      // Public routes
      const isPublicRoute =
        nextUrl.pathname === "/" ||
        nextUrl.pathname.startsWith("/login") ||
        nextUrl.pathname.startsWith("/register") ||
        nextUrl.pathname.startsWith("/api/auth") ||
        nextUrl.pathname.startsWith("/api/stripe/webhook") ||
        nextUrl.pathname === "/manifest.json" ||
        nextUrl.pathname === "/sw.js" ||
        nextUrl.pathname === "/offline.html" ||
        nextUrl.pathname.startsWith("/icons/");

      // Auth routes (login/register)
      const isAuthRoute =
        nextUrl.pathname.startsWith("/login") ||
        nextUrl.pathname.startsWith("/register");

      // Protected route groups
      const isClientRoute = nextUrl.pathname.startsWith("/client");
      const isCleanerRoute = nextUrl.pathname.startsWith("/cleaner");
      const isAdminRoute = nextUrl.pathname.startsWith("/admin");

      // Allow public routes
      if (isPublicRoute) {
        return true;
      }

      // If on auth route and logged in, redirect to appropriate dashboard
      if (isAuthRoute && isLoggedIn) {
        if (userRole === "ADMIN") {
          return Response.redirect(new URL("/admin", nextUrl));
        } else if (userRole === "CLEANER") {
          return Response.redirect(new URL("/cleaner", nextUrl));
        } else {
          return Response.redirect(new URL("/client", nextUrl));
        }
      }

      // If not logged in and trying to access protected route
      if (!isLoggedIn) {
        return false; // Redirects to signIn page
      }

      // Role-based access control
      if (isClientRoute && userRole !== "CLIENT" && userRole !== "ADMIN") {
        return Response.redirect(new URL("/", nextUrl));
      }
      if (isCleanerRoute && userRole !== "CLEANER" && userRole !== "ADMIN") {
        return Response.redirect(new URL("/", nextUrl));
      }
      if (isAdminRoute && userRole !== "ADMIN") {
        return Response.redirect(new URL("/", nextUrl));
      }

      return true;
    },
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id!;
        token.role = user.role;
      }

      // Handle session updates
      if (trigger === "update" && session?.role) {
        token.role = session.role;
      }

      return token;
    },
    session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
  },
};
