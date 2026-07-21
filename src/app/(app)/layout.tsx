/**
 * Kept — Authenticated App Layout (Phase 2, §11)
 *
 * Wraps all authenticated routes in <AuthGuard>, which provides
 * auth context and redirects to /login if no session.
 * Includes the responsive <AppNav> bar at the top.
 */
import { AuthGuard } from "@/components/auth-guard";
import { AppNav } from "@/components/app-nav";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col">
        <AppNav />
        <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-6">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}