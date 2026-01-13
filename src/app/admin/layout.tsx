import Link from "next/link";
import { UserNav } from "@/components/shared/user-nav";

export default function AdminLayout({
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
            <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
              Admin
            </span>
            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="/admin"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/admin/jobs"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Jobs
              </Link>
              <Link
                href="/admin/users"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Users
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
