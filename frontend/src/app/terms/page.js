import { ScrollText, Bus, CreditCard, RotateCcw, Package, Scale, User, RefreshCw, Mail, Phone, MapPin } from "lucide-react";

export const metadata = {
  title: "Terms of Service — TransHub",
  description: "TransHub terms of service — rules and conditions for using our platform.",
};

const SECTIONS = [
  { Icon: ScrollText,  color: "#2563EB", title: "1. Acceptance of Terms",      body: "By accessing or using TransHub's services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services." },
  { Icon: Bus,         color: "#D97706", title: "2. Use of Services",           body: "TransHub provides a platform for booking interstate travel, sending goods, and chartering vehicles. You must be at least 18 years old to use our services. You are responsible for maintaining the confidentiality of your account credentials." },
  { Icon: CreditCard,  color: "#16A34A", title: "3. Bookings and Payments",    body: "All bookings are subject to availability. Prices are displayed in Nigerian Naira and include applicable fees. Payment must be made at the time of booking. We accept various payment methods including cards, bank transfers, and USSD." },
  { Icon: RotateCcw,   color: "#2563EB", title: "4. Cancellations and Refunds", body: "Cancellations made 24 hours or more before departure are eligible for a full refund. Cancellations made less than 24 hours before departure may be subject to a cancellation fee. No-shows are not eligible for refunds." },
  { Icon: Package,     color: "#D97706", title: "5. Waybill Services",          body: "When sending goods through our platform, you agree to provide accurate descriptions of the items being shipped. Prohibited items include hazardous materials, illegal substances, and perishable goods without proper packaging. We reserve the right to inspect packages." },
  { Icon: Scale,       color: "#16A34A", title: "6. Liability",                 body: "TransHub acts as an intermediary between users and transport operators. While we strive to ensure quality service, we are not liable for delays, cancellations, or issues caused by transport operators, weather conditions, or other circumstances beyond our control." },
  { Icon: User,        color: "#2563EB", title: "7. User Conduct",              body: "You agree not to use our services for any unlawful purpose, to harass other users, to submit false information, or to attempt to gain unauthorized access to our systems." },
  { Icon: RefreshCw,   color: "#D97706", title: "8. Changes to Terms",          body: "We reserve the right to modify these terms at any time. We will notify users of significant changes via email or through our platform. Continued use of our services after changes constitutes acceptance of the new terms." },
];

const CONTACT_ITEMS = [
  [Mail,   "legal@transhub.ng"                ],
  [Phone,  "+234 800 000 0000"                ],
  [MapPin, "123 Transport Lane, Lagos, Nigeria"],
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="bg-linear-to-r from-[#1E40AF] to-[#2563EB] py-14 px-4 text-center">
        <h1 className="text-2xl font-bold text-white mb-1">Terms of Service</h1>
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
              <h2 className="font-bold text-[#0F172A] mb-2">9. Contact</h2>
              <p className="text-sm text-[#64748B] mb-3">For questions about these Terms of Service, contact us at:</p>
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
