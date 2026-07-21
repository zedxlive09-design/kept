/**
 * Kept — App Nav Bar (Phase 2)
 *
 * Responsive top nav with desktop links and mobile hamburger (Sheet).
 * Uses useAuth() for sign out and usePathname() for active link styling.
 * Kept logo links to /dashboard.
 */
"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, LogOut } from "lucide-react";
import { useAuth } from "@/lib/supabase/auth-context";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/items", label: "Items" },
  { href: "/subscriptions", label: "Subscriptions" },
  { href: "/reminders", label: "Reminders" },
  { href: "/settings", label: "Settings" },
] as const;

function NavLink({
  href,
  label,
  active,
  onClick,
}: {
  href: string;
  label: string;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`text-sm font-medium transition-colors hover:text-primary ${
        active ? "text-primary" : "text-muted-foreground"
      }`}
    >
      {label}
    </Link>
  );
}

export function AppNav() {
  const pathname = usePathname();
  const { signOut, user } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-card/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        {/* Logo */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2"
          aria-label="Kept dashboard"
        >
          <Image
            src="/kept-logo-mark.svg"
            alt=""
            width={28}
            height={28}
            className="-rotate-3"
          />
          <span className="text-primary font-semibold text-lg">Kept</span>
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center gap-6" aria-label="Main navigation">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.href}
              href={link.href}
              label={link.label}
              active={pathname === link.href || pathname.startsWith(link.href + "/")}
            />
          ))}
        </nav>

        {/* Right side: sign out + mobile menu */}
        <div className="flex items-center gap-2">
          {/* Mobile hamburger */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                <Menu className="size-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <SheetHeader>
                <SheetTitle>Kept</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 px-4 pt-2" aria-label="Mobile navigation">
                {NAV_LINKS.map((link) => (
                  <NavLink
                    key={link.href}
                    href={link.href}
                    label={link.label}
                    active={pathname === link.href || pathname.startsWith(link.href + "/")}
                  />
                ))}
              </nav>
              <div className="mt-auto border-t border-border px-4 py-4">
                <p className="text-xs text-muted-foreground truncate mb-2">
                  {user?.email}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-2 text-muted-foreground"
                  onClick={() => signOut()}
                >
                  <LogOut className="size-4" />
                  Sign out
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          {/* Desktop sign out */}
          <Button
            variant="ghost"
            size="sm"
            className="hidden md:inline-flex gap-2 text-muted-foreground"
            onClick={() => signOut()}
          >
            <LogOut className="size-4" />
            Sign out
          </Button>
        </div>
      </div>
    </header>
  );
}