import Link from "next/link";
import { Shield, Package, Map, Bus, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Blog — TransHub",
  description: "Travel tips, company updates, and insights from the TransHub team.",
};

const POSTS = [
  { slug: "safe-interstate-travel-tips",  Icon: Shield,  color: "#2563EB", bg: "#EFF6FF", title: "5 Tips for Safe Interstate Travel in Nigeria",        excerpt: "Planning a trip across states? Here are essential safety tips every traveler should know before hitting the road.", date: "March 20, 2026", category: "Travel Tips"   },
  { slug: "revolutionizing-goods-delivery", Icon: Package, color: "#16A34A", bg: "#F0FDF4", title: "How TransHub is Revolutionizing Goods Delivery",       excerpt: "Learn how our waybill system is making package delivery faster, safer, and more transparent than ever before.",   date: "March 15, 2026", category: "Company News"  },
  { slug: "top-interstate-routes",        Icon: Map,     color: "#D97706", bg: "#FFFBEB", title: "Top 10 Interstate Routes in Nigeria",                   excerpt: "Discover the most popular travel routes and what makes them special for both business and leisure travelers.",     date: "March 10, 2026", category: "Travel Guide"  },
  { slug: "charter-services-guide",       Icon: Bus,     color: "#2563EB", bg: "#EFF6FF", title: "Charter Services: When and Why to Book",               excerpt: "Group travel, corporate events, or special occasions — find out when chartering a vehicle makes the most sense.", date: "March 5, 2026",  category: "Services"      },
];

const CATEGORY_COLORS = {
  "Travel Tips":  { text: "#2563EB", bg: "#EFF6FF" },
  "Company News": { text: "#16A34A", bg: "#F0FDF4" },
  "Travel Guide": { text: "#D97706", bg: "#FFFBEB" },
  "Services":     { text: "#2563EB", bg: "#EFF6FF" },
};

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="bg-linear-to-r from-[#1E40AF] to-[#2563EB] py-14 px-4 text-center">
        <h1 className="text-2xl font-bold text-white mb-2">TransHub Blog</h1>
        <p className="text-sm text-white/75">Travel tips, company updates, and stories from the road.</p>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-5">
        {POSTS.map(({ slug, Icon, color, bg, title, excerpt, date, category }) => {
          const catStyle = CATEGORY_COLORS[category] ?? CATEGORY_COLORS["Services"];
          return (
            <article key={slug} className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden flex flex-col md:flex-row hover:shadow-md transition-shadow">
              <div className="md:w-56 shrink-0 min-h-40 flex items-center justify-center" style={{ background: bg }}>
                <Icon size={40} style={{ color }} />
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ color: catStyle.text, background: catStyle.bg }}>
                    {category}
                  </span>
                  <span className="text-xs text-[#94A3B8]">{date}</span>
                </div>
                <h2 className="text-lg font-bold text-[#0F172A] mb-2">{title}</h2>
                <p className="text-sm text-[#64748B] mb-4 flex-1 leading-relaxed">{excerpt}</p>
                <Link
                  href={`/blog/${slug}`}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-[#2563EB] hover:gap-2 transition-all"
                >
                  Read More <ArrowRight size={14} />
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
