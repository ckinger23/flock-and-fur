"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function addFavoriteCleaner(cleanerId: string) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { error: "You must be logged in" };
    }

    if (session.user.role !== "CLIENT") {
      return { error: "Only clients can save favorite cleaners" };
    }

    // Verify the cleaner exists and is actually a cleaner
    const cleaner = await db.user.findUnique({
      where: { id: cleanerId },
      select: { role: true },
    });

    if (!cleaner || cleaner.role !== "CLEANER") {
      return { error: "Cleaner not found" };
    }

    await db.user.update({
      where: { id: session.user.id },
      data: {
        favoriteCleaners: {
          connect: { id: cleanerId },
        },
      },
    });

    revalidatePath("/client");

    return { success: true };
  } catch (error) {
    console.error("Add favorite error:", error);
    return { error: "Failed to add favorite" };
  }
}

export async function removeFavoriteCleaner(cleanerId: string) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { error: "You must be logged in" };
    }

    await db.user.update({
      where: { id: session.user.id },
      data: {
        favoriteCleaners: {
          disconnect: { id: cleanerId },
        },
      },
    });

    revalidatePath("/client");

    return { success: true };
  } catch (error) {
    console.error("Remove favorite error:", error);
    return { error: "Failed to remove favorite" };
  }
}

export async function getFavoriteCleaners() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { error: "You must be logged in", favorites: [] };
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: {
        favoriteCleaners: {
          select: {
            id: true,
            name: true,
            image: true,
            cleanerProfile: {
              select: {
                bio: true,
                yearsExperience: true,
                serviceAreas: true,
              },
            },
          },
        },
      },
    });

    // Get ratings for each favorite cleaner
    const favorites = await Promise.all(
      (user?.favoriteCleaners || []).map(async (cleaner) => {
        const reviews = await db.review.aggregate({
          where: { revieweeId: cleaner.id },
          _avg: { rating: true },
          _count: true,
        });

        return {
          ...cleaner,
          averageRating: reviews._avg.rating || 0,
          totalReviews: reviews._count,
        };
      })
    );

    return { favorites };
  } catch (error) {
    console.error("Get favorites error:", error);
    return { error: "Failed to get favorites", favorites: [] };
  }
}

export async function isFavoriteCleaner(cleanerId: string) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return false;
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        favoriteCleaners: {
          where: { id: cleanerId },
          select: { id: true },
        },
      },
    });

    return (user?.favoriteCleaners?.length || 0) > 0;
  } catch {
    return false;
  }
}
