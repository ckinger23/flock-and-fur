"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { updateJobStatus } from "@/lib/actions/jobs";
import { toast } from "sonner";

interface Job {
  id: string;
  status: string;
}

export function CleanerJobActions({
  job,
  hasCompletionPhotos,
}: {
  job: Job;
  hasCompletionPhotos: boolean;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleStatusUpdate = async (status: "IN_PROGRESS" | "COMPLETED") => {
    if (status === "COMPLETED" && !hasCompletionPhotos) {
      toast.error("Please upload completion photos before marking as complete.");
      return;
    }

    setIsLoading(true);
    const result = await updateJobStatus(job.id, status);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(
        status === "IN_PROGRESS"
          ? "Job started! Good luck."
          : "Job marked as complete. Waiting for client confirmation."
      );
      router.refresh();
    }
    setIsLoading(false);
  };

  return (
    <div className="flex gap-2">
      {job.status === "PENDING" && (
        <Button
          onClick={() => handleStatusUpdate("IN_PROGRESS")}
          disabled={isLoading}
        >
          {isLoading ? "Starting..." : "Start Job"}
        </Button>
      )}

      {job.status === "IN_PROGRESS" && (
        <Button
          onClick={() => handleStatusUpdate("COMPLETED")}
          disabled={isLoading}
        >
          {isLoading ? "Completing..." : "Mark Complete"}
        </Button>
      )}
    </div>
  );
}
