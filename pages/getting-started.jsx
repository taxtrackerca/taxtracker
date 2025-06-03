// pages/getting-started.jsx
import Head from 'next/head';
import Link from 'next/link';

export default function GettingStarted() {
  return (
    <>
      <Head>
        <title>Getting Started Guide | TaxTracker</title>
      </Head>

      <main className="max-w-4xl mx-auto px-4 py-10 text-gray-800">
        <h1 className="text-3xl font-bold mb-6">Getting Started with TaxTracker</h1>

        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 rounded mb-8">
          <strong>Disclaimer:</strong> This guide is for informational purposes only and is not a substitute for professional tax advice or services. TaxTracker does not replace the expertise of a Certified Professional Accountant (CPA) for tax filing. Tax estimates are based on the information you provide and are intended to give you an approximate understanding of what you may owe. Personal deductions beyond standard federal and provincial credits are not factored into this software.
        </div>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-2">Step 1: Create Your Account</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>Visit <strong>www.taxtracker.ca</strong></li>
            <li>Click <strong>Sign Up</strong> and enter your email and password</li>
            <li>Check your email to verify your address</li>
            <li>After verification, you'll be directed to activate your free trial</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-2">Step 2: Activate Your 30-Day Free Trial</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>After verifying your email, you’ll be taken to a secure Stripe checkout page</li>
            <li>Enter your payment information. You will not be charged until the trial ends</li>
            <li>Enjoy uninterrupted access to TaxTracker during your free trial</li>
          </ul>
          <p className="mt-2 text-sm text-gray-700">
            <strong>Why do we collect your card?</strong><br />
            To ensure your access continues seamlessly after the 30-day free trial, we collect payment information upfront. You can cancel anytime from your Account page before the trial ends.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-2">Step 3: Set Up Your Account</h2>
          <p className="mb-2">Once subscribed, you’ll be prompted to:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Enter your <strong>business name</strong></li>
            <li>Select your <strong>province or territory</strong></li>
          </ul>
          <p className="mt-2 text-sm text-gray-700">
            <strong>Why this matters:</strong> TaxTracker uses federal and provincial tax rates and credits specific to your region. If your income is below the credit threshold, you may see $0 tax owing early in the year — this is normal. You should also include other income like a salary to calculate your true tax bracket.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-2">Step 4: Explore Your Dashboard</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>Track monthly business income</li>
            <li>Enter eligible expenses by CRA categories</li>
            <li>Log home office and vehicle use</li>
            <li>View automatically updated estimated tax owing</li>
            <li>Export data to CSV or PDF</li>
            <li>Track mileage, meals, travel, and more</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-2">Add TaxTracker to Your Phone</h2>
          <p className="mb-2">No app download required — just add it to your home screen:</p>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold">iPhone / iPad:</h3>
              <ul className="list-decimal list-inside space-y-1">
                <li>Tap the Share icon in Safari</li>
                <li>Scroll down and tap <strong>Add to Home Screen</strong></li>
                <li>Tap <strong>Add</strong></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold">Android:</h3>
              <ul className="list-decimal list-inside space-y-1">
                <li>Open Chrome</li>
                <li>Tap the three dots in the top right</li>
                <li>Tap <strong>Add to Home screen</strong></li>
                <li>Tap <strong>Add</strong></li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-2">Pause or Cancel Anytime</h2>
          <p className="text-gray-700">
            You can pause your subscription anytime from your Account page. Your data will be saved. To cancel and delete your account permanently, contact support. Once deleted, your data cannot be recovered.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-2">Tips for Success</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>Log income and expenses weekly</li>
            <li>Use Logs to track meals, driving, inventory</li>
            <li>Include other income (e.g., salary)</li>
            <li>Select the correct province or territory</li>
            <li>Export data before tax season</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-2">Stay in the Loop</h2>
          <p className="text-gray-700">
            Every Friday, we’ll email you reminders, tax tips, and CRA deadlines.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-2">Need Help?</h2>
          <p className="text-gray-700">
            Go to your Account page and click <strong>Contact Support</strong>. We’re happy to help!
          </p>
        </section>

        <div className="text-center">
          <a
            href="/docs/TaxTracker_Getting_Started_Guide.pdf"
            download
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
          >
            📥 Download the PDF Version
          </a>
        </div>
      </main>
    </>
  );
}
