"use client";

import { AuthField, AuthShell, FormMessage, PasswordField, SubmitButton } from "@/components/auth/AuthUI";
import { useLogin } from "@/lib/api";
import { extractAuthError } from "@/lib/api/error";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function SignIn() {
  const router = useRouter();
  const loginMutation = useLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const message = sessionStorage.getItem("auth_success_message");
    if (message) {
      setSuccess(message);
      sessionStorage.removeItem("auth_success_message");
    }
  }, []);

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in to FoodDely"
      description="Use your customer or restaurant account to continue."
      sideTitle="Your next favorite meal is closer than you think."
      sideCopy="Sign in to order faster, track deliveries, and manage your restaurant from one secure account."
    >
      <form
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          setSuccess(null);

          if (!email.trim() || !password) {
            setError("Enter your email address and password.");
            return;
          }

          loginMutation.mutate(
            { username: email.trim(), password },
            {
              onSuccess: (result) => {
                const requestedPath = new URLSearchParams(
                  window.location.search,
                ).get("next");
                const safeNext =
                  requestedPath?.startsWith("/") &&
                  !requestedPath.startsWith("//")
                    ? requestedPath
                    : null;
                router.replace(
                  result.role === "restaurant_owner"
                    ? result.restaurant?.validation_status === "approved" && result.restaurant?.active
                      ? "/dashboard"
                      : "/restaurant-status"
                    : safeNext || "/partners",
                );
              },
              onError: (requestError: unknown) => {
                setPassword("");
                setError(extractAuthError(requestError, "The email or password is incorrect."));
              },
            }
          );
        }}
      >
        <AuthField
          label="Email address"
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          required
        />

        <PasswordField
          label="Password"
          id="password"
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Enter your password"
          visible={showPassword}
          onToggle={() => setShowPassword((value) => !value)}
          required
        />

        <div className="flex items-center justify-end text-sm">
          <Link href="/forgot-password" className="font-semibold text-[#b93425] hover:text-[#8d281d]">
            Forgot password?
          </Link>
        </div>

        {success ? <FormMessage kind="success">{success}</FormMessage> : null}
        {error ? <FormMessage>{error}</FormMessage> : null}

        <SubmitButton pending={loginMutation.isPending}>
          {loginMutation.isPending ? "Signing in…" : "Sign in"}
        </SubmitButton>
      </form>

      <div className="mt-6 border-t border-stone-100 pt-6 text-center text-sm text-stone-600">
        New to FoodDely?{" "}
        <Link href="/signup" className="font-bold text-[#b93425] hover:text-[#8d281d]">
          Create a customer account
        </Link>
        <p className="mt-3">
          Running a restaurant?{" "}
          <Link href="/business-signup" className="font-semibold text-stone-900 hover:text-[#b93425]">
            Join as a partner
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
