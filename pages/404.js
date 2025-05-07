// 404 page content
// pages/404.js
import Link from 'next/link';

export default function Custom404() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-6">
      <h1 className="text-5xl font-bold text-blue-600 mb-4">404</h1>
      <h2 className="text-2xl font-semibold mb-2">Oops! Page Not Found</h2>
      <p className="text-gray-600 mb-6 max-w-md">
        The page you're looking for doesn’t exist or has been moved. Let’s get you back on track.
      </p>
      <Link href="/" className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-500 text-lg">Go to Homepage
      </Link>
    </div>
  );
}
