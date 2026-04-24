import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-7xl font-extrabold text-blue-600 mb-2">404</p>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Page Not Found</h1>
        <p className="text-gray-500 mb-8 leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
          Let&apos;s get you back on track.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-sm font-semibold transition-colors"
          >
            Go Home
          </Link>
          <Link
            href="/search"
            className="border border-gray-200 hover:bg-gray-50 text-gray-700 px-6 py-3 rounded-xl text-sm font-semibold transition-colors"
          >
            Search Trips
          </Link>
          <Link
            href="/help"
            className="border border-gray-200 hover:bg-gray-50 text-gray-700 px-6 py-3 rounded-xl text-sm font-semibold transition-colors"
          >
            Help Center
          </Link>
        </div>
      </div>
    </div>
  );
}
