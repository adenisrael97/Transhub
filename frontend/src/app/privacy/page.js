import { ClipboardList, Settings, Users, Lock, CheckCircle2, Cookie, Mail, Phone, MapPin } from "lucide-react";

export const metadata = {
  title: "Privacy Policy — TransHub",
  description: "TransHub privacy policy — how we collect, use, and protect your personal data.",
};

const SECTIONS = [
  { Icon: ClipboardList, color: "#2563EB", title: "1. Information We Collect",   body: "We collect information you provide directly to us, such as when you create an account, make a booking, send a package, or contact us for support. This includes your name, email address, phone number, payment information, and travel details." },
  { Icon: Settings,      color: "#D97706", title: "2. How We Use Your Information", body: "We use the information we collect to provide, maintain, and improve our services, process transactions, send you booking confirmations and updates, respond to your comments and questions, and send you marketing communications (with your consent)." },
  { Icon: Users,         color: "#16A34A", title: "3. Information Sharing",       body: "We do not sell your personal information. We may share your information with transport operators to fulfill your booking, payment processors to process transactions, and service providers who assist us in operating our platform." },
  { Icon: Lock,          color: "#2563EB", title: "4. Data Security",             body: "We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. All payment transactions are encrypted using SSL technology." },
  { Icon: CheckCircle2,  color: "#16A34A", title: "5. Your Rights",               body: "You have the right to access, update, or delete your personal information at any time. You can manage your account settings or contact us to exercise these rights. You may also opt out of marketing communications at any time." },
  { Icon: Cookie,        color: "#D97706", title: "6. Cookies",                   body: "We use cookies and similar tracking technologies to track activity on our platform and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent." },
];

const CONTACT_ITEMS = [
  [Mail,  "privacy@transhub.ng"              ],
  [Phone, "+234 800 000 0000"                 ],
  [MapPin, "123 Transport Lane, Lagos, Nigeria"],
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="bg-linear-to-r from-[#1E40AF] to-[#2563EB] py-14 px-4 text-center">
        <h1 className="text-2xl font-bold text-white mb-1">Privacy Policy</h1>
        <p className="text-sm text-white/75">Last updated: March 25, 2026</p>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12 space-y-3">
        {SECTIONS.map(({ Icon, color, title, body }) => (
          <div key={title} className="bg-white rounded-2xl border border-[#E2E8F0] p-6">
            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}15` }}>
                <Icon size={18} style={{ color }} />
              </div>
              <div>
                <h2 className="font-bold text-[#0F172A] mb-2">{title}</h2>
                <p className="text-sm text-[#64748B] leading-relaxed">{body}</p>
              </div>
            </div>
          </div>
        ))}

        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6">
          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-[#EFF6FF]">
              <Mail size={18} className="text-[#2563EB]" />
            </div>
            <div>
              <h2 className="font-bold text-[#0F172A] mb-2">7. Contact Us</h2>
              <p className="text-sm text-[#64748B] leading-relaxed mb-3">If you have any questions about this Privacy Policy, please contact us at:</p>
              <div className="space-y-1.5">
                {CONTACT_ITEMS.map(([Icon, text]) => (
                  <p key={text} className="flex items-center gap-2 text-sm text-[#475569]">
                    <Icon size={13} className="text-[#94A3B8] shrink-0" /> {text}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
