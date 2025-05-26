// components/Layout.jsx
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { auth } from '../lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
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
    await signOut(auth);
  };

  // 3. Popup submit
  const handleSubmit = async (email) => {
    try {
      await fetch('/api/subscribe', {
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
                  <Link href="/dashboard" className="text-gray-800 hover:text-blue-600">Dashboard</Link>
                  <Link href="/account" className="text-gray-800 hover:text-blue-600">Account</Link>
                  <button onClick={handleLogout} className="text-gray-800 hover:text-blue-600">Logout</button>
                </>
              ) : (
                <>
                  <Link href="#referral" className="text-gray-800 hover:text-blue-600">Referral Program</Link>
                  <Link href="#faq" className="text-gray-800 hover:text-blue-600">FAQ</Link>
                  <Link href="#pricing" className="text-gray-800 hover:text-blue-600">Pricing</Link>
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
                    <Link href="/dashboard" className="block py-1 text-lg text-gray-800 hover:text-blue-600">Dashboard</Link>
                    <Link href="/account" className="block py-1 text-lg text-gray-800 hover:text-blue-600">Account</Link>
                    <button onClick={handleLogout} className="block py-1 text-lg text-gray-800 hover:text-blue-600">Logout</button>
                  </>
                ) : (
                  <>
                    <Link href="#referral" className="block py-1 text-lg text-gray-800 hover:text-blue-600">Referral Program</Link>
                    <Link href="#faq" className="block py-1 text-lg text-gray-800 hover:text-blue-600">FAQ</Link>
                    <Link href="#pricing" className="block py-1 text-lg text-gray-800 hover:text-blue-600">Pricing</Link>
                    <Link href="/signup" className="block py-1 text-lg text-gray-800 hover:text-blue-600">Sign Up</Link>
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
    </div>
  );
}