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

export default async function CleanerDashboard() {
  const session = await auth();
  const userId = session?.user?.id;

  // Get cleaner profile
  const profile = await db.cleanerProfile.findUnique({
    where: { userId },
  });

  // Get assigned jobs
  const assignedJobs = await db.job.findMany({
    where: {
      cleanerId: userId,
      status: { in: ["PENDING", "IN_PROGRESS", "COMPLETED"] },
    },
    include: {
      client: { select: { name: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 5,
  });

  // Get pending applications
  const pendingApplications = await db.jobApplication.findMany({
    where: {
      cleanerId: userId,
      status: "PENDING",
    },
    include: {
      job: {
        select: {
          id: true,
          title: true,
          city: true,
          suggestedPrice: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  // Get stats
  const completedJobsCount = await db.job.count({
    where: { cleanerId: userId, status: "PAID" },
  });

  const totalEarnings = await db.job.aggregate({
    where: { cleanerId: userId, status: "PAID" },
    _sum: { cleanerPayout: true },
  });

  const profileComplete = profile?.bio && profile?.animalExperience;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">
            Welcome back, {session?.user?.name?.split(" ")[0]}
          </h1>
          <p className="text-muted-foreground">
            Find jobs and manage your cleanings
          </p>
        </div>
        <Link href="/cleaner/jobs">
          <Button>Browse Jobs</Button>
        </Link>
      </div>

      {/* Profile Alert */}
      {!profileComplete && (
        <Card className="mb-6 border-yellow-200 bg-yellow-50">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Complete Your Profile</p>
                <p className="text-sm text-muted-foreground">
                  A complete profile helps clients trust you and increases your
                  chances of getting hired.
                </p>
              </div>
              <Link href="/cleaner/profile">
                <Button variant="outline" size="sm">
                  Complete Profile
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Completed Jobs</CardDescription>
            <CardTitle className="text-3xl">{completedJobsCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Earnings</CardDescription>
            <CardTitle className="text-3xl">
              ${Number(totalEarnings._sum.cleanerPayout || 0).toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Applications</CardDescription>
            <CardTitle className="text-3xl">
              {pendingApplications.length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Active Jobs */}
        <Card>
          <CardHeader>
            <CardTitle>Active Jobs</CardTitle>
            <CardDescription>Jobs you&apos;re currently working on</CardDescription>
          </CardHeader>
          <CardContent>
            {assignedJobs.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  No active jobs right now.
                </p>
                <Link href="/cleaner/jobs">
                  <Button variant="outline">Find Jobs</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {assignedJobs.map((job) => (
                  <Link
                    key={job.id}
                    href={`/cleaner/jobs/${job.id}`}
                    className="block"
                  >
                    <div className="p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium truncate">{job.title}</h4>
                        <Badge
                          variant="secondary"
                          className={statusColors[job.status]}
                        >
                          {job.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Client: {job.client.name}
                      </p>
                      {job.agreedPrice && (
                        <p className="text-sm font-medium mt-1">
                          Payout: ${Number(job.cleanerPayout).toFixed(2)}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Applications */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Applications</CardTitle>
            <CardDescription>Jobs you&apos;ve applied to</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingApplications.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  No pending applications.
                </p>
                <Link href="/cleaner/jobs">
                  <Button variant="outline">Browse Available Jobs</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingApplications.map((app) => (
                  <Link
                    key={app.id}
                    href={`/cleaner/jobs/${app.job.id}`}
                    className="block"
                  >
                    <div className="p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                      <h4 className="font-medium truncate">{app.job.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {app.job.city}
                      </p>
                      {app.job.suggestedPrice && (
                        <p className="text-sm">
                          Budget: ${Number(app.job.suggestedPrice).toFixed(2)}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Applied {new Date(app.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
