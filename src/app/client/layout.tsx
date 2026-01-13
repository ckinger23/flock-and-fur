import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UserNav } from "@/components/shared/user-nav";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-background sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-xl font-bold">
              Flock & Fur
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="/client"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/client/jobs"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                My Jobs
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/client/jobs/new">
              <Button size="sm">Post a Job</Button>
            </Link>
            <UserNav />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 bg-muted/30">{children}</main>
    </div>
  );
}
