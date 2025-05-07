// Terms of use
// pages/terms.js
import Link from 'next/link';

export default function TermsOfUse() {
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Terms of Use</h1>
      <p className="text-gray-700">
        By using TaxTracker.ca, you agree to the following terms and conditions.
      </p>

      <h2 className="text-xl font-semibold mt-4">Account Responsibility</h2>
      <p className="text-gray-700">
        You are responsible for maintaining the confidentiality of your login credentials and for all activities under your account.
      </p>

      <h2 className="text-xl font-semibold mt-4">Service Availability</h2>
      <p className="text-gray-700">
        We strive to keep the service available at all times, but we may temporarily suspend access for maintenance or upgrades.
      </p>

      <h2 className="text-xl font-semibold mt-4">Disclaimer</h2>
      <p className="text-gray-700">
        TaxTracker.ca provides tools to assist with tax tracking, but does not offer official tax or accounting advice. Users are responsible for submitting their taxes to the CRA.
      </p>

      <h2 className="text-xl font-semibold mt-4">Termination</h2>
      <p className="text-gray-700">
        We reserve the right to suspend or terminate your account for misuse or violation of these terms.
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
