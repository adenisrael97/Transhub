"use client";

export default function GlobalError({ error, reset }) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Something Went Wrong</h1>
        <p className="text-gray-500 mb-2 leading-relaxed">
          An unexpected error occurred. Don&apos;t worry — your data is safe.
        </p>
        {process.env.NODE_ENV === "development" && error?.message && (
          <pre className="text-xs text-left bg-red-50 border border-red-100 rounded-xl p-4 mb-6 overflow-x-auto text-red-700">
            {error.message}
          </pre>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
          <button
            onClick={reset}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-sm font-semibold transition-colors"
          >
            Try Again
          </button>
          <a
            href="/"
            className="border border-gray-200 hover:bg-gray-50 text-gray-700 px-6 py-3 rounded-xl text-sm font-semibold transition-colors"
          >
            Go Home
          </a>
        </div>
      </div>
    </div>
  );
}
