"use client";

import { useEffect } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";
import { AlertCircle, RefreshCw, Home } from "lucide-react";

export default function GlobalError({ error, reset }) {
  // Report runtime / render / route errors caught by this segment boundary.
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-[#FEF2F2] rounded-3xl flex items-center justify-center mx-auto mb-6">
          <AlertCircle size={36} className="text-[#DC2626]" />
        </div>

        <h1 className="text-2xl font-bold text-[#0F172A] mb-3">Something Went Wrong</h1>
        <p className="text-[#64748B] mb-2 leading-relaxed">
          An unexpected error occurred. Don&apos;t worry — your data is safe.
        </p>

        {/* Dev only: shows raw error message for debugging; hidden in production */}
        {process.env.NODE_ENV === "development" && error?.message && (
          <pre className="text-xs text-left bg-[#FEF2F2] border border-[#FECACA] rounded-xl p-4 mb-6 overflow-x-auto text-[#DC2626] mt-4">
            {error.message}
          </pre>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-6 py-3 rounded-xl text-sm font-semibold transition-colors"
          >
            <RefreshCw size={15} /> Try Again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 border border-[#E2E8F0] hover:bg-white text-[#475569] px-6 py-3 rounded-xl text-sm font-semibold transition-colors"
          >
            <Home size={15} /> Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
