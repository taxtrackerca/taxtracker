import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { auth } from '../lib/firebase';
import { loadStripe } from '@stripe/stripe-js';

export default function Subscribe() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [redirecting, setRedirecting] = useState(true);

  useEffect(() => {
    const redirectToStripe = async () => {
      const user = auth.currentUser;
      if (!user) {
        router.push('/login');
        return;
      }

      try {
        const token = await user.getIdToken();
        const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

        const res = await fetch('/api/create-checkout-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            customerEmail: user.email,
            firebaseUid: user.uid,
          }),
        });

        const data = await res.json();

        if (data?.url) {
          window.location.href = data.url;
        } else {
          throw new Error('Stripe session creation failed.');
        }
      } catch (err) {
        console.error('Stripe redirect error:', err);
        setError('There was a problem redirecting you to Stripe. Please try again.');
        setRedirecting(false);
      }
    };

    redirectToStripe();
  }, [router]);

  return (
    <div className="max-w-md mx-auto mt-24 text-center px-4">
      <h1 className="text-2xl font-bold mb-2">Setting Up Your Subscription</h1>
      {redirecting && <p className="text-gray-700 mb-4">Redirecting you to Stripe to activate your 23-day free trial...</p>}
      {error && (
        <div className="text-red-600 font-medium mt-4">
          {error}
          <div className="mt-3">
            <button
              className="underline text-blue-600 hover:text-blue-800"
              onClick={() => router.push('/dashboard')}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}