"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

interface UpdateCleanerProfileInput {
  bio?: string;
  animalExperience?: string;
  yearsExperience?: number;
  hasTransportation?: boolean;
  serviceAreas?: string[];
}

export async function getCleanerProfile() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { error: "You must be logged in" };
    }

    const profile = await db.cleanerProfile.findUnique({
      where: { userId: session.user.id },
    });

    return { profile };
  } catch (error) {
    console.error("Get profile error:", error);
    return { error: "Failed to fetch profile" };
  }
}

export async function updateCleanerProfile(data: UpdateCleanerProfileInput) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { error: "You must be logged in" };
    }

    if (session.user.role !== "CLEANER") {
      return { error: "Only cleaners can update their profile" };
    }

    // Check if profile exists
    const existingProfile = await db.cleanerProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!existingProfile) {
      // Create profile if it doesn't exist
      await db.cleanerProfile.create({
        data: {
          userId: session.user.id,
          ...data,
        },
      });
    } else {
      // Update existing profile
      await db.cleanerProfile.update({
        where: { userId: session.user.id },
        data,
      });
    }

    revalidatePath("/cleaner/profile");
    revalidatePath("/cleaner");

    return { success: true };
  } catch (error) {
    console.error("Update profile error:", error);
    return { error: "Failed to update profile" };
  }
}
