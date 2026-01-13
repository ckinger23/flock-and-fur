import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Install table component
// npx shadcn@latest add table

const roleColors: Record<string, string> = {
  CLIENT: "bg-blue-100 text-blue-800",
  CLEANER: "bg-green-100 text-green-800",
  ADMIN: "bg-purple-100 text-purple-800",
};

export default async function AdminUsersPage() {
  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      cleanerProfile: {
        select: { isApproved: true },
      },
      _count: {
        select: {
          jobsAsClient: true,
          jobsAsCleaner: true,
        },
      },
    },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Users</h1>
        <p className="text-muted-foreground">
          Manage all users on the platform
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users ({users.length})</CardTitle>
          <CardDescription>
            View and manage user accounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Name</th>
                  <th className="text-left py-3 px-4 font-medium">Email</th>
                  <th className="text-left py-3 px-4 font-medium">Role</th>
                  <th className="text-left py-3 px-4 font-medium">Jobs</th>
                  <th className="text-left py-3 px-4 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                          {user.name?.[0] || "U"}
                        </div>
                        <span>{user.name || "No name"}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {user.email}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="secondary" className={roleColors[user.role]}>
                        {user.role}
                      </Badge>
                      {user.role === "CLEANER" && user.cleanerProfile && (
                        <Badge
                          variant="outline"
                          className="ml-2"
                        >
                          {user.cleanerProfile.isApproved ? "Approved" : "Pending"}
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {user.role === "CLIENT"
                        ? `${user._count.jobsAsClient} posted`
                        : user.role === "CLEANER"
                        ? `${user._count.jobsAsCleaner} completed`
                        : "-"}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
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
