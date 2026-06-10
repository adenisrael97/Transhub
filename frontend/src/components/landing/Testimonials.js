'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Star, Quote } from 'lucide-react';

const TESTIMONIALS = [
  { name: 'Chukwuemeka O.', location: 'Lagos → Abuja',        color: 'bg-[#1D4ED8]', text: 'TransHub made my trip seamless. I booked my seat at midnight and got my ticket instantly. The driver even called ahead!' },
  { name: 'Fatima A.',      location: 'Kano → Port Harcourt', color: 'bg-[#16A34A]', text: 'Sent goods to my sister in PH. The waybill tracking was spot on — I knew exactly where my package was at every step.' },
  { name: 'Tunde B.',       location: 'Corporate Charter',    color: 'bg-[#D97706]', text: 'We chartered a 33-seater for our company retreat. TransHub handled everything professionally. Will use again!' },
  { name: 'Ngozi E.',       location: 'Enugu → Lagos',        color: 'bg-[#0A1B3D]', text: 'The e-ticket and live tracking gave me real peace of mind. No more queueing at the park for hours — I just booked from home.' },
  { name: 'Ibrahim S.',     location: 'Kaduna → Kano',        color: 'bg-[#0EA5E9]', text: 'Payment was instant and secure. I got my refund within minutes when my trip was rescheduled. Genuinely impressed.' },
  { name: 'Blessing A.',    location: 'Ibadan → Benin City',  color: 'bg-[#1D4ED8]', text: 'Best travel app in Nigeria right now. Clean interface, fair prices, and the support team actually responds. Five stars.' },
];

export default function Testimonials() {
  const [index, setIndex] = useState(0);
  const [perView, setPerView] = useState(1);
  const pausedRef = useRef(false);

  // Responsive items-per-view: 1 (mobile) / 2 (tablet) / 3 (desktop).
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      setPerView(w >= 1024 ? 3 : w >= 640 ? 2 : 1);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const pages = Math.max(1, TESTIMONIALS.length - perView + 1);
  // Clamp during render rather than in an effect: when perView grows, `pages`
  // shrinks and a stale high index would otherwise scroll past the last card.
  const safeIndex = Math.min(index, pages - 1);

  const next = useCallback(() => setIndex((i) => (i + 1) % pages), [pages]);

  useEffect(() => {
    const id = setInterval(() => { if (!pausedRef.current) next(); }, 4000);
    return () => clearInterval(id);
  }, [next]);

  return (
    <section className="bg-[#F8FAFC] py-24 px-4">
      <div className="mx-auto max-w-6xl">
        <div className="mb-14 text-center">
          <span className="mb-3 inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-bold uppercase tracking-widest text-[#1D4ED8]">
            Testimonials
          </span>
          <h2 className="text-4xl font-extrabold text-[#0A1B3D] md:text-5xl">Loved by travellers</h2>
        </div>

        <div
          className="overflow-hidden"
          onMouseEnter={() => { pausedRef.current = true; }}
          onMouseLeave={() => { pausedRef.current = false; }}
        >
          <div
            className="flex transition-transform duration-700 ease-out"
            style={{ transform: `translateX(-${safeIndex * (100 / perView)}%)` }}
          >
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                className="shrink-0 px-3"
                style={{ width: `${100 / perView}%` }}
              >
                <figure className="flex h-full flex-col rounded-3xl border border-[#E2E8F0] bg-white p-8 shadow-sm">
                  <Quote size={28} className="mb-4 text-[#BFDBFE]" />
                  <div className="mb-4 flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={15} className="fill-[#F59E0B] text-[#F59E0B]" />
                    ))}
                  </div>
                  <blockquote className="mb-6 flex-1 text-sm italic leading-relaxed text-[#475569]">
                    &ldquo;{t.text}&rdquo;
                  </blockquote>
                  <figcaption className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white ${t.color}`}>
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#0A1B3D]">{t.name}</p>
                      <p className="text-xs text-[#94A3B8]">{t.location}</p>
                    </div>
                  </figcaption>
                </figure>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex justify-center gap-2">
          {[...Array(pages)].map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Go to testimonial group ${i + 1}`}
              className={`h-2 rounded-full transition-all ${
                i === safeIndex ? 'w-7 bg-[#1D4ED8]' : 'w-2 bg-[#CBD5E1] hover:bg-[#94A3B8]'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
