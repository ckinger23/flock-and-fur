export const dynamic = 'force-dynamic';

import { notFound } from "next/navigation";
import Link from "next/link";
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
import { PhotoGallery } from "@/components/photo-gallery";
import { DisputeActions } from "../dispute-actions";

export default async function DisputeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const job = await db.job.findUnique({
    where: { id },
    include: {
      client: { select: { id: true, name: true, email: true, phone: true } },
      cleaner: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          cleanerProfile: {
            select: { yearsExperience: true, serviceAreas: true }
          }
        }
      },
      photos: { orderBy: { createdAt: "desc" } },
      reviews: {
        include: {
          reviewer: { select: { name: true, role: true } },
        },
      },
      applications: {
        where: { status: "ACCEPTED" },
        select: { proposedPrice: true, message: true, createdAt: true },
      },
    },
  });

  if (!job) {
    notFound();
  }

  // Extract dispute reason from description
  const getDisputeReason = (description: string): string | null => {
    const match = description.match(/\[DISPUTE: ([^\]]+)\]/);
    return match ? match[1] : null;
  };

  const disputeReason = getDisputeReason(job.description);
  const cleanDescription = job.description
    .replace(/\[DISPUTE: [^\]]+\]\n\n/, "")
    .replace(/\[RESOLVED: [^\]]+\]\n\n/, "");

  const completionPhotos = job.photos.filter((p) => p.type === "AFTER");
  const beforePhotos = job.photos.filter((p) => p.type === "BEFORE");

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Link
          href="/admin/disputes"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Back to Disputes
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold">{job.title}</h1>
            <Badge
              variant="secondary"
              className={
                job.status === "DISPUTED"
                  ? "bg-orange-100 text-orange-800"
                  : job.status === "PAID"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }
            >
              {job.status}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {job.address}, {job.city}, {job.state} {job.zipCode}
          </p>
        </div>
        {job.status === "DISPUTED" && (
          <DisputeActions jobId={job.id} jobTitle={job.title} />
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Dispute Reason */}
          {disputeReason && (
            <Card className="border-orange-200 bg-orange-50/50">
              <CardHeader>
                <CardTitle className="text-orange-800">Dispute Reason</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-orange-900">{disputeReason}</p>
              </CardContent>
            </Card>
          )}

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
                <p className="whitespace-pre-wrap">{cleanDescription}</p>
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
              </div>
            </CardContent>
          </Card>

          {/* Completion Photos */}
          {completionPhotos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Completion Photos</CardTitle>
                <CardDescription>
                  Photos uploaded by the cleaner
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PhotoGallery photos={completionPhotos} />
              </CardContent>
            </Card>
          )}

          {/* Before Photos */}
          {beforePhotos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Before Photos</CardTitle>
              </CardHeader>
              <CardContent>
                <PhotoGallery photos={beforePhotos} />
              </CardContent>
            </Card>
          )}

          {/* Reviews */}
          {job.reviews.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Reviews</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {job.reviews.map((review) => (
                  <div key={review.id} className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium">
                        {review.reviewer.name} ({review.reviewer.role})
                      </p>
                      <p className="text-yellow-500">
                        {"★".repeat(review.rating)}
                        {"☆".repeat(5 - review.rating)}
                      </p>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-muted-foreground">
                        {review.comment}
                      </p>
                    )}
                  </div>
                ))}
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
                <div className="flex justify-between text-sm">
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
            </CardContent>
          </Card>

          {/* Client Info */}
          <Card>
            <CardHeader>
              <CardTitle>Client</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">{job.client.name}</p>
              <p className="text-sm text-muted-foreground">{job.client.email}</p>
              {job.client.phone && (
                <p className="text-sm text-muted-foreground">{job.client.phone}</p>
              )}
            </CardContent>
          </Card>

          {/* Cleaner Info */}
          {job.cleaner && (
            <Card>
              <CardHeader>
                <CardTitle>Cleaner</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{job.cleaner.name}</p>
                <p className="text-sm text-muted-foreground">{job.cleaner.email}</p>
                {job.cleaner.phone && (
                  <p className="text-sm text-muted-foreground">{job.cleaner.phone}</p>
                )}
                {job.cleaner.cleanerProfile?.yearsExperience && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {job.cleaner.cleanerProfile.yearsExperience} years experience
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{new Date(job.createdAt).toLocaleDateString()}</span>
              </div>
              {job.completedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Completed</span>
                  <span>{new Date(job.completedAt).toLocaleDateString()}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Updated</span>
                <span>{new Date(job.updatedAt).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
