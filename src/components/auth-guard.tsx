/**
 * Kept — AuthGuard (Phase 2)
 *
 * Client-side route guard — NOT middleware.
 * See §3 and §11: middleware requires an edge/server runtime that
 * doesn't exist once the app is bundled into Capacitor.
 *
 * Usage: wraps all pages under src/app/(app)/layout.tsx
 */
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        window.location.href = "/login";
        return;
      }
      setChecked(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        window.location.href = "/login";
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!checked) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  return <>{children}</>;
}