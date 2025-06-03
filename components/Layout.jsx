// components/Layout.jsx
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { auth } from '../lib/firebase';
import { onAuthStateChanged, signOut, setPersistence, browserSessionPersistence } from 'firebase/auth';
import { useRouter } from 'next/router';
import ExitIntentPopup from './ExitIntentPopup';
import ToastNotification from './ToastNotification'; // Create this component

export default function Layout({ children }) {
  const router = useRouter();
  const hideNavRoutes = ['/verify-email'];
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showIosModal, setShowIosModal] = useState(false);

  // 1. Check if user is logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);

      const popupShown = sessionStorage.getItem('exitPopupShown');
      const alreadySubscribed = localStorage.getItem('newsletterSubscribed');
      const alreadyDismissed = localStorage.getItem('newsletterDismissed');

      if (u || popupShown || alreadySubscribed || alreadyDismissed) return;

      const isMobile =
        /Mobi|Android/i.test(navigator.userAgent) || window.innerWidth < 768;

      // Desktop: exit intent
      const handleMouseLeave = (e) => {
        if (!isMobile && e.clientY <= 0) {
          setShowPopup(true);
          sessionStorage.setItem('exitPopupShown', 'true');
          window.removeEventListener('mouseout', handleMouseLeave);
        }
      };

      // Mobile: 20s timer
      const mobileTimeout = isMobile
        ? setTimeout(() => {
          setShowPopup(true);
          sessionStorage.setItem('exitPopupShown', 'true');
        }, 20000)
        : null;

      if (!isMobile) {
        window.addEventListener('mouseout', handleMouseLeave);
      }

      return () => {
        if (!isMobile) window.removeEventListener('mouseout', handleMouseLeave);
        if (mobileTimeout) clearTimeout(mobileTimeout);
      };
    });

    return unsubscribe;
  }, []);

  // 2. Logout
  const handleLogout = async () => {
    try {
      localStorage.setItem('autoLoginAllowed', 'false'); // prevent future auto-login
      await setPersistence(auth, browserSessionPersistence); // override long-term persistence
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // 3. Popup submit
  const handleSubmit = async (email) => {
    try {
      await fetch('/api/add-subscriber', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      localStorage.setItem('newsletterSubscribed', 'true');
      setShowPopup(false);
      setShowToast(true);
    } catch (error) {
      alert('There was a problem. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-background text-text flex flex-col font-sans">
      {/* Header */}
      {!hideNavRoutes.includes(router.pathname) && (
        <header className="bg-white shadow fixed w-full z-50 top-0">
          <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
            <Link href="/" className="flex items-center space-x-2">
              <img src="/logo.png" alt="TaxTracker Logo" className="h-8 w-auto" />
              <span className="text-2xl font-bold text-black tracking-tight">TaxTracker</span>
            </Link>

            <nav className="hidden md:flex space-x-6 text-sm">
              {user ? (
                <>
                  <Link href="/getting-started" className="text-gray-800 hover:text-blue-600">Getting Started</Link>
                  <Link href="/dashboard" className="text-gray-800 hover:text-blue-600">Dashboard</Link>
                  <Link href="/account" className="text-gray-800 hover:text-blue-600">Account</Link>
                  <button onClick={handleLogout} className="text-gray-800 hover:text-blue-600">Logout</button>
                </>
              ) : (
                <>
                  <Link href="/getting-started" className="text-gray-800 hover:text-blue-600">Getting Started</Link>
                  <Link
                    href={{
                      pathname: '/',
                      query: { scrollTo: 'referral' }
                    }}
                    scroll={false}
                    className="text-gray-800 hover:text-blue-600"
                  >
                    Referral Program
                  </Link>

                  <Link
                    href={{
                      pathname: '/',
                      query: { scrollTo: 'faq' }
                    }}
                    scroll={false}
                    className="text-gray-800 hover:text-blue-600"
                  >
                    FAQ
                  </Link>

                  <Link
                    href={{
                      pathname: '/',
                      query: { scrollTo: 'pricing' }
                    }}
                    scroll={false}
                    className="text-gray-800 hover:text-blue-600"
                  >
                    Pricing
                  </Link>
                  <Link href="/signup" className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700">Sign Up</Link>
                </>
              )}
            </nav>

            <div className="flex items-center space-x-4">
              {!user && (
                <Link href="/login" className="text-blue-600 hover:text-blue-800 text-sm font-medium">Login</Link>
              )}
              <button
                className="md:hidden text-gray-700"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Toggle Menu"
              >
                {menuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>

            {/* Mobile nav */}
            {menuOpen && (
              <nav className="md:hidden absolute top-full bg-white border round shadow-lg w-fit px-4 pb-4 z-50 space-y-2 text-sm border-t">
                {user ? (
                  <>
                    <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="block py-1 text-lg text-gray-800 hover:text-blue-600">Dashboard</Link>
                    <Link href="/account" onClick={() => setMenuOpen(false)} className="block py-1 text-lg text-gray-800 hover:text-blue-600">Account</Link>
                    <button onClick={() => { setShowIosModal(true); setMenuOpen(false); }} className="block py-1 text-lg text-gray-800 hover:text-blue-600">App</button>
                    <Link href="/getting-started" onClick={() => setMenuOpen(false)} className="block py-1 text-lg text-gray-800 hover:text-blue-600">Getting Started</Link>
                    <button onClick={handleLogout} className="block py-1 text-lg text-gray-800 hover:text-blue-600">Logout</button>

                  </>
                ) : (
                  <>
                    <Link href="#referral" onClick={() => setMenuOpen(false)} className="block py-1 text-lg text-gray-800 hover:text-blue-600">Referral Program</Link>
                    <Link href="#faq" onClick={() => setMenuOpen(false)} className="block py-1 text-lg text-gray-800 hover:text-blue-600">FAQ</Link>
                    <Link href="#pricing" onClick={() => setMenuOpen(false)} className="block py-1 text-lg text-gray-800 hover:text-blue-600">Pricing</Link>
                    <Link href="/signup" onClick={() => setMenuOpen(false)} className="block py-1 text-lg text-gray-800 hover:text-blue-600">Sign Up</Link>
                    <Link href="/getting-started" onClick={() => setMenuOpen(false)} className="block py-1 text-lg text-gray-800 hover:text-blue-600">Getting Started</Link>
                    <button onClick={() => { setShowIosModal(true); setMenuOpen(false); }} className="block py-1 text-lg text-gray-800 hover:text-blue-600">App</button>

                  </>
                )}
              </nav>
            )}
          </div>
        </header>
      )}

      <div className="h-20" />

      <main className="flex-grow max-w-6xl mx-auto p-4">
        {children}
      </main>

      <footer className="bg-gray-100 text-center p-4 text-sm text-gray-600">
        © {new Date().getFullYear()} TaxTracker.ca —
        <Link href="/privacy" className="underline mx-1">Privacy</Link> |
        <Link href="/terms" className="underline mx-1">Terms</Link>
      </footer>

      {/* Exit Intent Popup */}
      {!user && (
        <ExitIntentPopup
          show={showPopup}
          onClose={(closed) => setShowPopup(!closed)}
          onSubmit={handleSubmit}
        />
      )}

      {/* Toast Confirmation */}
      {showToast && (
        <ToastNotification
          message="🎉 You're subscribed to weekly tax tips!"
          onClose={() => setShowToast(false)}
        />
      )}
      {showIosModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl max-w-md w-full shadow-lg relative">
            <button
              onClick={() => setShowIosModal(false)}
              className="absolute top-2 right-3 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
            <h2 className="text-xl font-semibold mb-4 text-center">Add TaxTracker to Your Home Screen</h2>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Tap the <strong>Share</strong> icon 📤 in Safari.</li>
              <li>Scroll down and tap <strong>“Add to Home Screen”</strong>.</li>
              <li>Tap <strong>Add</strong> in the top right corner.</li>
            </ol>
            <div className="mt-4">
              <img
                src="/screenshots/ios-share.png"
                alt="Share Button in Safari"
                className="rounded-lg mx-auto"
                width={300}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}