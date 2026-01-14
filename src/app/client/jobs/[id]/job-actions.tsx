"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { updateJobStatus } from "@/lib/actions/jobs";
import { toast } from "sonner";
import { DisputeButton } from "@/components/dispute-button";

interface Job {
  id: string;
  title: string;
  status: string;
}

export function JobActions({ job }: { job: Job }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);

    // First confirm the job
    const result = await updateJobStatus(job.id, "CONFIRMED");

    if (result.error) {
      toast.error(result.error);
      setIsLoading(false);
      return;
    }

    // Then initiate payment
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: job.id }),
      });

      const data = await res.json();

      if (data.error) {
        toast.error(data.error);
        router.refresh();
      } else if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Failed to initiate payment");
      router.refresh();
    }

    setIsLoading(false);
  };

  const handleCancel = async () => {
    setIsLoading(true);
    const result = await updateJobStatus(job.id, "CANCELLED");

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Job cancelled.");
      router.refresh();
    }
    setIsLoading(false);
  };

  return (
    <div className="flex gap-2">
      {job.status === "COMPLETED" && (
        <>
          <Button onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? "Processing..." : "Confirm & Pay"}
          </Button>
          <DisputeButton jobId={job.id} jobTitle={job.title} />
        </>
      )}

      {job.status === "CONFIRMED" && (
        <>
          <Button onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? "Processing..." : "Pay Now"}
          </Button>
          <DisputeButton jobId={job.id} jobTitle={job.title} />
        </>
      )}

      {(job.status === "OPEN" || job.status === "PENDING") && (
        <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
          Cancel Job
        </Button>
      )}
    </div>
  );
}
