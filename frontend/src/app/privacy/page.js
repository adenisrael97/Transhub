/**
 * Privacy Policy page — legal content with card-based visual treatment.
 * Each section is wrapped in a card for improved readability.
 */

export const metadata = {
  title: "Privacy Policy",
  description: "TransHub privacy policy — how we collect, use, and protect your personal data.",
};

const SECTIONS = [
  {
    title: "1. Information We Collect",
    icon: "📋",
    body: "We collect information you provide directly to us, such as when you create an account, make a booking, send a package, or contact us for support. This includes your name, email address, phone number, payment information, and travel details.",
  },
  {
    title: "2. How We Use Your Information",
    icon: "⚙️",
    body: "We use the information we collect to provide, maintain, and improve our services, process transactions, send you booking confirmations and updates, respond to your comments and questions, and send you marketing communications (with your consent).",
  },
  {
    title: "3. Information Sharing",
    icon: "🤝",
    body: "We do not sell your personal information. We may share your information with transport operators to fulfill your booking, payment processors to process transactions, and service providers who assist us in operating our platform.",
  },
  {
    title: "4. Data Security",
    icon: "🔒",
    body: "We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. All payment transactions are encrypted using SSL technology.",
  },
  {
    title: "5. Your Rights",
    icon: "✅",
    body: "You have the right to access, update, or delete your personal information at any time. You can manage your account settings or contact us to exercise these rights. You may also opt out of marketing communications at any time.",
  },
  {
    title: "6. Cookies",
    icon: "🍪",
    body: "We use cookies and similar tracking technologies to track activity on our platform and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.",
  },
];

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto py-20 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
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
              <h2 className="text-lg font-bold text-gray-900 mb-2">7. Contact Us</h2>
              <p className="text-sm text-gray-600 leading-relaxed mb-3">
                If you have any questions about this Privacy Policy, please contact us at:
              </p>
              <div className="space-y-1 text-sm text-gray-600">
                <p>📧 privacy@transhub.ng</p>
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
