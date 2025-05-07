// Privacy policy
// pages/privacy.js
import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Privacy Policy</h1>
      <p className="text-gray-700">
        TaxTracker.ca respects your privacy. This policy explains what information we collect, how we use it, and how we protect it.
      </p>

      <h2 className="text-xl font-semibold mt-4">Information Collection</h2>
      <p className="text-gray-700">
        We collect information you provide during account registration and while using the platform, including income and expense data.
      </p>

      <h2 className="text-xl font-semibold mt-4">Use of Data</h2>
      <p className="text-gray-700">
        Your data is used only to provide you with accurate tax tracking and summaries. We do not share or sell your information.
      </p>

      <h2 className="text-xl font-semibold mt-4">Data Security</h2>
      <p className="text-gray-700">
        We use secure authentication and encrypted databases to protect your information.
      </p>

      <h2 className="text-xl font-semibold mt-4">Your Rights</h2>
      <p className="text-gray-700">
        You can access or delete your data at any time by logging into your account and managing your profile.
      </p>

      <p className="text-gray-600 mt-8 text-sm">
        Questions? Contact us at <a href="mailto:support@taxtracker.ca" className="underline">support@taxtracker.ca</a>
      </p>

      <div className="mt-6">
        <Link href="/" className="text-blue-600 underline">Back to Home
        </Link>
      </div>
    </div>
  );
}