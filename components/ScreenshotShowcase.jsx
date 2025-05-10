// components/ScreenshotShowcase.jsx
import Image from 'next/image';
import { useEffect, useState, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const screenshots = [
  {
    src: '/screenshots/year-to-date.png',
    alt: 'Year-to-Date Summary',
    caption: 'Quickly view your year-to-date income, expenses, and tax summary all in one place.'
  },
  {
    src: '/screenshots/tracking-overview.png',
    alt: 'Tracking Overview',
    caption: 'See your monthly progress with a detailed breakdown of income, expenses, and deductions.'
  },
  {
    src: '/screenshots/income.png',
    alt: 'Income Entry',
    caption: 'Easily enter your business and personal income with tax handling built-in.'
  },
  {
    src: '/screenshots/tooltip.png',
    alt: 'Helpful Tooltips',
    caption: 'Every field has a simple explanation to help you understand what to enter.'
  },
  {
    src: '/screenshots/business-expenses.png',
    alt: 'Business Expenses Entry',
    caption: 'Track your business expenses by category and watch your deductions add up.'
  },
  {
    src: '/screenshots/autosave.png',
    alt: 'Autosave in Action',
    caption: 'All changes are automatically saved — no more worrying about lost progress.'
  },
  {
    src: '/screenshots/motor-vehicle-expenses.png',
    alt: 'Motor Vehicle Expenses',
    caption: 'Input your vehicle expenses and business kilometers with smart calculations.'
  },
  {
    src: '/screenshots/month-summary.png',
    alt: 'Monthly Summary Panel',
    caption: 'Expand the monthly summary to see key figures for any selected month.'
  },
  {
    src: '/screenshots/account-settings.png',
    alt: 'Account Settings Page',
    caption: 'Manage your account details and subscription in one convenient place.'
  },
];

export default function ScreenshotShowcase() {
  const [index, setIndex] = useState(0);
  const current = screenshots[index];
  const containerRef = useRef(null);

  const next = () => setIndex((index + 1) % screenshots.length);
  const prev = () => setIndex((index - 1 + screenshots.length) % screenshots.length);

  useEffect(() => {
    const interval = setInterval(next, 5000);
    return () => clearInterval(interval);
  }, [index]);

  // Swipe handlers
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let startX = 0;
    let endX = 0;

    const onTouchStart = (e) => {
      startX = e.touches[0].clientX;
    };

    const onTouchMove = (e) => {
      endX = e.touches[0].clientX;
    };

    const onTouchEnd = () => {
      if (startX - endX > 50) next();
      if (endX - startX > 50) prev();
    };

    container.addEventListener('touchstart', onTouchStart);
    container.addEventListener('touchmove', onTouchMove);
    container.addEventListener('touchend', onTouchEnd);

    return () => {
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
    };
  }, [index]);

  return (
    <div className="py-12 bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-6">See What You'll Get</h2>

        <div
          ref={containerRef}
          className="relative rounded-xl overflow-hidden shadow-lg max-w-md mx-auto transition-all duration-500 ease-in-out"
        >
          <Image
            key={current.src}
            src={current.src}
            alt={current.alt}
            width={800}
            height={600}
            className="w-full h-auto object-contain transition-opacity duration-500 ease-in-out"
          />
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/70 rounded-full p-2 shadow hover:bg-white"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/70 rounded-full p-2 shadow hover:bg-white"
          >
            <ChevronRight className="w-5 h-5 text-gray-700" />
          </button>
        </div>

        <p className="mt-4 text-sm text-gray-600 max-w-lg mx-auto">{current.caption}</p>

        {/* Dots */}
        <div className="flex justify-center mt-4 gap-2">
          {screenshots.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`w-3 h-3 rounded-full ${i === index ? 'bg-blue-500' : 'bg-gray-300'} transition-all`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
