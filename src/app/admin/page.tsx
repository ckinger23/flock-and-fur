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

export default async function AdminDashboard() {
  // Get stats
  const [
    totalUsers,
    totalClients,
    totalCleaners,
    totalJobs,
    jobsByStatus,
    recentJobs,
    totalRevenue,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { role: "CLIENT" } }),
    db.user.count({ where: { role: "CLEANER" } }),
    db.job.count(),
    db.job.groupBy({ by: ["status"], _count: true }),
    db.job.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        client: { select: { name: true } },
        cleaner: { select: { name: true } },
      },
    }),
    db.job.aggregate({
      where: { status: "PAID" },
      _sum: { platformFee: true },
    }),
  ]);

  const openJobs = jobsByStatus.find((s) => s.status === "OPEN")?._count || 0;
  const activeJobs =
    jobsByStatus
      .filter((s) => ["PENDING", "IN_PROGRESS", "COMPLETED"].includes(s.status))
      .reduce((acc, s) => acc + s._count, 0) || 0;
  const completedJobs =
    jobsByStatus.find((s) => s.status === "PAID")?._count || 0;
  const disputedJobs =
    jobsByStatus.find((s) => s.status === "DISPUTED")?._count || 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of the Flock & Fur platform
          </p>
        </div>
      </div>

      {/* User Stats */}
      <div className="grid sm:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Users</CardDescription>
            <CardTitle className="text-3xl">{totalUsers}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Clients</CardDescription>
            <CardTitle className="text-3xl">{totalClients}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Cleaners</CardDescription>
            <CardTitle className="text-3xl">{totalCleaners}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Platform Revenue</CardDescription>
            <CardTitle className="text-3xl">
              ${Number(totalRevenue._sum.platformFee || 0).toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Job Stats */}
      <div className="grid sm:grid-cols-5 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Jobs</CardDescription>
            <CardTitle className="text-2xl">{totalJobs}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Open</CardDescription>
            <CardTitle className="text-2xl text-blue-600">{openJobs}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active</CardDescription>
            <CardTitle className="text-2xl text-purple-600">
              {activeJobs}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Completed</CardDescription>
            <CardTitle className="text-2xl text-green-600">
              {completedJobs}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Disputed</CardDescription>
            <CardTitle className="text-2xl text-orange-600">
              {disputedJobs}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Recent Jobs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Jobs</CardTitle>
            <CardDescription>Latest jobs on the platform</CardDescription>
          </div>
          <Link href="/admin/jobs">
            <Button variant="outline" size="sm">
              View All
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {recentJobs.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No jobs yet.
            </p>
          ) : (
            <div className="space-y-3">
              {recentJobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <h4 className="font-medium truncate">{job.title}</h4>
                      <Badge
                        variant="secondary"
                        className={statusColors[job.status]}
                      >
                        {job.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Client: {job.client.name}
                      {job.cleaner && ` | Cleaner: ${job.cleaner.name}`}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    {job.agreedPrice && (
                      <p className="font-medium">
                        ${Number(job.agreedPrice).toFixed(2)}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {new Date(job.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
