"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PhotoUpload } from "@/components/photo-upload";

interface PhotoUploadSectionProps {
  jobId: string;
}

export function PhotoUploadSection({ jobId }: PhotoUploadSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Completion Photos</CardTitle>
        <CardDescription>
          Upload photos of the completed work. This helps verify the job was done
          properly and builds trust with clients.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <PhotoUpload jobId={jobId} type="after" />
      </CardContent>
    </Card>
  );
}
