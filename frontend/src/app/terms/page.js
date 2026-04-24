/**
 * Terms of Service page — legal content with card-based visual treatment.
 * Each section is wrapped in a card for improved readability.
 */

export const metadata = {
  title: "Terms of Service",
  description: "TransHub terms of service — rules and conditions for using our platform.",
};

const SECTIONS = [
  {
    title: "1. Acceptance of Terms",
    icon: "📜",
    body: "By accessing or using TransHub's services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.",
  },
  {
    title: "2. Use of Services",
    icon: "🚌",
    body: "TransHub provides a platform for booking interstate travel, sending goods, and chartering vehicles. You must be at least 18 years old to use our services. You are responsible for maintaining the confidentiality of your account credentials.",
  },
  {
    title: "3. Bookings and Payments",
    icon: "💳",
    body: "All bookings are subject to availability. Prices are displayed in Nigerian Naira and include applicable fees. Payment must be made at the time of booking. We accept various payment methods including cards, bank transfers, and USSD.",
  },
  {
    title: "4. Cancellations and Refunds",
    icon: "↩️",
    body: "Cancellations made 24 hours or more before departure are eligible for a full refund. Cancellations made less than 24 hours before departure may be subject to a cancellation fee. No-shows are not eligible for refunds.",
  },
  {
    title: "5. Waybill Services",
    icon: "📦",
    body: "When sending goods through our platform, you agree to provide accurate descriptions of the items being shipped. Prohibited items include hazardous materials, illegal substances, and perishable goods without proper packaging. We reserve the right to inspect packages.",
  },
  {
    title: "6. Liability",
    icon: "⚖️",
    body: "TransHub acts as an intermediary between users and transport operators. While we strive to ensure quality service, we are not liable for delays, cancellations, or issues caused by transport operators, weather conditions, or other circumstances beyond our control.",
  },
  {
    title: "7. User Conduct",
    icon: "👤",
    body: "You agree not to use our services for any unlawful purpose, to harass other users, to submit false information, or to attempt to gain unauthorized access to our systems.",
  },
  {
    title: "8. Changes to Terms",
    icon: "🔄",
    body: "We reserve the right to modify these terms at any time. We will notify users of significant changes via email or through our platform. Continued use of our services after changes constitutes acceptance of the new terms.",
  },
];

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto py-20 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Terms of Service</h1>
        <p className="text-gray-500">Last updated: March 25, 2026</p>
      </div>

      <div className="space-y-4">
        {SECTIONS.map((s) => (
          <div key={s.title} className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-start gap-3">
              <span className="text-xl shrink-0">{s.icon}</span>
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-2">{s.title}</h2>
                <p className="text-sm text-gray-600 leading-relaxed">{s.body}</p>
              </div>
            </div>
          </div>
        ))}

        {/* Contact section */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-start gap-3">
            <span className="text-xl shrink-0">📧</span>
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">9. Contact</h2>
              <p className="text-sm text-gray-600 leading-relaxed mb-3">
                For questions about these Terms of Service, contact us at:
              </p>
              <div className="space-y-1 text-sm text-gray-600">
                <p>📧 legal@transhub.ng</p>
                <p>📞 +234 800 000 0000</p>
                <p>📍 123 Transport Lane, Lagos, Nigeria</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
