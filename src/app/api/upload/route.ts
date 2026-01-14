import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  getPresignedUploadUrl,
  getPublicUrl,
  generatePhotoKey,
} from "@/lib/s3";
import { PhotoType } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId, type, filename, contentType } = await request.json();

    if (!jobId || !type || !filename || !contentType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate type
    if (!["before", "after", "issue"].includes(type)) {
      return NextResponse.json({ error: "Invalid photo type" }, { status: 400 });
    }

    // Validate content type
    if (!contentType.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image files are allowed" },
        { status: 400 }
      );
    }

    // Get the job
    const job = await db.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Check permissions
    const isClient = job.clientId === session.user.id;
    const isCleaner = job.cleanerId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";

    // Clients can upload "before" photos, cleaners can upload "after" and "issue"
    if (type === "before" && !isClient && !isAdmin) {
      return NextResponse.json(
        { error: "Only the client can upload before photos" },
        { status: 403 }
      );
    }

    if ((type === "after" || type === "issue") && !isCleaner && !isAdmin) {
      return NextResponse.json(
        { error: "Only the cleaner can upload completion photos" },
        { status: 403 }
      );
    }

    // Generate key and presigned URL
    const key = generatePhotoKey(jobId, type, filename);
    const uploadUrl = await getPresignedUploadUrl(key, contentType);
    const publicUrl = getPublicUrl(key);

    return NextResponse.json({
      uploadUrl,
      publicUrl,
      key,
    });
  } catch (error) {
    console.error("Upload presign error:", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}

// Save photo record after upload
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId, url, key, type, caption } = await request.json();

    if (!jobId || !url || !key || !type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Convert type string to enum
    const photoType: PhotoType =
      type === "before" ? "BEFORE" : type === "after" ? "AFTER" : "ISSUE";

    // Create photo record
    const photo = await db.photo.create({
      data: {
        jobId,
        uploaderId: session.user.id,
        url,
        key,
        type: photoType,
        caption,
      },
    });

    return NextResponse.json({ photo });
  } catch (error) {
    console.error("Save photo error:", error);
    return NextResponse.json(
      { error: "Failed to save photo" },
      { status: 500 }
    );
  }
}
