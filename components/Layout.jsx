// components/Layout.jsx
import Link from 'next/link';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export default function Layout({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-text flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-primary">
            TaxTracker
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex space-x-6 text-sm">
            <Link href="/dashboard" className="text-gray-700 hover:text-primary">Dashboard</Link>
            <Link href="/account" className="text-gray-700 hover:text-primary">Account</Link>
            <Link href="/login" className="text-gray-700 hover:text-primary">Logout</Link>
          </nav>

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
          <nav className="md:hidden bg-white px-4 pb-4 space-y-2 text-sm border-t">
            <Link href="/dashboard" className="block text-gray-700 hover:text-primary">Dashboard</Link>
            <Link href="/account" className="block text-gray-700 hover:text-primary">Account</Link>
            <Link href="/login" className="block text-gray-700 hover:text-primary">Logout</Link>
          </nav>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-6xl mx-auto p-4">
        {children}
      </main>

      {/* Footer */}
      <footer className="text-center text-sm text-gray-500 py-4 border-t">
        &copy; {new Date().getFullYear()} TaxTracker. All rights reserved.
      </footer>
    </div>
  );
}
