import Link from "next/link";
import { Ticket, MapPin, Mail, ChevronDown } from "lucide-react";

export const metadata = {
  title: "Help Center — TransHub",
  description: "Find answers to common questions about booking seats, sending goods, chartering, and tracking on TransHub.",
};

const QUICK_LINKS = [
  { href: "/search", Icon: Ticket, color: "#2563EB", bg: "#EFF6FF", title: "Book a Trip",       desc: "Search and book seats" },
  { href: "/track",  Icon: MapPin, color: "#16A34A", bg: "#F0FDF4", title: "Track Package",     desc: "Find your shipment"    },
  { href: "/contact", Icon: Mail,  color: "#D97706", bg: "#FFFBEB", title: "Contact Support",   desc: "Get in touch"          },
];

const FAQS = [
  { question: "How do I book a seat?",              answer: "Search for your route on the homepage, select your preferred trip and departure time, then complete payment. Your e-ticket is issued instantly and sent to your email — show it to the conductor at boarding." },
  { question: "How do I cancel a booking?",         answer: "Go to your dashboard and open the booking you want to cancel. Select 'Cancel Booking' and confirm. Cancellations made more than 24 hours before departure are eligible for a refund processed within 5–7 business days." },
  { question: "What payment methods are accepted?", answer: "We accept all major debit/credit cards, bank transfers, and USSD payments via Paystack. All transactions are secured with 256-bit SSL encryption — we never store your card details." },
  { question: "How do I charter a bus?",            answer: "Go to the Charter page and fill in your route, date, vehicle type, and contact details. Our team will review your request and send a quote within 2 hours. Once you accept and pay, your charter is confirmed." },
  { question: "How do I track a waybill?",          answer: "Visit the Track Package page and enter your waybill number (e.g. WB-2026-K3M9PX). You'll see real-time status updates from pickup through to delivery. Share the waybill number with the recipient so they can track too." },
  { question: "What if I miss my bus?",             answer: "Contact our support team immediately on +234 800 000 0000. We'll check availability on the next departure for the same route. Missed-bus rebooking is subject to seat availability and may incur a rebooking fee." },
];

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="bg-linear-to-r from-[#1E40AF] to-[#2563EB] py-14 px-4 text-center">
        <h1 className="text-2xl font-bold text-white mb-2">Help Center</h1>
        <p className="text-sm text-white/75">Find answers to common questions or get in touch with our support team.</p>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Quick links */}
        <div className="grid md:grid-cols-3 gap-4 mb-12">
          {QUICK_LINKS.map(({ href, Icon, color, bg, title, desc }) => (
            <Link key={href} href={href} className="bg-white rounded-2xl border border-[#E2E8F0] p-6 text-center hover:shadow-md hover:border-[#BFDBFE] transition-all">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: bg }}>
                <Icon size={24} style={{ color }} />
              </div>
              <h3 className="font-bold text-[#0F172A]">{title}</h3>
              <p className="text-sm text-[#94A3B8] mt-0.5">{desc}</p>
            </Link>
          ))}
        </div>

        {/* FAQs */}
        <h2 className="text-xl font-bold text-[#0F172A] mb-5">Frequently Asked Questions</h2>
        <div className="space-y-3">
          {FAQS.map((faq) => (
            <details key={faq.question} className="bg-white rounded-2xl border border-[#E2E8F0] p-5 group">
              <summary className="font-semibold text-[#0F172A] cursor-pointer list-none flex items-center justify-between text-sm">
                {faq.question}
                <ChevronDown size={16} className="text-[#94A3B8] group-open:rotate-180 transition-transform shrink-0 ml-2" />
              </summary>
              <p className="text-[#64748B] mt-4 text-sm leading-relaxed">{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
