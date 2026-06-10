"use client";

/**
 * Root global error boundary — catches errors thrown in the ROOT layout itself
 * (which the per-segment error.js cannot catch), including hydration failures at
 * the root. Reports to Sentry, then renders a minimal self-contained fallback
 * (it must NOT depend on the app layout/components, which may be what failed).
 */
import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", background: "#F8FAFC", margin: 0 }}>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ textAlign: "center", maxWidth: 420 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", marginBottom: 12 }}>
              Something went wrong
            </h1>
            <p style={{ color: "#64748B", marginBottom: 24, lineHeight: 1.6 }}>
              An unexpected error occurred. Our team has been notified.
            </p>
            <button
              onClick={() => reset?.()}
              style={{
                background: "#2563EB", color: "#fff", border: "none", padding: "12px 24px",
                borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer",
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
