/**
 * Kept — Authenticated App Layout (Phase 2)
 *
 * Wraps all authenticated routes in <AuthGuard>, which checks
 * supabase.auth.getSession() on mount and redirects to /login if absent.
 * See §3 and §11 for why this is client-side, not middleware.
 */
import { AuthGuard } from "@/components/auth-guard";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <main className="min-h-screen">{children}</main>
    </AuthGuard>
  );
}