export const metadata = {
  title: "Careers",
  description: "Join the TransHub team — explore open positions in engineering, product, operations, and more.",
};

export default function CareersPage() {
  const openings = [
    {
      title: "Senior Software Engineer",
      department: "Engineering",
      location: "Lagos, Nigeria",
      type: "Full-time",
    },
    {
      title: "Product Manager",
      department: "Product",
      location: "Lagos, Nigeria",
      type: "Full-time",
    },
    {
      title: "Customer Support Specialist",
      department: "Support",
      location: "Remote",
      type: "Full-time",
    },
    {
      title: "Marketing Manager",
      department: "Marketing",
      location: "Lagos, Nigeria",
      type: "Full-time",
    },
    {
      title: "Operations Coordinator",
      department: "Operations",
      location: "Abuja, Nigeria",
      type: "Full-time",
    },
  ]

  return (
    <div className="max-w-4xl mx-auto py-20 px-4">
      <h1 className="text-4xl font-bold mb-4 text-center">Careers at TransHub</h1>
      <p className="text-lg text-gray-700 mb-12 text-center">
        Join our team and help revolutionize transportation in Nigeria.
      </p>

      <div className="bg-blue-600 text-white rounded-2xl p-8 mb-12 text-center">
        <h2 className="text-2xl font-bold mb-2">Why Work With Us?</h2>
        <p className="text-blue-100 mb-6">
          Be part of a fast-growing startup that&apos;s changing how Nigerians travel and ship goods.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="bg-white/10 rounded-xl p-4">
            <p className="font-bold text-lg">Competitive Pay</p>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <p className="font-bold text-lg">Health Insurance</p>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <p className="font-bold text-lg">Remote Options</p>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <p className="font-bold text-lg">Growth Culture</p>
          </div>
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-6">Open Positions</h2>
      <div className="space-y-4">
        {openings.map((job) => (
          <div key={job.title} className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">{job.title}</h3>
              <p className="text-sm text-gray-600">
                {job.department} • {job.location} • {job.type}
              </p>
            </div>
            <a
              href="mailto:careers@transhub.ng"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl text-sm font-semibold transition-colors text-center"
            >
              Apply Now
            </a>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <p className="text-gray-600">
          Don&apos;t see a role that fits? Send your resume to{" "}
          <a href="mailto:careers@transhub.ng" className="text-blue-600 font-semibold hover:underline">
            careers@transhub.ng
          </a>
        </p>
      </div>
    </div>
  )
}
