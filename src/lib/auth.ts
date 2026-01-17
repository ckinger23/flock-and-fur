import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { authConfig } from "./auth.config";
import type { Adapter } from "next-auth/adapters";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db) as Adapter,
  providers: [
    // Keep non-credentials providers from config
    ...authConfig.providers.filter((p) => p.name !== "credentials"),
    // Add credentials with database authorize function
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            console.error("Auth: Missing email or password");
            throw new Error("Missing email or password");
          }

          const user = await db.user.findUnique({
            where: { email: credentials.email as string },
          });

          if (!user) {
            console.error("Auth: No user found for email:", credentials.email);
            throw new Error("No user found");
          }

          if (!user.password) {
            console.error("Auth: User has no password (OAuth user?):", credentials.email);
            throw new Error("No password set");
          }

          const passwordMatch = await bcrypt.compare(
            credentials.password as string,
            user.password
          );

          if (!passwordMatch) {
            console.error("Auth: Password mismatch for:", credentials.email);
            throw new Error("Password mismatch");
          }

          console.error("Auth: Login successful for:", credentials.email);
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            role: user.role,
          };
        } catch (error) {
          console.error("Auth error:", error);
          throw error;
        }
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      // For OAuth sign-ins, ensure the user has a role
      if (account?.provider !== "credentials") {
        const existingUser = await db.user.findUnique({
          where: { email: user.email! },
        });

        if (!existingUser) {
          // New OAuth user - they'll need to select their role
          return true;
        }
      }
      return true;
    },
  },
});
