// Landing page content
// pages/index.js
import Link from 'next/link';


export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">TaxTracker.ca</h1>
        <div className="space-x-4">
          <Link href="/login" className="hover:underline">Login </Link>
          <Link href="/signup" className="bg-white text-blue-600 px-4 py-2 rounded font-semibold hover:bg-blue-100">Sign Up
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-white px-4 py-20 sm:py-24 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-900 mb-4 leading-tight">
            Simplify Your Taxes. Start Today.
          </h1>

          <p className="text-base sm:text-lg text-gray-600 mb-6">
            TaxTracker makes it easy for Canadian sole proprietors to track income, expenses, and GST/HST — all in one place.
          </p>

          <div className="flex justify-center items-center gap-2 sm:gap-4 flex-wrap mb-6">
            <span className="bg-red-100 text-red-700 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold">
              Built for Canadians
            </span>
            <span className="bg-blue-100 text-blue-700 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold">
              30-Day Free Trial
            </span>
            <span className="bg-yellow-100 text-yellow-800 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold">
              Only $4.95/month after
            </span>
            <span className="bg-green-100 text-green-800 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold">
              CRA-Compliant
            </span>
          </div>

          <a
            href="/signup"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base sm:text-lg px-6 sm:px-8 py-3 rounded shadow-lg transition duration-200"
          >
            Take Control of Your Taxes
          </a>

          <p className="text-xs sm:text-sm text-gray-400 mt-4">Cancel anytime. No strings attached.</p>
        </div>
      </section>

      


      {/* Why TaxTracker Is Different Section */}
      <section className="relative bg-gradient-to-b from-gray-50 to-white py-20 px-6 text-center">
        <div className="absolute top-0 left-0 w-full h-20 bg-white rounded-b-3xl z-0"></div>

        <div className="relative z-10">
          <h2 className="text-4xl font-extrabold mb-4 text-gray-900">Why TaxTracker Is Different</h2>
          <p className="text-gray-600 max-w-2xl mx-auto mb-12 text-lg">
            We’re not just another spreadsheet or bookkeeping app. TaxTracker is built from the ground up for Canadian sole proprietors who want to stay organized — and sane — at tax time.
          </p>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto text-left">
            {/* Each feature card */}
            {[
              {
                icon: "📄",
                title: "Built for T2125",
                desc: "Our categories and calculations match what the CRA expects on your T2125 form — no guesswork required.",
              },
              {
                icon: "📊",
                title: "Real-Time Tax Estimates",
                desc: "See your estimated tax owing as you go — no surprises at the end of the year.",
              },
              {
                icon: "📁",
                title: "One-Click Export",
                desc: "Need to hand off to your accountant or save for records? Export clean CSV and PDF summaries instantly.",
              },
              {
                icon: "⚡",
                title: "Simple. Fast. Focused.",
                desc: "No bloated features. Just the tools you need to track income, claim expenses, and stay on top of GST/HST.",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-white rounded-xl shadow hover:shadow-lg p-6 transition duration-200 border-t-4 border-blue-600"
                data-aos="fade-up"
                data-aos-delay={100 * (i + 1)}
              >
                <div className="text-3xl mb-4">{item.icon}</div>
                <h4 className="text-xl font-semibold text-gray-800 mb-2">{item.title}</h4>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Step-by-step timeline */}
          <div className="mt-20">
            <h3 className="text-2xl font-semibold text-gray-900 mb-6">How It Works in 3 Simple Steps</h3>
            <div className="flex flex-col md:flex-row justify-center gap-12 max-w-4xl mx-auto">
              {[
                {
                  number: "1",
                  title: "Sign Up",
                  desc: "Create an account and start your 30-day free trial in minutes — no hassle.",
                },
                {
                  number: "2",
                  title: "Track Your Income",
                  desc: "Log your income, expenses, and GST/HST using our user-friendly dashboard.",
                },
                {
                  number: "3",
                  title: "Generate Reports",
                  desc: "Download clean reports for your own records or your accountant.",
                },
              ].map((step, i) => (
                <div key={i} className="flex flex-col items-center text-center" data-aos="fade-up" data-aos-delay={300 + i * 100}>
                  <div className="w-16 h-16 bg-blue-600 text-white text-xl font-bold rounded-full flex items-center justify-center mb-4 shadow-lg">
                    {step.number}
                  </div>
                  <h4 className="text-xl font-semibold text-blue-600 mb-2">{step.title}</h4>
                  <p className="text-gray-700 max-w-xs">{step.desc}</p>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="mt-12">
              <a
                href="/signup"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg px-8 py-3 rounded shadow-lg transition duration-200"
              >
                Start Your Free Trial
              </a>
              <p className="text-sm text-gray-500 mt-2">Only $4.95/month after 30 days. Cancel anytime.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Screenshot Section */}
      <section className="px-6 py-12 text-center" data-aos="fade-up">
        <h3 className="text-2xl font-semibold mb-6">See TaxTracker in Action</h3>
        <p className="text-gray-600 mb-8 max-w-xl mx-auto">Here’s a preview of the clean and easy-to-use dashboard designed to simplify your small business taxes.</p>
        <div className="flex justify-center items-center flex-wrap gap-6">
          <div className="border rounded shadow-md overflow-hidden max-w-md" data-aos="zoom-in">
            <img src="/screenshots/dashboard-preview1.png" alt="TaxTracker Dashboard Example" className="w-full h-auto" />
          </div>
          <div className="border rounded shadow-md overflow-hidden max-w-md" data-aos="zoom-in" data-aos-delay="200">
            <img src="/screenshots/dashboard-preview2.png" alt="Tax Summary Example" className="w-full h-auto" />
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="px-6 py-12 bg-white text-center" data-aos="fade-up">
        <h3 className="text-2xl font-semibold mb-6">Trusted by Small Business Owners</h3>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <div className="bg-gray-100 p-6 rounded shadow" data-aos="fade-up" data-aos-delay="100">
            <p className="italic text-gray-700">"TaxTracker made my year-end filing so much easier. I love how simple and mobile-friendly it is!"</p>
            <p className="mt-4 font-bold text-gray-800">— Sarah, Freelance Designer</p>
          </div>
          <div className="bg-gray-100 p-6 rounded shadow" data-aos="fade-up" data-aos-delay="200">
            <p className="italic text-gray-700">"Finally a tool that's built for Canadian small business taxes. The GST tracking alone is worth it!"</p>
            <p className="mt-4 font-bold text-gray-800">— Mark, Online Store Owner</p>
          </div>
          <div className="bg-gray-100 p-6 rounded shadow" data-aos="fade-up" data-aos-delay="300">
            <p className="italic text-gray-700">"TaxTracker helped me understand my expenses better, and I saved money at tax time! Highly recommend."</p>
            <p className="mt-4 font-bold text-gray-800">— Jenna, Consultant</p>
          </div>
        </div>
      </section>

      {/* Why Trust Us Section */}
      <section className="bg-white py-16 px-6 text-center">
        <h2 className="text-3xl font-bold mb-4">Why Trust TaxTracker.ca?</h2>
        <p className="text-gray-600 max-w-2xl mx-auto mb-12">
          Your financial data deserves privacy, protection, and peace of mind. Here’s how we deliver all three.
        </p>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Card 1 */}
          <div
            className="group bg-white border border-gray-200 shadow-sm rounded-xl p-6 transition hover:shadow-lg hover:border-blue-600"
            data-aos="fade-up"
          >
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 mb-4 mx-auto group-hover:bg-blue-100 transition">
              <img src="/icons/lock.svg" alt="Secure Data" className="w-8 h-8 text-blue-600" />
            </div>
            <h4 className="text-lg font-semibold mb-2">Secure & Encrypted</h4>
            <p className="text-gray-600 text-sm">We use trusted encryption to keep your tax data safe in transit and at rest.</p>
          </div>

          {/* Card 2 */}
          <div
            className="group bg-white border border-gray-200 shadow-sm rounded-xl p-6 transition hover:shadow-lg hover:border-blue-600"
            data-aos="fade-up"
            data-aos-delay="100"
          >
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 mb-4 mx-auto group-hover:bg-blue-100 transition">
              <img src="/icons/server.svg" alt="Canadian Hosting" className="w-8 h-8 text-blue-600" />
            </div>
            <h4 className="text-lg font-semibold mb-2">Hosted in Canada</h4>
            <p className="text-gray-600 text-sm">Your data stays in Canada to meet residency and privacy standards you can trust.</p>
          </div>

          {/* Card 3 */}
          <div
            className="group bg-white border border-gray-200 shadow-sm rounded-xl p-6 transition hover:shadow-lg hover:border-blue-600"
            data-aos="fade-up"
            data-aos-delay="200"
          >
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 mb-4 mx-auto group-hover:bg-blue-100 transition">
              <img src="/icons/privacy.svg" alt="Privacy First" className="w-8 h-8 text-blue-600" />
            </div>
            <h4 className="text-lg font-semibold mb-2">Privacy-First Design</h4>
            <p className="text-gray-600 text-sm">We never sell your data — ever. Your info is used only to help you track taxes, better.</p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="bg-gray-50 py-16 px-6 text-center">
        <h2 className="text-3xl font-bold mb-4">Simple, Honest Pricing</h2>
        <p className="text-gray-600 max-w-xl mx-auto mb-12">
          Start with a free 30-day trial. After that, it’s just <span className="font-semibold text-gray-800">$4.95/month</span>. No contracts. Cancel anytime.
        </p>

        <div className="max-w-xl mx-auto bg-white border border-gray-200 shadow-md rounded-xl p-8 relative overflow-hidden" data-aos="fade-up">
          {/* Badge */}
          <div className="absolute top-0 right-0 bg-green-500 text-white text-xs px-3 py-1 rounded-bl-xl font-semibold">
            Best Value
          </div>

          <h3 className="text-2xl font-bold text-gray-800 mb-4">TaxTracker Pro</h3>
          <p className="text-4xl font-bold text-gray-900 mb-2">$4.95<span className="text-xl font-medium text-gray-500">/month</span></p>
          <p className="text-gray-600 mb-6">Includes everything you need to track your business taxes with confidence.</p>

          <ul className="text-left text-gray-700 space-y-2 mb-8 max-w-sm mx-auto">
            <li className="flex items-start">
              <span className="text-green-600 font-bold mr-2">✓</span> CRA T2125-based tracking
            </li>
            <li className="flex items-start">
              <span className="text-green-600 font-bold mr-2">✓</span> Monthly and Year-to-Date summaries
            </li>
            <li className="flex items-start">
              <span className="text-green-600 font-bold mr-2">✓</span> GST/HST collection & remittance
            </li>
            <li className="flex items-start">
              <span className="text-green-600 font-bold mr-2">✓</span> CSV and PDF export
            </li>
            <li className="flex items-start">
              <span className="text-green-600 font-bold mr-2">✓</span> Mobile-friendly interface
            </li>
          </ul>

          <a
            href="/signup"
            className="inline-block bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-6 rounded-lg transition"
          >
            Start Free Trial
          </a>

          <p className="text-sm text-gray-500 mt-4">
            You’ll only be charged after your 30-day trial ends. Cancel anytime.
          </p>
        </div>
      </section>

      {/* Floating Mobile CTA */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden bg-white border-t p-3 text-center shadow z-50">
        <Link href="/signup"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-500 w-full block">
          Start Free Trial
        </Link>
      </div>


    </div >
  );
}
