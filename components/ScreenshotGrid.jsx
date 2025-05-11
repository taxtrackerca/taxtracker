// Replace this section in pages/index.js
import { useState } from 'react';
import Image from 'next/image';

const images = [
  { src: '/screenshots/action1.png', alt: 'Action 1' },
  { src: '/screenshots/action2.png', alt: 'Action 2' },
  { src: '/screenshots/action3.png', alt: 'Action 3' },
  { src: '/screenshots/action4.png', alt: 'Action 4' },
];

export default function ScreenshotGrid() {
  const [modalImg, setModalImg] = useState(null);

  return (
    <section className="px-6 py-12 text-center bg-white">
      <h2 className="text-3xl font-extrabold text-gray-900 mb-4">See TaxTracker in Action</h2>
      <p className="text-gray-600 max-w-xl mx-auto mb-10">
        Click to view these examples of how easy it is to track your business info in TaxTracker.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {images.map((img, i) => (
          <div
            key={i}
            className="cursor-pointer overflow-hidden rounded-xl shadow hover:shadow-lg transition duration-200"
            onClick={() => setModalImg(img)}
          >
            <img
              src={img.src}
              alt={img.alt}
              className="w-full h-auto object-cover rounded-xl"
            />
          </div>
        ))}
      </div>

      {/* Modal */}
      {modalImg && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
          onClick={() => setModalImg(null)}
        >
          <img src={modalImg.src} alt={modalImg.alt} className="max-w-full max-h-[90vh] rounded-lg shadow-lg" />
        </div>
      )}
    </section>
  );
}
