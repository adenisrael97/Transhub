"use client";

import { useState } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import useToastStore from "@/store/toastStore";

/**
 * Contact page — form + company contact info + office hours.
 * Uses reusable Input/Button components and toast notifications.
 */
export default function ContactPage() {
  const toast = useToastStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // TODO: Replace with actual API call when backend is ready
      await new Promise((resolve) => setTimeout(resolve, 800));
      toast.success("Message sent! We'll get back to you shortly.");
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch {
      toast.error("Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-20 px-4">
      <h1 className="text-4xl font-bold mb-4 text-center">Contact Us</h1>
      <p className="text-lg text-gray-700 mb-12 text-center">
        Have a question or need help? We&apos;re here for you.
      </p>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Contact form */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-xl font-bold mb-4">Send us a message</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Your Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="John Doe"
              required
            />
            <Input
              label="Email Address"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
            />
            <Input
              label="Subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              placeholder="How can we help?"
              required
            />
            {/* Textarea — styled to match Input component */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Message <span className="text-red-500 ml-0.5">*</span>
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows={4}
                placeholder="Tell us more…"
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-400 transition-all focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <Button type="submit" loading={loading} fullWidth>
              Send Message
            </Button>
          </form>
        </div>

        {/* Contact info + office hours */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-xl font-bold mb-4">Contact Information</h2>
            <div className="space-y-4">
              {[
                { icon: "📞", label: "Phone", value: "+234 800 000 0000" },
                { icon: "✉️", label: "Email", value: "support@transhub.ng" },
                { icon: "📍", label: "Address", value: "123 Transport Lane, Lagos, Nigeria" },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-3">
                  <span className="text-lg">{item.icon}</span>
                  <div>
                    <p className="text-xs text-gray-400">{item.label}</p>
                    <p className="font-semibold text-gray-800 text-sm">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-xl font-bold mb-4">Office Hours</h2>
            <div className="space-y-2 text-sm">
              {[
                { day: "Monday – Friday", hours: "8:00 AM – 8:00 PM" },
                { day: "Saturday", hours: "9:00 AM – 5:00 PM" },
                { day: "Sunday", hours: "10:00 AM – 4:00 PM" },
              ].map((row) => (
                <div key={row.day} className="flex justify-between">
                  <span className="text-gray-600">{row.day}</span>
                  <span className="font-semibold text-gray-800">{row.hours}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
