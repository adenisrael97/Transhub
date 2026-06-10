'use client';

import { useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, ArrowRight, MapPin } from 'lucide-react';

// Image file names are referenced EXACTLY as they exist in public/PopularRoutes.
// Each slide is a real, bookable route → links into /search with from/to prefilled.
const ROUTES = [
  { city: 'Lagos',        img: '/PopularRoutes/Lagos.jpg',             from: 'Lagos',        to: 'Abuja',        price: '₦12,500' },
  { city: 'Abuja',        img: '/PopularRoutes/Abuja Nigeria.jpg',     from: 'Abuja',        to: 'Kaduna',       price: '₦7,800'  },
  { city: 'Ibadan',       img: '/PopularRoutes/Ibadan.jpg',            from: 'Ibadan',       to: 'Lagos',        price: '₦4,500'  },
  { city: 'Kaduna',       img: '/PopularRoutes/kaduna.jpg',            from: 'Kaduna',       to: 'Kano',         price: '₦6,200'  },
  { city: 'Kano',         img: '/PopularRoutes/kano image.jpg',        from: 'Kano',         to: 'Abuja',        price: '₦9,400'  },
  { city: 'Port Harcourt', img: '/PopularRoutes/portarcut nigeria.jpeg', from: 'Port Harcourt', to: 'Lagos',     price: '₦13,900' },
];

export default function RoutesCarousel() {
  const trackRef = useRef(null);

  // Scroll by roughly one card; loops back to the start when the end is reached.
  const scrollByCard = useCallback((dir) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector('[data-slide]');
    const step = card ? card.offsetWidth + 20 : 320;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 8;
    if (dir > 0 && atEnd) {
      el.scrollTo({ left: 0, behavior: 'smooth' });
    } else {
      el.scrollBy({ left: step * dir, behavior: 'smooth' });
    }
  }, []);

  // Auto-advance; pauses while the user hovers the track.
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    let paused = false;
    const onEnter = () => { paused = true; };
    const onLeave = () => { paused = false; };
    el.addEventListener('mouseenter', onEnter);
    el.addEventListener('mouseleave', onLeave);
    const id = setInterval(() => { if (!paused) scrollByCard(1); }, 3500);
    return () => {
      clearInterval(id);
      el.removeEventListener('mouseenter', onEnter);
      el.removeEventListener('mouseleave', onLeave);
    };
  }, [scrollByCard]);

  return (
    <section className="bg-white py-24 px-4">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="mb-3 inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-bold uppercase tracking-widest text-[#1D4ED8]">
              Top Destinations
            </span>
            <h2 className="text-4xl font-extrabold text-[#0A1B3D] md:text-5xl">Popular routes</h2>
            <p className="mt-3 max-w-md text-[#64748B]">
              The journeys Nigerians book most — tap any route to see live trips and prices.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => scrollByCard(-1)}
              aria-label="Previous routes"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-[#E2E8F0] bg-white text-[#0A1B3D] transition-colors hover:bg-[#F8FAFC]"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={() => scrollByCard(1)}
              aria-label="Next routes"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[#1D4ED8] text-white transition-colors hover:bg-[#1E40AF]"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div
          ref={trackRef}
          className="th-no-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-2"
        >
          {ROUTES.map((r) => (
            <Link
              key={`${r.from}-${r.to}`}
              data-slide
              href={`/search?from=${encodeURIComponent(r.from)}&to=${encodeURIComponent(r.to)}`}
              className="group relative w-[78%] shrink-0 snap-start overflow-hidden rounded-3xl sm:w-[46%] lg:w-[31%]"
            >
              <div className="relative h-72 w-full">
                <Image
                  src={r.img}
                  alt={`${r.from} to ${r.to}`}
                  fill
                  sizes="(max-width: 640px) 78vw, (max-width: 1024px) 46vw, 31vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A1B3D] via-[#0A1B3D]/30 to-transparent" />
              </div>
              <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium backdrop-blur">
                  <MapPin size={12} /> {r.city}
                </span>
                <h3 className="mt-3 text-xl font-bold">
                  {r.from} <span className="text-blue-200">→</span> {r.to}
                </h3>
                <div className="mt-1 flex items-center justify-between">
                  <p className="text-sm text-blue-100">from <span className="font-bold text-white">{r.price}</span></p>
                  <span className="flex items-center gap-1 text-sm font-semibold text-white opacity-0 transition-all duration-300 group-hover:opacity-100">
                    Book <ArrowRight size={15} />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
