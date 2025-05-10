import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, A11y, EffectFade } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';

const screenshots = [
  {
    src: 'year-to-date.png',
    alt: 'Year-to-date Summary',
    caption: 'Track your tax estimate with a live YTD summary.',
  },
  {
    src: 'tracking-overview.png',
    alt: 'Tracking Overview',
    caption: 'Stay organized with a clear overview of your business activity.',
  },
  {
    src: 'income.png',
    alt: 'Income Entry',
    caption: 'Easily enter business and personal income.',
  },
  {
    src: 'tooltip.png',
    alt: 'Helpful Tooltips',
    caption: 'Understand every field with simple explanations.',
  },
  {
    src: 'business-expenses.png',
    alt: 'Business Expenses',
    caption: 'Claim deductions with categorized expense tracking.',
  },
  {
    src: 'autosave.png',
    alt: 'Autosave Feature',
    caption: 'Never lose work — every change is autosaved.',
  },
  {
    src: 'motor-vehicle-expenses.png',
    alt: 'Motor Vehicle Expenses',
    caption: 'Track fuel, repairs, and kilometers for CRA claims.',
  },
  {
    src: 'month-summary.png',
    alt: 'Month Summary',
    caption: 'Each month shows a breakdown of tax impact.',
  },
  {
    src: 'account-settings.png',
    alt: 'Account Settings',
    caption: 'Manage billing and subscriptions in one place.',
  },
];

export default function ScreenshotShowcase() {
  return (
    <div className="relative max-w-3xl mx-auto">
      <Swiper
        modules={[Navigation, Pagination, A11y, EffectFade]}
        effect="fade"
        fadeEffect={{ crossFade: true }}
        pagination={{ clickable: true }}
        navigation
        speed={500}
        spaceBetween={30}
        slidesPerView={1}
        className="rounded-xl shadow-lg"
      >
        {screenshots.map((image, index) => (
          <SwiperSlide key={index}>
            <div className="w-full max-w-md mx-auto">
              <img
                src={`/screenshots/${image.src}`}
                alt={image.alt}
                className="w-full h-auto rounded-xl border shadow-md"
              />
              <p className="mt-4 text-sm text-gray-600 text-center">{image.caption}</p>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}