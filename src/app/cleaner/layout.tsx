import Link from "next/link";
import { UserNav } from "@/components/shared/user-nav";

export default function CleanerLayout({
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
                href="/cleaner"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/cleaner/jobs"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Find Jobs
              </Link>
              <Link
                href="/cleaner/profile"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                My Profile
              </Link>
            </nav>
          </div>
          <UserNav />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 bg-muted/30">{children}</main>
    </div>
  );
}
