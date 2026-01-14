export const dynamic = 'force-dynamic';

import Link from "next/link";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DisputeActions } from "./dispute-actions";

export default async function AdminDisputesPage() {
  const disputedJobs = await db.job.findMany({
    where: { status: "DISPUTED" },
    include: {
      client: { select: { id: true, name: true, email: true } },
      cleaner: { select: { id: true, name: true, email: true } },
      photos: { where: { type: "AFTER" }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
  });

  // Also get recently resolved disputes
  const recentlyResolved = await db.job.findMany({
    where: {
      OR: [
        { status: "CANCELLED" },
        { status: "PAID" },
      ],
      description: { contains: "[RESOLVED:" },
    },
    include: {
      client: { select: { name: true } },
      cleaner: { select: { name: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 10,
  });

  // Extract dispute reason from description
  const getDisputeReason = (description: string): string => {
    const match = description.match(/\[DISPUTE: ([^\]]+)\]/);
    return match ? match[1] : "No reason provided";
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Link
          href="/admin"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Back to Admin Dashboard
        </Link>
      </div>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Dispute Management</h1>
          <p className="text-muted-foreground">
            Review and resolve job disputes
          </p>
        </div>
        <Badge variant={disputedJobs.length > 0 ? "destructive" : "secondary"}>
          {disputedJobs.length} Active Dispute{disputedJobs.length !== 1 ? "s" : ""}
        </Badge>
      </div>

      {/* Active Disputes */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Active Disputes</CardTitle>
          <CardDescription>
            Jobs that need your attention
          </CardDescription>
        </CardHeader>
        <CardContent>
          {disputedJobs.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No active disputes. Great job!
            </p>
          ) : (
            <div className="space-y-6">
              {disputedJobs.map((job) => (
                <div
                  key={job.id}
                  className="p-4 rounded-lg border bg-orange-50/50"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">{job.title}</h3>
                        <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                          DISPUTED
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {job.address}, {job.city}, {job.state}
                      </p>
                    </div>
                    {job.agreedPrice && (
                      <p className="font-semibold text-lg">
                        ${Number(job.agreedPrice).toFixed(2)}
                      </p>
                    )}
                  </div>

                  {/* Parties Involved */}
                  <div className="grid sm:grid-cols-2 gap-4 mb-4">
                    <div className="p-3 bg-white rounded border">
                      <p className="text-xs text-muted-foreground mb-1">Client</p>
                      <p className="font-medium">{job.client.name}</p>
                      <p className="text-sm text-muted-foreground">{job.client.email}</p>
                    </div>
                    {job.cleaner && (
                      <div className="p-3 bg-white rounded border">
                        <p className="text-xs text-muted-foreground mb-1">Cleaner</p>
                        <p className="font-medium">{job.cleaner.name}</p>
                        <p className="text-sm text-muted-foreground">{job.cleaner.email}</p>
                      </div>
                    )}
                  </div>

                  {/* Dispute Reason */}
                  <div className="p-3 bg-white rounded border mb-4">
                    <p className="text-xs text-muted-foreground mb-1">Dispute Reason</p>
                    <p className="text-sm">{getDisputeReason(job.description)}</p>
                  </div>

                  {/* Has completion photos? */}
                  {job.photos.length > 0 && (
                    <p className="text-sm text-green-600 mb-4">
                      Completion photos available
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Link href={`/admin/disputes/${job.id}`}>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </Link>
                    <DisputeActions jobId={job.id} jobTitle={job.title} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recently Resolved */}
      {recentlyResolved.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recently Resolved</CardTitle>
            <CardDescription>
              Disputes that have been handled
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentlyResolved.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div>
                    <p className="font-medium">{job.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {job.client.name} &bull; {job.cleaner?.name || "No cleaner"}
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className={
                      job.status === "PAID"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }
                  >
                    {job.status === "PAID" ? "Paid" : "Refunded"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
