import Link from "next/link"

export const metadata = {
  title: "Help & FAQs",
  description: "Find answers to common questions about booking seats, sending goods, chartering, and tracking on TransHub.",
};

export default function HelpPage() {
  const faqs = [
    {
      question: "How do I book a seat?",
      answer: "Simply search for your route, select your preferred trip, choose your seat from the seat map, and complete payment. You'll receive your e-ticket instantly via email and SMS.",
    },
    {
      question: "How do I track my package?",
      answer: "Go to the Track Package page and enter your waybill number. You'll see real-time updates on your package location and estimated delivery time.",
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major debit/credit cards, bank transfers, and USSD payments through Paystack. All transactions are secure and encrypted.",
    },
    {
      question: "Can I cancel or reschedule my booking?",
      answer: "Yes, you can cancel or reschedule up to 24 hours before departure. Visit your booking history and select the booking you want to modify.",
    },
    {
      question: "How does charter service work?",
      answer: "Submit a charter request with your vehicle type, date, and purpose. Our team will contact you within 2 hours with a quote and availability.",
    },
    {
      question: "What if my package is damaged or lost?",
      answer: "Contact our support team immediately with your waybill number. We have insurance coverage for all shipments and will assist with claims.",
    },
  ]

  return (
    <div className="max-w-4xl mx-auto py-20 px-4">
      <h1 className="text-4xl font-bold mb-4 text-center">Help Center</h1>
      <p className="text-lg text-gray-700 mb-12 text-center">
        Find answers to common questions or get in touch with our support team.
      </p>

      <div className="grid md:grid-cols-3 gap-4 mb-12">
        <Link href="/search" className="bg-white rounded-2xl border border-gray-100 p-6 text-center hover:shadow-md transition-all">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
          </div>
          <h3 className="font-bold">Book a Trip</h3>
          <p className="text-sm text-gray-600">Search and book seats</p>
        </Link>
        <Link href="/track" className="bg-white rounded-2xl border border-gray-100 p-6 text-center hover:shadow-md transition-all">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <h3 className="font-bold">Track Package</h3>
          <p className="text-sm text-gray-600">Find your shipment</p>
        </Link>
        <Link href="/contact" className="bg-white rounded-2xl border border-gray-100 p-6 text-center hover:shadow-md transition-all">
          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="font-bold">Contact Support</h3>
          <p className="text-sm text-gray-600">Get in touch</p>
        </Link>
      </div>

      <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
      <div className="space-y-4">
        {faqs.map((faq) => (
          <details key={faq.question} className="bg-white rounded-2xl border border-gray-100 p-6 group">
            <summary className="font-semibold cursor-pointer list-none flex items-center justify-between">
              {faq.question}
              <svg className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <p className="text-gray-600 mt-4 text-sm">{faq.answer}</p>
          </details>
        ))}
      </div>
    </div>
  )
}
