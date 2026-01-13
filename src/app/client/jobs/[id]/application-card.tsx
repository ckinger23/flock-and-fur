"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { acceptApplication } from "@/lib/actions/jobs";
import { toast } from "sonner";
import { Decimal } from "@prisma/client/runtime/library";

interface Application {
  id: string;
  message: string | null;
  proposedPrice: Decimal | null;
  createdAt: Date;
  cleaner: {
    id: string;
    name: string | null;
    image: string | null;
    cleanerProfile: {
      bio: string | null;
      yearsExperience: number | null;
    } | null;
  };
}

export function ApplicationCard({
  application,
  suggestedPrice,
}: {
  application: Application;
  suggestedPrice: Decimal | null;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleAccept = async () => {
    setIsLoading(true);
    const result = await acceptApplication(application.id);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Cleaner accepted! They will be notified.");
      router.refresh();
    }
    setIsLoading(false);
  };

  const initials =
    application.cleaner.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "C";

  const displayPrice = application.proposedPrice || suggestedPrice;

  return (
    <div className="p-4 border rounded-lg">
      <div className="flex items-start gap-4">
        <Avatar className="h-12 w-12">
          <AvatarImage src={application.cleaner.image || undefined} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-medium">{application.cleaner.name}</h4>
            {displayPrice && (
              <span className="font-semibold">
                ${Number(displayPrice).toFixed(2)}
              </span>
            )}
          </div>

          {application.cleaner.cleanerProfile?.yearsExperience && (
            <p className="text-sm text-muted-foreground">
              {application.cleaner.cleanerProfile.yearsExperience} years experience
            </p>
          )}

          {application.message && (
            <p className="text-sm mt-2 text-muted-foreground">
              &ldquo;{application.message}&rdquo;
            </p>
          )}

          <div className="flex items-center gap-2 mt-3">
            <Button size="sm" onClick={handleAccept} disabled={isLoading}>
              {isLoading ? "Accepting..." : "Accept"}
            </Button>
            <span className="text-xs text-muted-foreground">
              Applied {new Date(application.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
