export const dynamic = 'force-dynamic';

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

export default async function AdminJobsPage() {
  const jobs = await db.job.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      client: { select: { name: true, email: true } },
      cleaner: { select: { name: true, email: true } },
      _count: {
        select: { applications: true },
      },
    },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Jobs</h1>
        <p className="text-muted-foreground">
          View and manage all jobs on the platform
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Jobs ({jobs.length})</CardTitle>
          <CardDescription>
            Monitor job progress and resolve disputes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Job</th>
                  <th className="text-left py-3 px-4 font-medium">Client</th>
                  <th className="text-left py-3 px-4 font-medium">Cleaner</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-left py-3 px-4 font-medium">Price</th>
                  <th className="text-left py-3 px-4 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium">{job.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {job.city}, {job.state}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p>{job.client.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {job.client.email}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {job.cleaner ? (
                        <div>
                          <p>{job.cleaner.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {job.cleaner.email}
                          </p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">
                          {job._count.applications} applicant
                          {job._count.applications !== 1 ? "s" : ""}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant="secondary"
                        className={statusColors[job.status]}
                      >
                        {job.status.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      {job.agreedPrice ? (
                        <div>
                          <p>${Number(job.agreedPrice).toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">
                            Fee: ${Number(job.platformFee).toFixed(2)}
                          </p>
                        </div>
                      ) : job.suggestedPrice ? (
                        <span className="text-muted-foreground">
                          ~${Number(job.suggestedPrice).toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {new Date(job.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
