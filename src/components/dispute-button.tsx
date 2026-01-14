"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createDispute } from "@/lib/actions/disputes";
import { toast } from "sonner";

interface DisputeButtonProps {
  jobId: string;
  jobTitle: string;
}

export function DisputeButton({ jobId, jobTitle }: DisputeButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [reason, setReason] = useState("");

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast.error("Please provide a reason for the dispute");
      return;
    }

    setIsLoading(true);

    const result = await createDispute(jobId, reason);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Dispute filed successfully. Our team will review it.");
      setIsOpen(false);
      router.refresh();
    }

    setIsLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-orange-600 border-orange-300 hover:bg-orange-50">
          Report Issue
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report an Issue</DialogTitle>
          <DialogDescription>
            File a dispute for &quot;{jobTitle}&quot;. Our team will review and help resolve the issue.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">What went wrong?</Label>
            <Textarea
              id="reason"
              placeholder="Please describe the issue in detail. Include what you expected vs. what happened..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              disabled={isLoading}
            />
          </div>

          <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
            <p className="font-medium mb-1">What happens next?</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Our team will review your dispute within 24-48 hours</li>
              <li>The cleaner will be notified and can respond</li>
              <li>We may contact you for more information</li>
              <li>Payment will be held until the dispute is resolved</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !reason.trim()}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {isLoading ? "Submitting..." : "File Dispute"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
