import React, { useState } from 'react';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, A11y } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const images = [
  {
    src: '/screenshots/year-to-date.png',
    alt: 'Year-to-Date Summary',
    description: 'See your total income, expenses, and estimated tax owed year-to-date.'
  },
  {
    src: '/screenshots/tracking-overview.png',
    alt: 'Tracking Overview',
    description: 'Quick overview of your monthly data entry progress.'
  },
  {
    src: '/screenshots/income.png',
    alt: 'Income Section',
    description: 'Log business income and other personal income, including tax status.'
  },
  {
    src: '/screenshots/tooltip.png',
    alt: 'Helpful Tooltips',
    description: 'Hover over tooltips for clear explanations of each field.'
  },
  {
    src: '/screenshots/business-expenses.png',
    alt: 'Business Expenses',
    description: 'Track deductible expenses easily by category.'
  },
  {
    src: '/screenshots/autosave.png',
    alt: 'Autosave in Action',
    description: 'Never lose your work — entries are saved automatically.'
  },
  {
    src: '/screenshots/motor-vehicle-expenses.png',
    alt: 'Motor Vehicle Expenses',
    description: 'Log business-related vehicle costs and mileage accurately.'
  },
  {
    src: '/screenshots/month-summary.png',
    alt: 'Monthly Summary',
    description: 'Review total income, expenses, and estimated tax for any month.'
  },
  {
    src: '/screenshots/account-settings.png',
    alt: 'Account Settings',
    description: 'Update business details and manage your subscription easily.'
  }
];

export default function ScreenshotShowcase() {
  return (
    <div className="bg-white py-12 px-4 text-center">
      <h2 className="text-3xl font-extrabold text-gray-900 mb-6">Explore TaxTracker</h2>
      <p className="text-gray-600 max-w-2xl mx-auto mb-8">
        Take a closer look at what makes TaxTracker so powerful. Swipe through the screenshots below.
      </p>

      <div className="max-w-xl mx-auto">
        <Swiper
          modules={[Navigation, Pagination, A11y]}
          spaceBetween={20}
          slidesPerView={1}
          navigation
          pagination={{ clickable: true }}
        >
          {images.map((img, i) => (
            <SwiperSlide key={i}>
              <div className="w-1/2 rounded-xl shadow overflow-hidden bg-white">
                <Image
                  src={img.src}
                  alt={img.alt}
                  width={1000}
                  height={600}
                  layout="responsive"
                  objectFit="contain"
                  className="rounded-t-xl"
                />
                <div className="p-4 text-sm text-gray-700">
                  <p className="font-semibold mb-1">{img.alt}</p>
                  <p>{img.description}</p>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
}
