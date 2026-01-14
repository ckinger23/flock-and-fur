"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

interface PhotoUploadProps {
  jobId: string;
  type: "before" | "after" | "issue";
  onUploadComplete?: () => void;
}

export function PhotoUpload({ jobId, type, onUploadComplete }: PhotoUploadProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    // Upload the file
    await uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);

    try {
      // Get presigned URL
      const presignRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId,
          type,
          filename: file.name,
          contentType: file.type,
        }),
      });

      if (!presignRes.ok) {
        const error = await presignRes.json();
        throw new Error(error.error || "Failed to get upload URL");
      }

      const { uploadUrl, publicUrl, key } = await presignRes.json();

      // Upload to S3
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadRes.ok) {
        throw new Error("Failed to upload file");
      }

      // Save photo record
      const saveRes = await fetch("/api/upload", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId,
          url: publicUrl,
          key,
          type,
        }),
      });

      if (!saveRes.ok) {
        const error = await saveRes.json();
        throw new Error(error.error || "Failed to save photo");
      }

      toast.success("Photo uploaded successfully!");
      router.refresh();
      onUploadComplete?.();
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error instanceof Error ? error.message : "Upload failed");
      setPreview(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const typeLabels = {
    before: "Before",
    after: "Completion",
    issue: "Issue",
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading}
      />

      {preview ? (
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-48 object-cover"
            />
            {isUploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="text-white">Uploading...</div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card
          className="border-dashed cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={handleClick}
        >
          <CardContent className="py-8 text-center">
            <div className="text-muted-foreground">
              <p className="font-medium">Upload {typeLabels[type]} Photo</p>
              <p className="text-sm">Click to select or drag and drop</p>
              <p className="text-xs mt-1">JPG, PNG, GIF up to 10MB</p>
            </div>
          </CardContent>
        </Card>
      )}

      {!preview && (
        <Button
          variant="outline"
          className="w-full"
          onClick={handleClick}
          disabled={isUploading}
        >
          {isUploading ? "Uploading..." : `Select ${typeLabels[type]} Photo`}
        </Button>
      )}
    </div>
  );
}
