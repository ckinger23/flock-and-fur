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
import { JobActions } from "./job-actions";
import { ApplicationCard } from "./application-card";

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

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  const job = await db.job.findUnique({
    where: { id },
    include: {
      client: {
        select: { name: true, email: true },
      },
      cleaner: {
        select: { name: true, email: true },
      },
      applications: {
        include: {
          cleaner: {
            select: {
              id: true,
              name: true,
              image: true,
              cleanerProfile: {
                select: {
                  bio: true,
                  yearsExperience: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      photos: true,
      reviews: true,
    },
  });

  if (!job) {
    notFound();
  }

  // Ensure user owns this job
  if (job.clientId !== session?.user?.id && session?.user?.role !== "ADMIN") {
    notFound();
  }

  const pendingApplications = job.applications.filter(
    (app) => app.status === "PENDING"
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Link
          href="/client"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Back to Dashboard
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
            Posted on {new Date(job.createdAt).toLocaleDateString()}
          </p>
        </div>
        <JobActions job={job} />
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
                  {job.address}
                  <br />
                  {job.city}, {job.state} {job.zipCode}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Applications */}
          {job.status === "OPEN" && (
            <Card>
              <CardHeader>
                <CardTitle>Applications ({pendingApplications.length})</CardTitle>
                <CardDescription>
                  Review and accept a cleaner for this job
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingApplications.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No applications yet. Your job is visible to cleaners.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {pendingApplications.map((application) => (
                      <ApplicationCard
                        key={application.id}
                        application={application}
                        suggestedPrice={job.suggestedPrice}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Assigned Cleaner */}
          {job.cleaner && job.status !== "OPEN" && (
            <Card>
              <CardHeader>
                <CardTitle>Assigned Cleaner</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-lg font-medium">
                    {job.cleaner.name?.[0] || "C"}
                  </div>
                  <div>
                    <p className="font-medium">{job.cleaner.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {job.cleaner.email}
                    </p>
                  </div>
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
                  <span className="text-muted-foreground">Suggested Price</span>
                  <span>${Number(job.suggestedPrice).toFixed(2)}</span>
                </div>
              )}
              {job.agreedPrice && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Agreed Price</span>
                    <span className="font-medium">
                      ${Number(job.agreedPrice).toFixed(2)}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Platform Fee (20%)</span>
                    <span>${Number(job.platformFee).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Cleaner Payout</span>
                    <span>${Number(job.cleanerPayout).toFixed(2)}</span>
                  </div>
                </>
              )}
              {!job.suggestedPrice && !job.agreedPrice && (
                <p className="text-muted-foreground text-sm">
                  Awaiting quotes from cleaners
                </p>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span>{new Date(job.createdAt).toLocaleDateString()}</span>
                </div>
                {job.scheduledDate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Scheduled</span>
                    <span>
                      {new Date(job.scheduledDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {job.completedAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Completed</span>
                    <span>
                      {new Date(job.completedAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {job.confirmedAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Confirmed</span>
                    <span>
                      {new Date(job.confirmedAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
