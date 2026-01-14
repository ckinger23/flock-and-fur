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
import { resolveDispute } from "@/lib/actions/disputes";
import { toast } from "sonner";

interface DisputeActionsProps {
  jobId: string;
  jobTitle: string;
}

export function DisputeActions({ jobId, jobTitle }: DisputeActionsProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resolution, setResolution] = useState<
    "refund_client" | "pay_cleaner" | "partial_refund" | null
  >(null);
  const [notes, setNotes] = useState("");

  const handleResolve = async () => {
    if (!resolution) {
      toast.error("Please select a resolution");
      return;
    }

    setIsLoading(true);

    const result = await resolveDispute(jobId, resolution, notes || undefined);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Dispute resolved successfully");
      setIsOpen(false);
      router.refresh();
    }

    setIsLoading(false);
  };

  const resolutionOptions = [
    {
      value: "refund_client" as const,
      label: "Full Refund to Client",
      description: "Cancel the job and refund the client completely",
      color: "bg-red-50 border-red-200 hover:bg-red-100",
    },
    {
      value: "pay_cleaner" as const,
      label: "Pay Cleaner in Full",
      description: "Rule in favor of the cleaner and process payment",
      color: "bg-green-50 border-green-200 hover:bg-green-100",
    },
    {
      value: "partial_refund" as const,
      label: "Partial Resolution",
      description: "Custom resolution with partial payment/refund",
      color: "bg-yellow-50 border-yellow-200 hover:bg-yellow-100",
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Resolve Dispute</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Resolve Dispute</DialogTitle>
          <DialogDescription>
            Choose how to resolve the dispute for &quot;{jobTitle}&quot;
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Resolution Options */}
          <div className="space-y-2">
            <Label>Resolution</Label>
            <div className="space-y-2">
              {resolutionOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setResolution(option.value)}
                  className={`w-full p-3 rounded-lg border text-left transition-colors ${
                    resolution === option.value
                      ? option.color + " ring-2 ring-offset-1 ring-primary"
                      : "bg-white hover:bg-muted/50"
                  }`}
                >
                  <p className="font-medium text-sm">{option.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {option.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Admin Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Admin Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this resolution..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              These notes will be sent to both parties
            </p>
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
          <Button onClick={handleResolve} disabled={isLoading || !resolution}>
            {isLoading ? "Resolving..." : "Confirm Resolution"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
