"use client";
import { useState } from "react";
import { Phone, Mail, MapPin, Clock, CheckCircle2 } from "lucide-react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import api from "@/lib/api";

const CONTACT_INFO = [
  { Icon: Phone, label: "Phone",   value: "+234 800 000 0000",           color: "#2563EB" },
  { Icon: Mail,  label: "Email",   value: "support@transhub.ng",         color: "#16A34A" },
  { Icon: MapPin, label: "Address", value: "123 Transport Lane, Lagos, Nigeria", color: "#D97706" },
];

const HOURS = [
  { day: "Monday – Friday", hours: "8:00 AM – 8:00 PM" },
  { day: "Saturday",        hours: "9:00 AM – 5:00 PM"  },
  { day: "Sunday",          hours: "10:00 AM – 4:00 PM" },
];

const EMPTY_FORM = { name: "", email: "", subject: "", message: "" };

export default function ContactPage() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.post("/contact", formData);
      setSuccess(true);
      setFormData(EMPTY_FORM);
    } catch (err) {
      if (err?.status === 429) {
        setError("Too many messages, please wait before sending another.");
      } else {
        setError("Failed to send message. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="bg-linear-to-r from-[#1E40AF] to-[#2563EB] py-14 px-4 text-center">
        <h1 className="text-2xl font-bold text-white mb-2">Contact Us</h1>
        <p className="text-sm text-white/75">Have a question or need help? We&apos;re here for you.</p>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Contact form */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6">
            {success ? (
              <div className="flex flex-col items-center justify-center h-full py-8 text-center gap-4">
                <div className="w-14 h-14 bg-[#F0FDF4] rounded-2xl flex items-center justify-center">
                  <CheckCircle2 size={28} className="text-[#16A34A]" />
                </div>
                <h2 className="font-bold text-[#0F172A] text-lg">Message Sent!</h2>
                <p className="text-sm text-[#64748B]">We&apos;ve received your message and will get back to you shortly.</p>
                <button
                  onClick={() => setSuccess(false)}
                  className="text-sm text-[#2563EB] font-semibold hover:underline mt-2"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <>
                <h2 className="font-bold text-[#0F172A] text-lg mb-5">Send us a message</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input label="Your Name" name="name" value={formData.name} onChange={handleChange} placeholder="John Doe" required />
                  <Input label="Email Address" type="email" name="email" value={formData.email} onChange={handleChange} placeholder="you@example.com" required />
                  <Input label="Subject" name="subject" value={formData.subject} onChange={handleChange} placeholder="How can we help?" required />
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-[#0F172A]">
                      Message <span className="text-red-500 ml-0.5">*</span>
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows={4}
                      placeholder="Tell us more…"
                      className="w-full rounded-xl border border-[#E2E8F0] px-3.5 py-2.5 text-sm text-[#0F172A] outline-none placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition-all"
                      required
                    />
                  </div>
                  {error && (
                    <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
                      {error}
                    </p>
                  )}
                  <Button type="submit" loading={loading} fullWidth>Send Message</Button>
                </form>
              </>
            )}
          </div>

          {/* Contact info & hours */}
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6">
              <h2 className="font-bold text-[#0F172A] text-lg mb-5">Contact Information</h2>
              <div className="space-y-4">
                {CONTACT_INFO.map(({ Icon, label, value, color }) => (
                  <div key={label} className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}15` }}>
                      <Icon size={17} style={{ color }} />
                    </div>
                    <div>
                      <p className="text-xs text-[#94A3B8]">{label}</p>
                      <p className="text-sm font-semibold text-[#0F172A]">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6">
              <div className="flex items-center gap-2 mb-5">
                <Clock size={17} className="text-[#2563EB]" />
                <h2 className="font-bold text-[#0F172A] text-lg">Office Hours</h2>
              </div>
              <div className="space-y-2.5 text-sm">
                {HOURS.map(({ day, hours }) => (
                  <div key={day} className="flex justify-between">
                    <span className="text-[#64748B]">{day}</span>
                    <span className="font-semibold text-[#0F172A]">{hours}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
