import React, { useState } from 'react';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import Captions from 'yet-another-react-lightbox/plugins/captions';
import 'yet-another-react-lightbox/styles.css';
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails';
import 'yet-another-react-lightbox/plugins/captions.css';
import 'yet-another-react-lightbox/plugins/fullscreen.css';
import 'yet-another-react-lightbox/plugins/thumbnails.css';
import 'yet-another-react-lightbox/plugins/zoom.css';

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

export default function ScreenshotLightbox() {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  return (
    <div className="bg-white py-12 px-4 text-center">
      <h2 className="text-3xl font-extrabold text-gray-900 mb-6">Explore TaxTracker</h2>
      <p className="text-gray-600 max-w-2xl mx-auto mb-8">
        Take a closer look at what makes TaxTracker so powerful. Click any screenshot to zoom in.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-5xl mx-auto">
        {images.map((img, i) => (
          <div
            key={i}
            className="cursor-pointer overflow-hidden rounded-xl shadow hover:shadow-lg transition duration-200"
            onClick={() => { setIndex(i); setOpen(true); }}
          >
            <img
              src={img.src}
              alt={img.alt}
              className="w-full h-auto object-cover"
            />
          </div>
        ))}
      </div>

      {open && (
        <Lightbox
          open={open}
          close={() => setOpen(false)}
          slides={images.map(({ src, alt, description }) => ({ src, alt, description }))}
          index={index}
          plugins={[Captions, Fullscreen, Thumbnails, Zoom]}
          captions={{ descriptionTextAlign: 'center' }}
          thumbnails={{ position: 'bottom', width: 100, height: 60 }}
          zoom={{ maxZoomPixelRatio: 2 }}
          styles={{
            container: { backgroundColor: 'rgba(0, 0, 0, 0.95)' },
            navigationPrev: { color: '#fff' },
            navigationNext: { color: '#fff' }
          }}
        />
      )}
    </div>
  );
}
