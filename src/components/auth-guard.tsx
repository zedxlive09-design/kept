/**
 * Kept — AuthGuard (Phase 2, §3, §11)
 *
 * Client-side route guard — NOT middleware.
 * See §3: middleware requires an edge/server runtime that
 * doesn't exist once the app is bundled into Capacitor.
 *
 * Wraps with <AuthProvider> so all children (including the nav)
 * can access user/session/loading via useAuth().
 * Uses the auth context's user/loading state instead of calling
 * getSession() directly.
 */
"use client";

import { useEffect } from "react";
import { AuthProvider, useAuth } from "@/lib/supabase/auth-context";

function GuardInner({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      // Full page reload required for Capacitor native bridge — router.push()
      // doesn't work reliably in WKWebView (§16).
      window.location.href = "/login";
    }
  }, [loading, user]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (!user) {
    // Redirect is handled by the effect; render nothing until it fires
    return null;
  }

  return <>{children}</>;
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <GuardInner>{children}</GuardInner>
    </AuthProvider>
  );
}