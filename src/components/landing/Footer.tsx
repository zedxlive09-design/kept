import Image from "next/image";
import Link from "next/link";

/**
 * Footer — minimal: logo, copyright, legal links, login.
 *
 * Architecture §8: "Login link, minimal legal, no clutter."
 * Design doc §7: no heavy shadow, flat card style.
 *
 * No 'use client' — static server component.
 */
export function Footer() {
  return (
    <footer className="mt-auto bg-card border-t border-border py-8">
      <div className="max-w-4xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left: logo + copyright */}
        <div className="flex items-center gap-2">
          <Image
            src="/favicon.svg"
            alt="Kept"
            width={24}
            height={24}
            className="select-none"
          />
          <span className="text-sm text-muted-foreground">
            &copy; 2025 Kept. All rights reserved.
          </span>
        </div>

        {/* Right: links */}
        <nav aria-label="Footer navigation" className="flex items-center gap-4 text-sm">
          <Link
            href="#"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Privacy Policy
          </Link>
          <Link
            href="#"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Terms of Service
          </Link>
          <Link
            href="/login"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Log in
          </Link>
        </nav>
      </div>
    </footer>
  );
}