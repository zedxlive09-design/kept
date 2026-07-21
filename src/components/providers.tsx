"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";

/**
 * Kept — Client-side providers wrapper
 *
 * next-themes is the only client provider needed for Phase 0.
 * Auth state will be handled by <AuthGuard> in the (app) layout (Phase 2).
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      {children}
      <Toaster />
    </NextThemesProvider>
  );
}