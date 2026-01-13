"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { applyToJob } from "@/lib/actions/jobs";
import { toast } from "sonner";
import { Decimal } from "@prisma/client/runtime/library";

export function ApplyForm({
  jobId,
  suggestedPrice,
}: {
  jobId: string;
  suggestedPrice: Decimal | null;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [proposedPrice, setProposedPrice] = useState(
    suggestedPrice ? String(suggestedPrice) : ""
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await applyToJob(
      jobId,
      message || undefined,
      proposedPrice ? parseFloat(proposedPrice) : undefined
    );

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Application submitted successfully!");
      router.refresh();
    }

    setIsLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Apply for This Job</CardTitle>
        <CardDescription>
          Send your application to the client. They&apos;ll review and respond.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="proposedPrice">Your Quote (optional)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <Input
                id="proposedPrice"
                type="number"
                step="0.01"
                min="0"
                className="pl-7"
                placeholder={
                  suggestedPrice
                    ? `Suggested: $${Number(suggestedPrice).toFixed(2)}`
                    : "Enter your price"
                }
                value={proposedPrice}
                onChange={(e) => setProposedPrice(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Leave blank to accept the client&apos;s suggested price (if any)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message to Client (optional)</Label>
            <Textarea
              id="message"
              placeholder="Introduce yourself, share your experience, or ask questions about the job..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              disabled={isLoading}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Submitting..." : "Submit Application"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
