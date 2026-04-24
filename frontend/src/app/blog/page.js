import Link from "next/link";

export const metadata = {
  title: "Blog",
  description: "Travel tips, company updates, and insights from the TransHub team.",
};

/** Blog page with article cards. Posts link to # for now (no detail pages yet). */
const POSTS = [
  {
    slug: "safe-interstate-travel-tips",
    title: "5 Tips for Safe Interstate Travel in Nigeria",
    excerpt: "Planning a trip across states? Here are essential safety tips every traveler should know before hitting the road.",
    date: "March 20, 2026",
    category: "Travel Tips",
    emoji: "🛡️",
  },
  {
    slug: "revolutionizing-goods-delivery",
    title: "How TransHub is Revolutionizing Goods Delivery",
    excerpt: "Learn how our waybill system is making package delivery faster, safer, and more transparent than ever before.",
    date: "March 15, 2026",
    category: "Company News",
    emoji: "📦",
  },
  {
    slug: "top-interstate-routes",
    title: "Top 10 Interstate Routes in Nigeria",
    excerpt: "Discover the most popular travel routes and what makes them special for both business and leisure travelers.",
    date: "March 10, 2026",
    category: "Travel Guide",
    emoji: "🗺️",
  },
  {
    slug: "charter-services-guide",
    title: "Charter Services: When and Why to Book",
    excerpt: "Group travel, corporate events, or special occasions — find out when chartering a vehicle makes the most sense.",
    date: "March 5, 2026",
    category: "Services",
    emoji: "🚐",
  },
];

export default function BlogPage() {
  return (
    <div className="max-w-4xl mx-auto py-20 px-4">
      <h1 className="text-4xl font-bold mb-4 text-center">TransHub Blog</h1>
      <p className="text-lg text-gray-700 mb-12 text-center">
        Travel tips, company updates, and stories from the road.
      </p>

      <div className="grid gap-8">
        {POSTS.map((post) => (
          <article key={post.slug} className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col md:flex-row hover:shadow-md transition-all">
            {/* Emoji placeholder instead of broken images */}
            <div className="md:w-1/3 bg-gray-50 min-h-48 flex items-center justify-center">
              <span className="text-5xl">{post.emoji}</span>
            </div>
            <div className="p-6 flex-1 flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-blue-50 text-blue-600 text-xs font-semibold px-2.5 py-1 rounded-full">
                  {post.category}
                </span>
                <span className="text-gray-400 text-xs">{post.date}</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">{post.title}</h2>
              <p className="text-gray-600 text-sm mb-4 flex-1">{post.excerpt}</p>
              <Link
                href={`/blog/${post.slug}`}
                className="text-blue-600 text-sm font-semibold inline-flex items-center gap-1 hover:underline"
              >
                Read More
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
