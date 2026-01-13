"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AnimalType, EnclosureType } from "@prisma/client";
import { revalidatePath } from "next/cache";

interface CreateJobInput {
  title: string;
  description: string;
  animalTypes: string[];
  enclosureType: string;
  enclosureSize?: string;
  numberOfAnimals: number;
  address: string;
  zipCode: string;
  suggestedPrice?: number;
}

export async function createJob(data: CreateJobInput) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { error: "You must be logged in to create a job" };
    }

    if (session.user.role !== "CLIENT" && session.user.role !== "ADMIN") {
      return { error: "Only clients can create jobs" };
    }

    const job = await db.job.create({
      data: {
        clientId: session.user.id,
        title: data.title,
        description: data.description,
        animalTypes: data.animalTypes as AnimalType[],
        enclosureType: data.enclosureType as EnclosureType,
        enclosureSize: data.enclosureSize,
        numberOfAnimals: data.numberOfAnimals,
        address: data.address,
        city: "Birmingham",
        state: "AL",
        zipCode: data.zipCode,
        suggestedPrice: data.suggestedPrice,
      },
    });

    revalidatePath("/client");
    revalidatePath("/cleaner/jobs");

    return { success: true, jobId: job.id };
  } catch (error) {
    console.error("Create job error:", error);
    return { error: "Failed to create job. Please try again." };
  }
}

export async function applyToJob(jobId: string, message?: string, proposedPrice?: number) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { error: "You must be logged in to apply" };
    }

    if (session.user.role !== "CLEANER") {
      return { error: "Only cleaners can apply to jobs" };
    }

    // Check if already applied
    const existingApplication = await db.jobApplication.findUnique({
      where: {
        jobId_cleanerId: {
          jobId,
          cleanerId: session.user.id,
        },
      },
    });

    if (existingApplication) {
      return { error: "You have already applied to this job" };
    }

    // Check if job is still open
    const job = await db.job.findUnique({
      where: { id: jobId },
    });

    if (!job || job.status !== "OPEN") {
      return { error: "This job is no longer accepting applications" };
    }

    await db.jobApplication.create({
      data: {
        jobId,
        cleanerId: session.user.id,
        message,
        proposedPrice,
      },
    });

    revalidatePath(`/client/jobs/${jobId}`);
    revalidatePath("/cleaner/jobs");

    return { success: true };
  } catch (error) {
    console.error("Apply to job error:", error);
    return { error: "Failed to apply. Please try again." };
  }
}

export async function acceptApplication(applicationId: string) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { error: "You must be logged in" };
    }

    const application = await db.jobApplication.findUnique({
      where: { id: applicationId },
      include: {
        job: true,
        cleaner: true,
      },
    });

    if (!application) {
      return { error: "Application not found" };
    }

    if (application.job.clientId !== session.user.id && session.user.role !== "ADMIN") {
      return { error: "You can only manage your own jobs" };
    }

    if (application.job.status !== "OPEN") {
      return { error: "This job is no longer accepting applications" };
    }

    // Update job with selected cleaner
    await db.$transaction([
      // Accept this application
      db.jobApplication.update({
        where: { id: applicationId },
        data: { status: "ACCEPTED" },
      }),
      // Reject all other applications
      db.jobApplication.updateMany({
        where: {
          jobId: application.jobId,
          id: { not: applicationId },
        },
        data: { status: "REJECTED" },
      }),
      // Update job status and assign cleaner
      db.job.update({
        where: { id: application.jobId },
        data: {
          status: "PENDING",
          cleanerId: application.cleanerId,
          agreedPrice: application.proposedPrice || application.job.suggestedPrice,
          platformFee: application.proposedPrice
            ? Number(application.proposedPrice) * 0.2
            : application.job.suggestedPrice
            ? Number(application.job.suggestedPrice) * 0.2
            : null,
          cleanerPayout: application.proposedPrice
            ? Number(application.proposedPrice) * 0.8
            : application.job.suggestedPrice
            ? Number(application.job.suggestedPrice) * 0.8
            : null,
        },
      }),
    ]);

    revalidatePath(`/client/jobs/${application.jobId}`);
    revalidatePath("/cleaner/jobs");

    return { success: true };
  } catch (error) {
    console.error("Accept application error:", error);
    return { error: "Failed to accept application. Please try again." };
  }
}

export async function updateJobStatus(
  jobId: string,
  status: "IN_PROGRESS" | "COMPLETED" | "CONFIRMED" | "CANCELLED"
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { error: "You must be logged in" };
    }

    const job = await db.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return { error: "Job not found" };
    }

    // Validate permissions based on status change
    const isClient = job.clientId === session.user.id;
    const isCleaner = job.cleanerId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";

    if (status === "IN_PROGRESS" && !isCleaner && !isAdmin) {
      return { error: "Only the assigned cleaner can start this job" };
    }

    if (status === "COMPLETED" && !isCleaner && !isAdmin) {
      return { error: "Only the assigned cleaner can mark this job as completed" };
    }

    if (status === "CONFIRMED" && !isClient && !isAdmin) {
      return { error: "Only the client can confirm job completion" };
    }

    if (status === "CANCELLED" && !isClient && !isAdmin) {
      return { error: "Only the client can cancel this job" };
    }

    const updateData: Record<string, unknown> = { status };

    if (status === "COMPLETED") {
      updateData.completedAt = new Date();
    }

    if (status === "CONFIRMED") {
      updateData.confirmedAt = new Date();
    }

    await db.job.update({
      where: { id: jobId },
      data: updateData,
    });

    revalidatePath(`/client/jobs/${jobId}`);
    revalidatePath(`/cleaner/jobs/${jobId}`);

    return { success: true };
  } catch (error) {
    console.error("Update job status error:", error);
    return { error: "Failed to update job status. Please try again." };
  }
}
