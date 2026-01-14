export const dynamic = 'force-dynamic';

import Link from "next/link";
import { db } from "@/lib/db";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/star-rating";

export default async function AdminAnalyticsPage() {
  // Get date ranges
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Revenue metrics
  const [totalRevenue, monthRevenue, weekRevenue] = await Promise.all([
    db.job.aggregate({
      where: { status: "PAID" },
      _sum: { platformFee: true, agreedPrice: true },
      _count: true,
    }),
    db.job.aggregate({
      where: { status: "PAID", paidAt: { gte: thirtyDaysAgo } },
      _sum: { platformFee: true, agreedPrice: true },
      _count: true,
    }),
    db.job.aggregate({
      where: { status: "PAID", paidAt: { gte: sevenDaysAgo } },
      _sum: { platformFee: true, agreedPrice: true },
      _count: true,
    }),
  ]);

  // User growth
  const [totalUsers, newUsersMonth, newUsersWeek] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    db.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
  ]);

  const [totalClients, totalCleaners] = await Promise.all([
    db.user.count({ where: { role: "CLIENT" } }),
    db.user.count({ where: { role: "CLEANER" } }),
  ]);

  // Job statistics
  const jobsByStatus = await db.job.groupBy({
    by: ["status"],
    _count: true,
  });

  const totalJobs = jobsByStatus.reduce((acc, s) => acc + s._count, 0);
  const paidJobs = jobsByStatus.find((s) => s.status === "PAID")?._count || 0;
  const cancelledJobs = jobsByStatus.find((s) => s.status === "CANCELLED")?._count || 0;
  const completionRate = totalJobs > 0
    ? ((paidJobs / (totalJobs - jobsByStatus.filter(s => s.status === "OPEN").reduce((a, s) => a + s._count, 0))) * 100).toFixed(1)
    : "0";

  // Average job value
  const avgJobValue = totalRevenue._count > 0
    ? Number(totalRevenue._sum.agreedPrice || 0) / totalRevenue._count
    : 0;

  // Top cleaners by completed jobs
  const topCleaners = await db.user.findMany({
    where: {
      role: "CLEANER",
      jobsAsCleaner: { some: { status: "PAID" } },
    },
    select: {
      id: true,
      name: true,
      _count: {
        select: { jobsAsCleaner: { where: { status: "PAID" } } },
      },
    },
    orderBy: {
      jobsAsCleaner: { _count: "desc" },
    },
    take: 5,
  });

  // Get ratings for top cleaners
  const topCleanersWithRatings = await Promise.all(
    topCleaners.map(async (cleaner) => {
      const reviews = await db.review.aggregate({
        where: { revieweeId: cleaner.id },
        _avg: { rating: true },
        _count: true,
      });
      return {
        ...cleaner,
        avgRating: reviews._avg.rating || 0,
        totalReviews: reviews._count,
      };
    })
  );

  // Jobs by animal type
  const allJobs = await db.job.findMany({
    select: { animalTypes: true },
  });

  const animalTypeCounts: Record<string, number> = {};
  allJobs.forEach((job) => {
    job.animalTypes.forEach((type) => {
      animalTypeCounts[type] = (animalTypeCounts[type] || 0) + 1;
    });
  });

  const sortedAnimalTypes = Object.entries(animalTypeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Recent activity (last 7 days)
  const recentJobs = await db.job.count({
    where: { createdAt: { gte: sevenDaysAgo } },
  });
  const recentApplications = await db.jobApplication.count({
    where: { createdAt: { gte: sevenDaysAgo } },
  });

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
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">
            Platform performance and insights
          </p>
        </div>
      </div>

      {/* Revenue Overview */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Revenue</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              ${Number(totalRevenue._sum.agreedPrice || 0).toFixed(2)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Platform fee: ${Number(totalRevenue._sum.platformFee || 0).toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Last 30 Days</CardDescription>
            <CardTitle className="text-3xl">
              ${Number(monthRevenue._sum.agreedPrice || 0).toFixed(2)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {monthRevenue._count} jobs completed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Last 7 Days</CardDescription>
            <CardTitle className="text-3xl">
              ${Number(weekRevenue._sum.agreedPrice || 0).toFixed(2)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {weekRevenue._count} jobs completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Key Metrics */}
      <div className="grid sm:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg Job Value</CardDescription>
            <CardTitle className="text-2xl">
              ${avgJobValue.toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Completion Rate</CardDescription>
            <CardTitle className="text-2xl">
              {completionRate}%
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Jobs</CardDescription>
            <CardTitle className="text-2xl">{totalJobs}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Cancelled Jobs</CardDescription>
            <CardTitle className="text-2xl text-red-600">{cancelledJobs}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* User Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>User Statistics</CardTitle>
            <CardDescription>Platform user breakdown</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <span>Total Users</span>
              <span className="font-bold text-xl">{totalUsers}</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Clients</p>
                <p className="text-2xl font-bold text-blue-600">{totalClients}</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Cleaners</p>
                <p className="text-2xl font-bold text-purple-600">{totalCleaners}</p>
              </div>
            </div>
            <div className="pt-2 border-t">
              <p className="text-sm text-muted-foreground mb-2">Growth</p>
              <div className="flex gap-4">
                <div>
                  <p className="text-lg font-semibold">{newUsersMonth}</p>
                  <p className="text-xs text-muted-foreground">Last 30 days</p>
                </div>
                <div>
                  <p className="text-lg font-semibold">{newUsersWeek}</p>
                  <p className="text-xs text-muted-foreground">Last 7 days</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Cleaners */}
        <Card>
          <CardHeader>
            <CardTitle>Top Cleaners</CardTitle>
            <CardDescription>By completed jobs</CardDescription>
          </CardHeader>
          <CardContent>
            {topCleanersWithRatings.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No completed jobs yet
              </p>
            ) : (
              <div className="space-y-3">
                {topCleanersWithRatings.map((cleaner, index) => (
                  <div
                    key={cleaner.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{cleaner.name}</p>
                        {cleaner.totalReviews > 0 && (
                          <StarRating rating={cleaner.avgRating} size="sm" />
                        )}
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {cleaner._count.jobsAsCleaner} jobs
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Popular Animal Types */}
        <Card>
          <CardHeader>
            <CardTitle>Popular Animal Types</CardTitle>
            <CardDescription>Most requested cleanup types</CardDescription>
          </CardHeader>
          <CardContent>
            {sortedAnimalTypes.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No jobs yet
              </p>
            ) : (
              <div className="space-y-3">
                {sortedAnimalTypes.map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="capitalize">{type.toLowerCase()}</span>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2 bg-primary rounded"
                        style={{
                          width: `${(count / sortedAnimalTypes[0][1]) * 100}px`,
                        }}
                      />
                      <span className="text-sm text-muted-foreground w-8">
                        {count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-3xl font-bold">{recentJobs}</p>
                <p className="text-sm text-muted-foreground">New Jobs</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-3xl font-bold">{recentApplications}</p>
                <p className="text-sm text-muted-foreground">Applications</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-2">Job Status Breakdown</p>
              <div className="space-y-2">
                {jobsByStatus.map((status) => (
                  <div key={status.status} className="flex justify-between text-sm">
                    <span className="capitalize">
                      {status.status.replace("_", " ").toLowerCase()}
                    </span>
                    <span className="font-medium">{status._count}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
