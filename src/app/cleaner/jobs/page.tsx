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

export default async function BrowseJobsPage() {
  const session = await auth();
  const userId = session?.user?.id;

  // Get open jobs that the cleaner hasn't applied to
  const jobs = await db.job.findMany({
    where: {
      status: "OPEN",
      applications: {
        none: {
          cleanerId: userId,
        },
      },
    },
    include: {
      client: {
        select: { name: true },
      },
      _count: {
        select: { applications: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Get jobs the cleaner has already applied to
  const appliedJobs = await db.job.findMany({
    where: {
      status: "OPEN",
      applications: {
        some: {
          cleanerId: userId,
          status: "PENDING",
        },
      },
    },
    include: {
      client: {
        select: { name: true },
      },
      applications: {
        where: { cleanerId: userId },
        select: { createdAt: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Available Jobs</h1>
        <p className="text-muted-foreground">
          Browse and apply to jobs in your area
        </p>
      </div>

      {/* Applied Jobs */}
      {appliedJobs.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">
            Jobs You&apos;ve Applied To
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {appliedJobs.map((job) => (
              <Link key={job.id} href={`/cleaner/jobs/${job.id}`}>
                <Card className="h-full hover:shadow-md transition-shadow border-blue-200 bg-blue-50/50">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg line-clamp-1">
                        {job.title}
                      </CardTitle>
                      <Badge variant="secondary">Applied</Badge>
                    </div>
                    <CardDescription>{job.client.name}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <p>
                        <span className="text-muted-foreground">Location:</span>{" "}
                        {job.city}, {job.state}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Type:</span>{" "}
                        {job.enclosureType}
                      </p>
                      {job.suggestedPrice && (
                        <p className="font-medium">
                          Budget: ${Number(job.suggestedPrice).toFixed(2)}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Applied{" "}
                        {new Date(
                          job.applications[0].createdAt
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Available Jobs */}
      <div>
        <h2 className="text-xl font-semibold mb-4">
          Available Jobs ({jobs.length})
        </h2>

        {jobs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                No jobs available at the moment. Check back later!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.map((job) => (
              <Link key={job.id} href={`/cleaner/jobs/${job.id}`}>
                <Card className="h-full hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg line-clamp-1">
                        {job.title}
                      </CardTitle>
                      {job._count.applications > 0 && (
                        <Badge variant="outline">
                          {job._count.applications} applicant
                          {job._count.applications > 1 ? "s" : ""}
                        </Badge>
                      )}
                    </div>
                    <CardDescription>{job.client.name}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <p>
                        <span className="text-muted-foreground">Location:</span>{" "}
                        {job.city}, {job.state}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Animals:</span>{" "}
                        {job.animalTypes.join(", ")}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Type:</span>{" "}
                        {job.enclosureType}
                      </p>
                      {job.suggestedPrice && (
                        <p className="font-medium">
                          Budget: ${Number(job.suggestedPrice).toFixed(2)}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Posted {new Date(job.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
