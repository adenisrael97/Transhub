"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import useAuthStore from "@/store/authStore";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function OperatorLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDemoLogin = () => {
    if (process.env.NODE_ENV !== 'development') return;
    useAuthStore.setState({
      user: {
        fullName: "Obiora Nwankwo",
        email: "info@peacemasstransit.com",
        role: "operator",
        company: "Peace Mass Transit",
        operatorId: "OP-001",
      },
      token: "demo-operator-token",
      isAuthenticated: true,
    });
    router.push("/operator");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    // No backend — show helpful message
    setTimeout(() => {
      setError("Backend not connected. Use the demo login below.");
      setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-green-50 to-white flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">T</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Operator Portal</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your fleet, trips and bookings</p>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="operator@company.com"
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

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2.5">{error}</p>
            )}

            <Button
              type="submit"
              loading={loading}
              fullWidth
              size="lg"
              variant="success"
            >
              Log In
            </Button>
          </form>

          {/* Demo login — only in development */}
          {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 pt-5 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center mb-3">No backend? Try the demo</p>
            <button
              type="button"
              onClick={handleDemoLogin}
              className="w-full py-3 rounded-xl text-sm font-semibold bg-gray-900 text-white hover:bg-gray-800 transition-colors"
            >
              🚌 Demo Login as Peace Mass Transit
            </button>
          </div>
          )}

          <p className="text-center text-sm text-gray-600 mt-6">
            Not registered?{" "}
            <Link href="/register-operator" className="text-green-600 font-semibold hover:underline">
              Apply as an Operator
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
