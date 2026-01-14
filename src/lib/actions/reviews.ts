"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { sendEmail, reviewReceivedEmail, BASE_URL } from "@/lib/email";

interface CreateReviewInput {
  jobId: string;
  revieweeId: string;
  rating: number;
  comment?: string;
}

export async function createReview(data: CreateReviewInput) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { error: "You must be logged in" };
    }

    // Validate rating
    if (data.rating < 1 || data.rating > 5) {
      return { error: "Rating must be between 1 and 5" };
    }

    // Get the job
    const job = await db.job.findUnique({
      where: { id: data.jobId },
      select: { id: true, title: true, status: true, clientId: true, cleanerId: true },
    });

    if (!job) {
      return { error: "Job not found" };
    }

    // Job must be paid to leave reviews
    if (job.status !== "PAID") {
      return { error: "Can only review after job is complete and paid" };
    }

    // Check that reviewer is either client or cleaner of this job
    const isClient = job.clientId === session.user.id;
    const isCleaner = job.cleanerId === session.user.id;

    if (!isClient && !isCleaner) {
      return { error: "You can only review jobs you participated in" };
    }

    // Validate reviewee
    if (isClient && data.revieweeId !== job.cleanerId) {
      return { error: "Clients can only review their assigned cleaner" };
    }

    if (isCleaner && data.revieweeId !== job.clientId) {
      return { error: "Cleaners can only review their client" };
    }

    // Check if review already exists
    const existingReview = await db.review.findUnique({
      where: {
        jobId_reviewerId: {
          jobId: data.jobId,
          reviewerId: session.user.id,
        },
      },
    });

    if (existingReview) {
      return { error: "You have already reviewed this job" };
    }

    // Create review
    await db.review.create({
      data: {
        jobId: data.jobId,
        reviewerId: session.user.id,
        revieweeId: data.revieweeId,
        rating: data.rating,
        comment: data.comment,
      },
    });

    // Send email notification to reviewee
    const [reviewer, reviewee] = await Promise.all([
      db.user.findUnique({
        where: { id: session.user.id },
        select: { name: true },
      }),
      db.user.findUnique({
        where: { id: data.revieweeId },
        select: { name: true, email: true, role: true },
      }),
    ]);

    if (reviewee?.email) {
      const jobUrl = reviewee.role === "CLIENT"
        ? `${BASE_URL}/client/jobs/${data.jobId}`
        : `${BASE_URL}/cleaner/jobs/${data.jobId}`;

      const emailData = reviewReceivedEmail({
        recipientName: reviewee.name || "there",
        reviewerName: reviewer?.name || "Someone",
        rating: data.rating,
        comment: data.comment,
        jobTitle: job.title,
        jobUrl,
      });
      await sendEmail({ to: reviewee.email, ...emailData });
    }

    revalidatePath(`/client/jobs/${data.jobId}`);
    revalidatePath(`/cleaner/jobs/${data.jobId}`);

    return { success: true };
  } catch (error) {
    console.error("Create review error:", error);
    return { error: "Failed to create review" };
  }
}

export async function getUserRating(userId: string) {
  const reviews = await db.review.aggregate({
    where: { revieweeId: userId },
    _avg: { rating: true },
    _count: true,
  });

  return {
    averageRating: reviews._avg.rating || 0,
    totalReviews: reviews._count,
  };
}
