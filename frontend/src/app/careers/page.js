import { DollarSign, HeartPulse, Laptop, TrendingUp, MapPin, Briefcase, Clock } from "lucide-react";

export const metadata = {
  title: "Careers — TransHub",
  description: "Join the TransHub team — explore open positions in engineering, product, operations, and more.",
};

const PERKS = [
  [DollarSign, "Competitive Pay"  ],
  [HeartPulse, "Health Insurance" ],
  [Laptop,     "Remote Options"   ],
  [TrendingUp, "Growth Culture"   ],
];

const OPENINGS = [
  { title: "Senior Software Engineer",     department: "Engineering", location: "Lagos, Nigeria", type: "Full-time" },
  { title: "Product Manager",              department: "Product",     location: "Lagos, Nigeria", type: "Full-time" },
  { title: "Customer Support Specialist",  department: "Support",     location: "Remote",         type: "Full-time" },
  { title: "Marketing Manager",            department: "Marketing",   location: "Lagos, Nigeria", type: "Full-time" },
  { title: "Operations Coordinator",       department: "Operations",  location: "Abuja, Nigeria", type: "Full-time" },
];

const DEPT_COLORS = {
  Engineering: { text: "#2563EB", bg: "#EFF6FF" },
  Product:     { text: "#D97706", bg: "#FFFBEB" },
  Support:     { text: "#16A34A", bg: "#F0FDF4" },
  Marketing:   { text: "#D97706", bg: "#FFFBEB" },
  Operations:  { text: "#2563EB", bg: "#EFF6FF" },
};

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="bg-linear-to-r from-[#1E40AF] to-[#2563EB] py-14 px-4 text-center">
        <h1 className="text-2xl font-bold text-white mb-2">Careers at TransHub</h1>
        <p className="text-sm text-white/75">Join our team and help revolutionize transportation in Nigeria.</p>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Why us */}
        <div className="bg-[#2563EB] rounded-2xl p-8 mb-12">
          <h2 className="text-lg font-bold text-white mb-1 text-center">Why Work With Us?</h2>
          <p className="text-sm text-[#BFDBFE] mb-6 text-center">
            Be part of a fast-growing startup that&apos;s changing how Nigerians travel and ship goods.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {PERKS.map(([Icon, label]) => (
              <div key={label} className="bg-white/10 rounded-xl p-4 text-center">
                <Icon size={22} className="text-white mx-auto mb-2" />
                <p className="text-sm font-semibold text-white">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Open roles */}
        <h2 className="text-xl font-bold text-[#0F172A] mb-5">Open Positions</h2>
        <div className="space-y-3">
          {OPENINGS.map((job) => {
            const c = DEPT_COLORS[job.department] ?? DEPT_COLORS.Engineering;
            return (
              <div key={job.title} className="bg-white rounded-2xl border border-[#E2E8F0] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-[#0F172A]">{job.title}</h3>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full" style={{ color: c.text, background: c.bg }}>
                      {job.department}
                    </span>
                  </div>
                  <p className="text-sm text-[#94A3B8] flex items-center gap-3">
                    <span className="flex items-center gap-1"><MapPin size={12} /> {job.location}</span>
                    <span className="flex items-center gap-1"><Clock size={12} /> {job.type}</span>
                  </p>
                </div>
                <a
                  href="mailto:careers@transhub.ng"
                  className="shrink-0 bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-5 py-2 rounded-xl text-sm font-semibold transition-colors text-center flex items-center gap-1.5"
                >
                  <Briefcase size={14} /> Apply Now
                </a>
              </div>
            );
          })}
        </div>

        <div className="mt-10 text-center">
          <p className="text-sm text-[#64748B]">
            Don&apos;t see a role that fits? Send your resume to{" "}
            <a href="mailto:careers@transhub.ng" className="text-[#2563EB] font-semibold hover:underline">
              careers@transhub.ng
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
