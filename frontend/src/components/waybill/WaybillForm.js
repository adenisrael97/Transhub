'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Input, { Select } from '@/components/ui/Input';
import useToastStore from '@/store/toastStore';
import { createWaybill } from '@/services/waybills';
import { CITIES } from '@/lib/constants';

export default function WaybillForm() {
  const router = useRouter();
  const toast = useToastStore();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    from: '', to: '', senderName: '', senderPhone: '',
    receiverName: '', receiverPhone: '', description: '',
    weight: '', value: '',
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const field = (k) => ({ value: form[k], onChange: (e) => set(k, e.target.value) });

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await createWaybill(form);
      router.push(`/track/${data.waybillNo}`);
    } catch {
      if (process.env.NODE_ENV === 'development') {
        toast.info("Waybill created (dev mock)");
        router.push(`/track/TH-${Date.now().toString().slice(-6)}`);
      } else {
        toast.error("Failed to create waybill. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Route */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Select label="Sending From" required {...field('from')}>
          <option value="">Select city</option>
          {CITIES.map((c) => <option key={c}>{c}</option>)}
        </Select>
        <Select label="Sending To" required {...field('to')}>
          <option value="">Select city</option>
          {CITIES.map((c) => <option key={c}>{c}</option>)}
        </Select>
      </div>

      {/* Sender */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-3">Sender Details</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Full Name" placeholder="John Doe" required {...field('senderName')} />
          <Input label="Phone Number" type="tel" placeholder="08012345678" required {...field('senderPhone')} />
        </div>
      </div>

      {/* Receiver */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-3">Receiver Details</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Full Name" placeholder="Jane Smith" required {...field('receiverName')} />
          <Input label="Phone Number" type="tel" placeholder="08087654321" required {...field('receiverPhone')} />
        </div>
      </div>

      {/* Package */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-3">Package Details</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Description" placeholder="e.g. Electronics, Clothing" required {...field('description')} />
          <Input label="Weight (kg)" type="number" min="0.1" step="0.1" placeholder="2.5" {...field('weight')} />
          <Input label="Declared Value (₦)" type="number" min="0" placeholder="50000" {...field('value')} />
        </div>
      </div>

      <Button type="submit" loading={loading} variant="success" fullWidth>
        Create Waybill &amp; Get Tracking Number
      </Button>
    </form>
  );
}
