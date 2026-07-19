/**
 * Kept — Signup Page (Phase 2, §11)
 *
 * Email/password signup via Supabase Auth.
 * Passes full_name in user metadata so the on_auth_user_created
 * trigger (§5) can populate the profiles row.
 * On success, redirect to /dashboard.
 */
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase/client";
import { getUserTimezone } from "@/lib/image-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignupPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const passwordTooShort = password.length > 0 && password.length < 8;
  const passwordsDontMatch =
    confirmPassword.length > 0 && password !== confirmPassword;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: displayName },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // §9.7 / §10 — Persist the user's detected IANA timezone so that
    // reminder emails land on the correct local day. The handle_new_user
    // trigger creates the profile with default 'UTC'; we overwrite it
    // here before redirecting. Fire-and-forget — a failed timezone update
    // should not block the user from entering the app.
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("profiles")
        .update({ timezone: getUserTimezone() })
        .eq("id", user.id);
    }

    router.push("/dashboard");
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/" aria-label="Back to home">
            <Image
              src="/kept-logo-mark.svg"
              alt="Kept"
              width={56}
              height={56}
              className="-rotate-3"
              priority
            />
          </Link>
        </div>

        {/* Card */}
        <div className="bg-card border-border rounded-lg border p-6">
          <h1 className="text-primary text-xl font-semibold text-center mb-1">
            Create your account
          </h1>
          <p className="text-muted-foreground text-sm text-center mb-6">
            Start keeping track of what matters
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display name</Label>
              <Input
                id="displayName"
                type="text"
                placeholder="Jane Doe"
                required
                autoComplete="name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="At least 8 characters"
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                aria-invalid={passwordTooShort}
              />
              {passwordTooShort && (
                <p className="text-xs text-destructive">
                  Password must be at least 8 characters.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Re-enter your password"
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                aria-invalid={passwordsDontMatch}
              />
              {passwordsDontMatch && (
                <p className="text-xs text-destructive">
                  Passwords don&apos;t match.
                </p>
              )}
            </div>

            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account…" : "Create account"}
            </Button>
          </form>
        </div>

        {/* Footer link */}
        <p className="text-center text-sm text-muted-foreground mt-4">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-accent font-medium hover:underline"
          >
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}