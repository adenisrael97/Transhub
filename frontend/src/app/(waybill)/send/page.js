import WaybillForm from "@/components/waybill/WaybillForm";
import { Package, Clock, ShieldCheck, MapPin } from "lucide-react";

export const metadata = { title: "Send Goods — TransHub" };

const PERKS = [
  [Clock,       "Real-time tracking with live updates"],
  [ShieldCheck, "Insured delivery for peace of mind"],
  [MapPin,      "Nationwide coverage across Nigeria"],
];

export default function SendPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="bg-linear-to-r from-[#14532D] to-[#16A34A] py-10 px-4">
        <div className="max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-1.5 bg-white/15 text-white text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
            <Package size={11} /> Waybill
          </span>
          <h1 className="text-2xl font-bold text-white mb-1">Send Goods</h1>
          <p className="text-sm text-white/70 leading-relaxed">
            Ship parcels, electronics, or goods anywhere across Nigeria. You&apos;ll receive a unique waybill number for real-time tracking.
          </p>
          <div className="flex flex-wrap gap-4 mt-5">
            {PERKS.map(([Icon, text]) => (
              <div key={text} className="flex items-center gap-1.5 text-xs text-white/80">
                <Icon size={13} className="text-white/60" /> {text}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm">
          <WaybillForm />
        </div>
      </div>
    </div>
  );
}
