"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useAuth } from "@/hooks/useAuth";
import useAuthStore from "@/store/authStore";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { signIn } = useAuth({ redirectTo });
  const router = useRouter();

  /** Quick demo login — bypasses API, sets admin user directly (dev only) */
  const handleDemoLogin = () => {
    if (process.env.NODE_ENV !== 'development') return;
    useAuthStore.setState({
      user: { fullName: "Admin User", email: "admin@transhub.ng", role: "admin" },
      token: "demo-token",
      isAuthenticated: true,
    });
    router.push("/admin");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await signIn(email, password);
    } catch {
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-20 px-4">
      <h1 className="text-3xl font-bold mb-2 text-center">Welcome Back</h1>
      <p className="text-gray-600 text-center mb-8">Log in to your TransHub account</p>

      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
          />
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" className="rounded border-gray-300" />
              <span className="text-gray-600">Remember me</span>
            </label>
            <span className="text-blue-600 cursor-pointer hover:underline">
              Forgot password?
            </span>
          </div>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2.5">{error}</p>
          )}
          <Button type="submit" loading={loading} fullWidth size="lg">
            Log In
          </Button>
        </form>
        <p className="text-center text-sm text-gray-600 mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/auth/register" className="text-blue-600 font-semibold hover:underline">
            Sign Up
          </Link>
        </p>

        {/* Demo login — only in development */}
        {process.env.NODE_ENV === 'development' && (
        <div className="mt-6 pt-5 border-t border-gray-100">
          <p className="text-xs text-gray-400 text-center mb-3">No backend? Try the demo</p>
          <button
            type="button"
            onClick={handleDemoLogin}
            className="w-full py-3 rounded-xl text-sm font-semibold bg-gray-900 text-white hover:bg-gray-800 transition-colors"
          >
            🚀 Demo Login as Admin
          </button>
        </div>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto py-20 px-4 text-center text-gray-400">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}
