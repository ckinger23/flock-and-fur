export const dynamic = 'force-dynamic';

import Link from "next/link";
import { auth } from "@/lib/auth";
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
import { StarRating } from "@/components/star-rating";
import { getFavoriteCleaners } from "@/lib/actions/favorites";

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

export default async function ClientDashboard() {
  const session = await auth();

  const jobs = await db.job.findMany({
    where: { clientId: session?.user?.id },
    include: {
      applications: {
        where: { status: "PENDING" },
      },
      cleaner: {
        select: { name: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const stats = await db.job.groupBy({
    by: ["status"],
    where: { clientId: session?.user?.id },
    _count: true,
  });

  const totalJobs = stats.reduce((acc, s) => acc + s._count, 0);
  const openJobs = stats.find((s) => s.status === "OPEN")?._count || 0;
  const completedJobs = stats.find((s) => s.status === "PAID")?._count || 0;

  // Get favorite cleaners
  const { favorites } = await getFavoriteCleaners();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {session?.user?.name?.split(" ")[0]}</h1>
          <p className="text-muted-foreground">
            Manage your cleanup jobs and find cleaners
          </p>
        </div>
        <Link href="/client/jobs/new">
          <Button>Post a New Job</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Jobs</CardDescription>
            <CardTitle className="text-3xl">{totalJobs}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Open Jobs</CardDescription>
            <CardTitle className="text-3xl">{openJobs}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Completed</CardDescription>
            <CardTitle className="text-3xl">{completedJobs}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Recent Jobs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Jobs</CardTitle>
          <CardDescription>Your latest job postings</CardDescription>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                You haven&apos;t posted any jobs yet.
              </p>
              <Link href="/client/jobs/new">
                <Button>Post Your First Job</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/client/jobs/${job.id}`}
                  className="block"
                >
                  <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <h3 className="font-medium truncate">{job.title}</h3>
                        <Badge
                          variant="secondary"
                          className={statusColors[job.status]}
                        >
                          {job.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {job.address}, {job.city}
                      </p>
                      {job.cleaner && (
                        <p className="text-sm text-muted-foreground">
                          Cleaner: {job.cleaner.name}
                        </p>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      {job.applications.length > 0 && job.status === "OPEN" && (
                        <Badge variant="default">
                          {job.applications.length} application
                          {job.applications.length > 1 ? "s" : ""}
                        </Badge>
                      )}
                      {job.agreedPrice && (
                        <p className="text-sm font-medium">
                          ${Number(job.agreedPrice).toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Favorite Cleaners */}
      {favorites && favorites.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Your Favorite Cleaners</CardTitle>
            <CardDescription>
              Cleaners you&apos;ve worked with before
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {favorites.map((cleaner) => (
                <div
                  key={cleaner.id}
                  className="p-4 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-medium">
                      {cleaner.name?.[0] || "C"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{cleaner.name}</p>
                      {cleaner.cleanerProfile?.yearsExperience && (
                        <p className="text-xs text-muted-foreground">
                          {cleaner.cleanerProfile.yearsExperience} yrs exp
                        </p>
                      )}
                    </div>
                  </div>
                  {cleaner.totalReviews > 0 && (
                    <StarRating
                      rating={cleaner.averageRating}
                      size="sm"
                    />
                  )}
                  {cleaner.cleanerProfile?.serviceAreas &&
                    cleaner.cleanerProfile.serviceAreas.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Serves: {cleaner.cleanerProfile.serviceAreas.slice(0, 2).join(", ")}
                      {cleaner.cleanerProfile.serviceAreas.length > 2 && "..."}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
