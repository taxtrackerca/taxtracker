// pages/getting-started.jsx
import Head from 'next/head';

export default function GettingStarted() {
  return (
    <>
      <Head>
        <title>Getting Started Guide | TaxTracker</title>
      </Head>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4">Getting Started Guide</h1>
        <p className="mb-6 text-gray-600">
          This guide walks you through everything you need to know to get the most out of TaxTracker.
        </p>

        <div className="border rounded shadow mb-6">
          <iframe
            src="/docs/TaxTracker_Getting_Started_Guide.pdf"
            width="100%"
            height="600px"
            className="w-full"
          >
            <p>Your browser does not support inline PDFs. <a href="/docs/TaxTracker_Getting_Started_Guide.pdf" target="_blank">Click here to download</a>.</p>
          </iframe>
        </div>

        <a
          href="/docs/TaxTracker_Getting_Started_Guide.pdf"
          download
          className="inline-block bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700 transition"
        >
          📥 Download PDF
        </a>
      </div>
    </>
  );
}