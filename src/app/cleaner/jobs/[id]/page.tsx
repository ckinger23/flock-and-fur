import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ApplyForm } from "./apply-form";
import { CleanerJobActions } from "./cleaner-job-actions";

const statusColors: Record<string, string> = {
  OPEN: "bg-blue-100 text-blue-800",
  PENDING: "bg-yellow-100 text-yellow-800",
  IN_PROGRESS: "bg-purple-100 text-purple-800",
  COMPLETED: "bg-green-100 text-green-800",
  CONFIRMED: "bg-emerald-100 text-emerald-800",
  PAID: "bg-gray-100 text-gray-800",
  CANCELLED: "bg-red-100 text-red-800",
  DISPUTED: "bg-orange-100 text-orange-800",
};

export default async function CleanerJobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const userId = session?.user?.id;

  const job = await db.job.findUnique({
    where: { id },
    include: {
      client: {
        select: { name: true },
      },
      applications: {
        where: { cleanerId: userId },
      },
      photos: {
        where: { type: "AFTER" },
      },
    },
  });

  if (!job) {
    notFound();
  }

  const hasApplied = job.applications.length > 0;
  const application = job.applications[0];
  const isAssigned = job.cleanerId === userId;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Link
          href="/cleaner/jobs"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Back to Jobs
        </Link>
      </div>

      {/* Job Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold">{job.title}</h1>
            <Badge variant="secondary" className={statusColors[job.status]}>
              {job.status.replace("_", " ")}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Posted by {job.client.name} on{" "}
            {new Date(job.createdAt).toLocaleDateString()}
          </p>
        </div>

        {isAssigned && (
          <CleanerJobActions job={job} hasCompletionPhotos={job.photos.length > 0} />
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Job Details */}
          <Card>
            <CardHeader>
              <CardTitle>Job Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">
                  Description
                </h4>
                <p className="whitespace-pre-wrap">{job.description}</p>
              </div>

              <Separator />

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">
                    Animal Type
                  </h4>
                  <p>{job.animalTypes.join(", ")}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">
                    Enclosure Type
                  </h4>
                  <p>{job.enclosureType}</p>
                </div>
                {job.enclosureSize && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">
                      Enclosure Size
                    </h4>
                    <p>{job.enclosureSize}</p>
                  </div>
                )}
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">
                    Number of Animals
                  </h4>
                  <p>{job.numberOfAnimals}</p>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">
                  Location
                </h4>
                <p>
                  {isAssigned ? (
                    <>
                      {job.address}
                      <br />
                    </>
                  ) : (
                    <span className="text-muted-foreground">
                      Full address visible after acceptance
                      <br />
                    </span>
                  )}
                  {job.city}, {job.state} {job.zipCode}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Application Form / Status */}
          {job.status === "OPEN" && !hasApplied && (
            <ApplyForm jobId={job.id} suggestedPrice={job.suggestedPrice} />
          )}

          {hasApplied && !isAssigned && (
            <Card>
              <CardHeader>
                <CardTitle>Application Submitted</CardTitle>
                <CardDescription>
                  Your application is pending review by the client
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="text-muted-foreground">Applied:</span>{" "}
                    {new Date(application.createdAt).toLocaleDateString()}
                  </p>
                  {application.proposedPrice && (
                    <p>
                      <span className="text-muted-foreground">
                        Your Quote:
                      </span>{" "}
                      ${Number(application.proposedPrice).toFixed(2)}
                    </p>
                  )}
                  {application.message && (
                    <div>
                      <p className="text-muted-foreground">Your Message:</p>
                      <p className="mt-1">&ldquo;{application.message}&rdquo;</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {job.suggestedPrice && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Client Budget</span>
                  <span className="font-medium">
                    ${Number(job.suggestedPrice).toFixed(2)}
                  </span>
                </div>
              )}
              {isAssigned && job.agreedPrice && (
                <>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Agreed Price</span>
                    <span>${Number(job.agreedPrice).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Your Payout (80%)</span>
                    <span className="text-green-600">
                      ${Number(job.cleanerPayout).toFixed(2)}
                    </span>
                  </div>
                </>
              )}
              {!job.suggestedPrice && !job.agreedPrice && (
                <p className="text-muted-foreground text-sm">
                  Client is accepting quotes
                </p>
              )}
            </CardContent>
          </Card>

          {/* Status Info */}
          {isAssigned && (
            <Card>
              <CardHeader>
                <CardTitle>Job Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  {job.status === "PENDING" && (
                    <p className="text-muted-foreground">
                      You&apos;ve been assigned to this job. Start working when
                      ready.
                    </p>
                  )}
                  {job.status === "IN_PROGRESS" && (
                    <p className="text-muted-foreground">
                      Job is in progress. Upload photos when complete.
                    </p>
                  )}
                  {job.status === "COMPLETED" && (
                    <p className="text-muted-foreground">
                      Waiting for client to confirm and process payment.
                    </p>
                  )}
                  {job.status === "CONFIRMED" && (
                    <p className="text-muted-foreground">
                      Client has confirmed. Payment is being processed.
                    </p>
                  )}
                  {job.status === "PAID" && (
                    <p className="text-green-600 font-medium">
                      Payment received! ${Number(job.cleanerPayout).toFixed(2)}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
