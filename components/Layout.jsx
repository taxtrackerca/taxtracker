// components/Layout.jsx
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { auth } from '../lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

export default function Layout({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    return onAuthStateChanged(auth, setUser);
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <div className="min-h-screen bg-background text-text flex flex-col font-sans hover:no-underline">
      {/* Header */}
      <header className="bg-white shadow fixed w-full z-50 top-0 hover:text-blue-600 hover:no-underline ">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center hover:no-underline">
          <Link href="/" className="flex items-center space-x-2 hover:text-blue-600 hover:no-underline">
            <img src="/logo.png" alt="TaxTracker Logo" className="h-8 w-auto" />
            <span className="text-2xl font-bold text-black font-poppins tracking-tight text-primary">TaxTracker</span>
          </Link>



          {/* Desktop Nav */}
          <nav className="hidden md:flex space-x-6 text-sm">
            {user ? (
              <>
                <Link href="/dashboard" className="block py-1 text-md font-medium text-gray-800 hover:text-blue-600 hover:no-underline">Dashboard</Link>
                <Link href="/account" className="block py-1 text-md font-medium text-gray-800 hover:text-blue-600 hover:no-underline">Account</Link>
                <button onClick={handleLogout} className="block text-md font-medium text-gray-800 hover:text-blue-600 hover:no-underline">Logout</button>
              </>
            ) : (
              <>
                <Link href="#referral" className="block text-md font-medium text-gray-800 hover:text-blue-600 hover:no-underline">Referral Program</Link>
                <Link href="#faq" className="block text-md font-medium text-gray-800 hover:text-blue-600 hover:no-underline">FAQ</Link>
                <Link href="#pricing" className="block text-md font-medium text-gray-800 hover:text-blue-600 hover:no-underline">Pricing</Link>
                
                <Link href="/signup" className="bg-blue-600 text-md font-medium text-white px-4 rounded hover:bg-blue-700 hover:no-underline">Sign Up</Link>
              </>
            )}
          </nav>

          {/* Right side: Login and Menu */}
           <div className="flex items-center space-x-4">
            {/* Login link - always visible */}
            {!user && (
              <Link href="/login" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                Login
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-gray-700"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle Menu"
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Nav */}
          {menuOpen && (
            <nav className="md:hidden absolute top-full bg-white border round shadow-lg w-fit px-4 pb-4 z-50 space-y-2 text-sm border-t">
              {user ? (
                <>
                  <Link href="/dashboard" className="block py-1 text-lg font-medium text-gray-800 hover:text-blue-600 hover:no-underline">Dashboard</Link>
                  <Link href="/account" className="block py-1 text-lg font-medium text-gray-800 hover:text-blue-600 hover:no-underline">Account</Link>
                  <button onClick={handleLogout} className="block py-1 text-lg font-medium text-gray-800 hover:text-blue-600 hover:no-underline">Logout</button>
                </>
              ) : (
                <>
                  <Link href="#referral" className="block py-1 text-lg font-medium text-gray-800 hover:text-blue-600 hover:no-underline">Referral Program</Link>
                  <Link href="#faq" className="block py-1 text-lg font-medium text-gray-800 hover:text-blue-600 hover:no-underline">FAQ</Link>
                  <Link href="#pricing" className="block py-1 text-lg font-medium text-gray-800 hover:text-blue-600 hover:no-underline">Pricing</Link>
                  
                  <Link href="/signup" className="block py-1 text-lg font-medium text-gray-800 hover:text-blue-600 hover:no-underline">Sign Up</Link>
                </>
              )}
            </nav>
          )}
        </div>
      </header>

      {/* Spacer to account for fixed header height */}
      <div className="h-20"></div>

      {/* Main Content */}
      <main className="flex-grow max-w-6xl mx-auto p-4">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 text-center p-4 text-sm text-gray-600">
        © {new Date().getFullYear()} TaxTracker.ca —
        <Link href="/privacy" className="underline mx-1">Privacy</Link> |
        <Link href="/terms" className="underline mx-1">Terms</Link>
      </footer>
    </div>
  );
}