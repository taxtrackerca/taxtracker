// components/AddToHomeScreenModal.jsx
import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function AddToHomeScreenModal() {
  const [showIosBanner, setShowIosBanner] = useState(false);
  const [showIosModal, setShowIosModal] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    const hasInstalled = localStorage.getItem('pwa-installed');
    if (hasInstalled) return;

    const ua = window.navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(ua);
    const isInStandaloneMode = ('standalone' in window.navigator) && window.navigator.standalone;

    if (isIos && !isInStandaloneMode) {
      setShowIosBanner(true);
    } else if (/android/.test(ua)) {
      setIsAndroid(true);
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleAndroidInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      if (result.outcome === 'accepted') {
        localStorage.setItem('pwa-installed', 'true');
      }
      setDeferredPrompt(null);
    }
  };

  const handleCloseIosModal = () => {
    localStorage.setItem('pwa-installed', 'true');
    setShowIosModal(false);
    setShowIosBanner(false);
  };

  return (
    <>
      {showIosBanner && (
        <div className="bg-blue-100 text-blue-900 p-4 text-sm text-center shadow-md">
          
          <button
            onClick={() => setShowIosModal(true)}
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base sm:text-lg px-6 sm:px-8 py-3 rounded shadow-lg transition duration-200"
          >
            Add TaxTracker App to Home Screen
          </button>
        </div>
      )}

      {isAndroid && deferredPrompt && (
        <div className="fixed top-0 left-0 right-0 bg-blue-100 text-blue-900 p-4 text-sm text-center shadow-md z-50">          <strong>Install TaxTracker:</strong>
          <button
            onClick={handleAndroidInstall}
            className="ml-2 bg-blue-500 text-white px-3 py-1 rounded"
          >
            Add TaxTracker App to Home Screen
          </button>
        </div>
      )}

      {showIosModal && (
        <div className="fixed top-0 left-0 right-0 bg-blue-100 text-blue-900 p-4 text-sm text-center shadow-md z-50">          
            <button
              onClick={handleCloseIosModal}
              className="absolute top-2 right-3 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
            <h2 className="text-xl font-semibold mb-4 text-center">Add TaxTracker App to Your Home Screen</h2>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Tap the <strong>Share</strong> icon <span className="inline-block">📤</span> in Safari.</li>
              <li>Scroll down and tap <strong>“Add to Home Screen”</strong>.</li>
              <li>Tap <strong>Add</strong> in the top right corner.</li>
            </ol>
            <div className="mt-4">
              <Image
                src="/screenshots/ios-share.png"
                alt="Share Button in Safari"
                width={300}
                height={400}
                className="rounded-lg mx-auto"
              />
            </div>
          
        </div>
      )}
    </>
  );
}