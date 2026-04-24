import WaybillForm from "@/components/waybill/WaybillForm";

export const metadata = { title: "Send Goods" };

export default function SendPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFF]">
      <div className="max-w-2xl mx-auto px-4 py-14">
        <div className="mb-8">
          <span className="inline-block bg-green-100 text-green-700 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">Waybill</span>
          <h1 className="text-3xl font-extrabold text-gray-900">Send Goods</h1>
          <p className="text-gray-500 mt-2 text-sm leading-relaxed">
            Ship parcels, electronics, or goods anywhere across Nigeria. You&apos;ll receive a unique waybill number for real-time tracking.
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <WaybillForm />
        </div>
      </div>
    </div>
  );
}
