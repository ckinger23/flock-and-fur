"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { sendEmail, BASE_URL } from "@/lib/email";

export async function createDispute(jobId: string, reason: string) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { error: "You must be logged in" };
    }

    const job = await db.job.findUnique({
      where: { id: jobId },
      include: {
        client: { select: { name: true, email: true } },
        cleaner: { select: { name: true, email: true } },
      },
    });

    if (!job) {
      return { error: "Job not found" };
    }

    // Only client can dispute, and only for certain statuses
    const isClient = job.clientId === session.user.id;
    if (!isClient) {
      return { error: "Only the client can dispute this job" };
    }

    const disputeableStatuses = ["COMPLETED", "CONFIRMED"];
    if (!disputeableStatuses.includes(job.status)) {
      return { error: "This job cannot be disputed at this stage" };
    }

    // Update job status to DISPUTED and store the reason
    await db.job.update({
      where: { id: jobId },
      data: {
        status: "DISPUTED",
        // Store dispute reason in a description field or create a new model
        // For now, we'll prepend to the description
        description: `[DISPUTE: ${reason}]\n\n${job.description}`,
      },
    });

    // Send notification to cleaner
    if (job.cleaner?.email) {
      await sendEmail({
        to: job.cleaner.email,
        subject: `Dispute filed for "${job.title}"`,
        html: `
          <p>Hi ${job.cleaner.name || "there"},</p>
          <p>A dispute has been filed for the job: <strong>${job.title}</strong></p>
          <p><strong>Reason:</strong> ${reason}</p>
          <p>Our team will review this and contact you if needed.</p>
          <p><a href="${BASE_URL}/cleaner/jobs/${jobId}">View Job Details</a></p>
        `,
      });
    }

    revalidatePath(`/client/jobs/${jobId}`);
    revalidatePath(`/cleaner/jobs/${jobId}`);
    revalidatePath("/admin");
    revalidatePath("/admin/disputes");

    return { success: true };
  } catch (error) {
    console.error("Create dispute error:", error);
    return { error: "Failed to file dispute" };
  }
}

export async function resolveDispute(
  jobId: string,
  resolution: "refund_client" | "pay_cleaner" | "partial_refund",
  adminNotes?: string
) {
  try {
    const session = await auth();

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return { error: "Only admins can resolve disputes" };
    }

    const job = await db.job.findUnique({
      where: { id: jobId },
      include: {
        client: { select: { name: true, email: true } },
        cleaner: { select: { name: true, email: true } },
      },
    });

    if (!job) {
      return { error: "Job not found" };
    }

    if (job.status !== "DISPUTED") {
      return { error: "This job is not in dispute" };
    }

    let newStatus: "CANCELLED" | "PAID" = "CANCELLED";
    let resolutionMessage = "";

    switch (resolution) {
      case "refund_client":
        newStatus = "CANCELLED";
        resolutionMessage = "The client has been issued a full refund.";
        break;
      case "pay_cleaner":
        newStatus = "PAID";
        resolutionMessage = "The cleaner has been paid in full.";
        break;
      case "partial_refund":
        newStatus = "PAID";
        resolutionMessage = "A partial resolution has been applied.";
        break;
    }

    // Update job status
    await db.job.update({
      where: { id: jobId },
      data: {
        status: newStatus,
        description: `[RESOLVED: ${resolution}${adminNotes ? ` - ${adminNotes}` : ""}]\n\n${job.description}`,
        ...(newStatus === "PAID" ? { paidAt: new Date() } : {}),
      },
    });

    // Notify both parties
    if (job.client.email) {
      await sendEmail({
        to: job.client.email,
        subject: `Dispute resolved for "${job.title}"`,
        html: `
          <p>Hi ${job.client.name || "there"},</p>
          <p>The dispute for <strong>${job.title}</strong> has been resolved.</p>
          <p>${resolutionMessage}</p>
          ${adminNotes ? `<p><strong>Notes:</strong> ${adminNotes}</p>` : ""}
          <p><a href="${BASE_URL}/client/jobs/${jobId}">View Job Details</a></p>
        `,
      });
    }

    if (job.cleaner?.email) {
      await sendEmail({
        to: job.cleaner.email,
        subject: `Dispute resolved for "${job.title}"`,
        html: `
          <p>Hi ${job.cleaner.name || "there"},</p>
          <p>The dispute for <strong>${job.title}</strong> has been resolved.</p>
          <p>${resolutionMessage}</p>
          ${adminNotes ? `<p><strong>Notes:</strong> ${adminNotes}</p>` : ""}
          <p><a href="${BASE_URL}/cleaner/jobs/${jobId}">View Job Details</a></p>
        `,
      });
    }

    revalidatePath(`/client/jobs/${jobId}`);
    revalidatePath(`/cleaner/jobs/${jobId}`);
    revalidatePath("/admin");
    revalidatePath("/admin/disputes");

    return { success: true };
  } catch (error) {
    console.error("Resolve dispute error:", error);
    return { error: "Failed to resolve dispute" };
  }
}
