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

export function JobActions({ job }: { job: Job }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleStatusUpdate = async (
    status: "CONFIRMED" | "CANCELLED"
  ) => {
    setIsLoading(true);
    const result = await updateJobStatus(job.id, status);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(
        status === "CONFIRMED"
          ? "Job confirmed! Payment will be processed."
          : "Job cancelled."
      );
      router.refresh();
    }
    setIsLoading(false);
  };

  return (
    <div className="flex gap-2">
      {job.status === "COMPLETED" && (
        <Button
          onClick={() => handleStatusUpdate("CONFIRMED")}
          disabled={isLoading}
        >
          {isLoading ? "Processing..." : "Confirm & Pay"}
        </Button>
      )}

      {(job.status === "OPEN" || job.status === "PENDING") && (
        <Button
          variant="outline"
          onClick={() => handleStatusUpdate("CANCELLED")}
          disabled={isLoading}
        >
          Cancel Job
        </Button>
      )}
    </div>
  );
}
