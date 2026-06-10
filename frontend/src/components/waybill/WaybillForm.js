'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, User, Package, ArrowRight, CheckCircle2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input, { Select } from '@/components/ui/Input';
import useToastStore from '@/store/toastStore';
import useAuthStore from '@/store/authStore';
import { getErrorMessage } from '@/lib/utils';
import { createWaybill } from '@/services/waybills';
import { CITIES } from '@/lib/constants';
import Link from 'next/link';

const STEPS = [
  { num: 1, icon: MapPin, label: 'Route' },
  { num: 2, icon: User,    label: 'Contacts' },
  { num: 3, icon: Package, label: 'Package' },
];

export default function WaybillForm() {
  const router  = useRouter();
  const toast   = useToastStore();
  const user    = useAuthStore((s) => s.user);
  const [loading,  setLoading]  = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [waybillNo, setWaybillNo] = useState('');
  const [form, setForm] = useState({
    fromLocation: '', toLocation: '',
    senderName: '', senderPhone: '',
    recipientName: '', recipientPhone: '',
    description: '', weightKg: '', declaredValue: '',
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const field = (k) => ({ value: form[k], onChange: (e) => set(k, e.target.value) });

  async function handleSubmit(e) {
    e.preventDefault();
    if (!user) {
      router.push('/auth/login?redirect=/send');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        fromLocation:   form.fromLocation,
        toLocation:     form.toLocation,
        senderName:     form.senderName,
        senderPhone:    form.senderPhone,
        recipientName:  form.recipientName,
        recipientPhone: form.recipientPhone,
        description:    form.description,
        ...(form.weightKg     && { weightKg:     parseFloat(form.weightKg) }),
        ...(form.declaredValue && { declaredValue: parseFloat(form.declaredValue) }),
      };
      const result = await createWaybill(payload);
      setWaybillNo(result.waybillNo);
      setSubmitted(true);
      toast.success('Waybill request submitted! Admin will review and send a quote.');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to create waybill. Please try again.'));
    } finally {
      setLoading(false);
    }
  }

  // ── Success state ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-6 py-4 text-center">
        <div className="w-16 h-16 bg-[#DCFCE7] rounded-full flex items-center justify-center">
          <CheckCircle2 size={32} className="text-[#16A34A]" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[#0F172A] mb-1">Request Submitted!</h2>
          <p className="text-sm text-[#475569] mb-4">
            Your waybill number is{' '}
            <span className="font-mono font-bold text-[#0F172A]">{waybillNo}</span>.
            An admin will review your request and send you a quote shortly.
          </p>
          <p className="text-xs text-[#94A3B8]">
            You can track the status of your shipment in{' '}
            <Link href="/my-shipments" className="text-[#2563EB] font-semibold hover:underline">
              My Shipments
            </Link>
            .
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Button as={Link} href="/my-shipments" variant="primary" fullWidth>
            View My Shipments
          </Button>
          <Button variant="secondary" fullWidth onClick={() => { setSubmitted(false); setForm({ fromLocation: '', toLocation: '', senderName: '', senderPhone: '', recipientName: '', recipientPhone: '', description: '', weightKg: '', declaredValue: '' }); }}>
            Send Another
          </Button>
        </div>
      </div>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="space-y-0">
      {STEPS.map(({ num, icon: Icon, label }, idx) => (
        <div key={num} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-[#EFF6FF] border-2 border-[#2563EB] flex items-center justify-center shrink-0">
              <Icon size={14} className="text-[#2563EB]" />
            </div>
            {idx < STEPS.length - 1 && (
              <div className="w-px flex-1 bg-[#E2E8F0] my-2" />
            )}
          </div>

          <div className={`flex-1 ${idx < STEPS.length - 1 ? 'pb-6' : 'pb-0'}`}>
            <p className="text-sm font-semibold text-[#0F172A] mb-3 leading-none pt-1">{label}</p>

            {num === 1 && (
              <div className="grid sm:grid-cols-2 gap-4">
                <Select label="Sending From" required {...field('fromLocation')}>
                  <option value="">Select city</option>
                  {CITIES.map((c) => <option key={c}>{c}</option>)}
                </Select>
                <Select label="Sending To" required {...field('toLocation')}>
                  <option value="">Select city</option>
                  {CITIES.map((c) => <option key={c}>{c}</option>)}
                </Select>
              </div>
            )}

            {num === 2 && (
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <Input label="Sender Name" placeholder="John Doe" required {...field('senderName')} />
                  <Input label="Sender Phone" type="tel" placeholder="08012345678" required {...field('senderPhone')} />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Input label="Recipient Name" placeholder="Jane Smith" required {...field('recipientName')} />
                  <Input label="Recipient Phone" type="tel" placeholder="08087654321" required {...field('recipientPhone')} />
                </div>
              </div>
            )}

            {num === 3 && (
              <div className="grid sm:grid-cols-2 gap-4">
                <Input label="Description" placeholder="e.g. Electronics, Clothing" required {...field('description')} />
                <Input label="Weight (kg)" type="number" min="0.1" max="1000" step="0.1" placeholder="2.5" {...field('weightKg')} />
                <Input label="Declared Value (₦)" type="number" min="0" placeholder="50000" {...field('declaredValue')} />
              </div>
            )}
          </div>
        </div>
      ))}

      <div className="pt-6 space-y-2">
        <Button
          type="submit"
          loading={loading}
          variant="success"
          fullWidth
          rightIcon={<ArrowRight size={16} />}
        >
          Submit Waybill Request
        </Button>
        <p className="text-xs text-center text-[#94A3B8]">
          Admin will review your request and send a shipping quote before payment.
        </p>
      </div>
    </form>
  );
}
