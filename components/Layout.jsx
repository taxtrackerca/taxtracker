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
          <Link href="/" className="flex items-center space-x-2">
            <img src="/logo.png" alt="TaxTracker Logo" className="h-8 w-auto" />
            <span className="text-2xl font-bold text-black font-poppins tracking-tight text-primary">TaxTracker</span>
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
      <footer className="bg-gray-100 text-center p-4 text-sm text-gray-600">
        © {new Date().getFullYear()} TaxTracker.ca —
        <Link href="/privacy" className="underline mx-1">Privacy</Link> |
        <Link href="/terms" className="underline mx-1">Terms</Link>
      </footer>
    </div>
  );
}
