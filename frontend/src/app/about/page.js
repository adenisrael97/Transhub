import Link from "next/link";

export const metadata = {
  title: "About Us",
  description: "Learn about TransHub — Nigeria's #1 interstate transport platform. Our mission, story, and the team behind it.",
};

/**
 * About page — company story, mission, services, and stats.
 * Uses card-based layout consistent with the rest of the app.
 */

const SERVICES = [
  { icon: "🎫", title: "Book Seats",     desc: "Book interstate bus and car seats online with instant e-tickets." },
  { icon: "📦", title: "Send Goods",     desc: "Ship parcels and goods with real-time tracking and waybill numbers." },
  { icon: "🚐", title: "Charter Vehicles", desc: "Charter vehicles for group travel, events, or bulk delivery." },
];

const STATS = [
  { value: "36", label: "States Covered" },
  { value: "100+", label: "Operators" },
  { value: "50K+", label: "Trips Booked" },
  { value: "24/7", label: "Support" },
];

const VALUES = [
  { icon: "🔒", title: "Secure Payments",   desc: "All transactions are encrypted and processed through trusted payment gateways." },
  { icon: "⚡", title: "Instant Confirmation", desc: "Receive your e-ticket or waybill number immediately after booking." },
  { icon: "📍", title: "Nationwide Coverage",  desc: "We operate across all 36 states and the FCT, connecting every corner of Nigeria." },
  { icon: "🤝", title: "Customer First",      desc: "Our dedicated support team is available around the clock to assist you." },
];

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto py-20 px-4">
      {/* Hero */}
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">About TransHub</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Nigeria&apos;s #1 interstate transport platform. We make it easy to book bus
          and car seats, send goods, and charter vehicles anywhere in Nigeria — all in one place.
        </p>
      </div>

      {/* Mission banner */}
      <div className="bg-blue-600 text-white rounded-2xl p-8 mb-16 text-center">
        <h2 className="text-2xl font-bold mb-2">Our Mission</h2>
        <p className="text-blue-100 text-lg max-w-xl mx-auto">
          To make travel and logistics in Nigeria simple, safe, and accessible for everyone.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
        {STATS.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
            <p className="text-3xl font-bold text-blue-600">{s.value}</p>
            <p className="text-sm text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Services */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">What We Offer</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {SERVICES.map((s) => (
            <div key={s.title} className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md transition-all">
              <span className="text-3xl">{s.icon}</span>
              <h3 className="text-lg font-bold text-gray-900 mt-4 mb-2">{s.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Why choose us */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Why Choose TransHub?</h2>
        <div className="grid sm:grid-cols-2 gap-6">
          {VALUES.map((v) => (
            <div key={v.title} className="flex items-start gap-4 bg-white rounded-2xl border border-gray-100 p-5">
              <span className="text-2xl shrink-0">{v.icon}</span>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">{v.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{v.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="text-center">
        <p className="text-gray-600 mb-4">Ready to experience smarter travel?</p>
        <Link
          href="/search"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-sm font-semibold transition-colors"
        >
          Book Your First Trip →
        </Link>
      </div>
    </div>
  );
}
