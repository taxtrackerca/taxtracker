// pages/signup.jsx
import { useState, useEffect } from 'react';
import { auth } from '../lib/firebase';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { useRouter } from 'next/router';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const refCodeFromUrl = router.query.ref;
    if (refCodeFromUrl) {
      setReferralCode(refCodeFromUrl);
    }
  }, [router.query]);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!acceptedTerms) {
      setError('You must accept the terms and privacy policy.');
      return;
    }

    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);

      // ✅ Send verification email
      await sendEmailVerification(result.user);

      const token = await result.user.getIdToken();

      const uid = result.user.uid;

      // Step 1: Lookup the referrer UID from the referralCode
      let referredByUid = null;

      if (referralCode) {
        const refCheck = await fetch('/api/get-referrer-uid', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ referralCode }),
        });

        const refData = await refCheck.json();
        if (refData?.uid) {
          referredByUid = refData.uid;
        }
      }

      // Step 2: Save user to Firestore with UID as referredBy
      await fetch('/api/save-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, email, referredBy: referredByUid || null }),
      });

      // Add to MailerLite
      await fetch('/api/add-subscriber', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });


      // Redirect to verify email page
      router.push('/verify-email');
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists. Please log in instead.');
      } else {
        setError(err.message || 'Signup failed.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 sm:pt-32">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Create Your Account</h1>

        {error && <p className="text-red-600 text-sm mb-4 text-center">{error}</p>}

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <input
              type="password"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Referral Code (optional)</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
              placeholder="ABC123"
            />
          </div>

          <div className="flex items-start space-x-2 text-sm text-gray-600">
            <input
              type="checkbox"
              id="terms"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-1"
              required
            />
            <label htmlFor="terms">
              I agree to the{' '}
              <a href="/terms" className="text-blue-600 hover:underline">Terms of Service</a> and{' '}
              <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>.
            </label>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-md font-semibold hover:bg-blue-700 transition"
          >
            Sign Up
          </button>
        </form>

        <p className="text-sm text-gray-500 mt-4 text-center">
          Already have an account?{' '}
          <a href="/login" className="text-blue-600 hover:underline">Login</a>
        </p>
      </div>
    </div>
  );
}

// ✅ FIXED: disables static generation for this page
export async function getServerSideProps() {
  return { props: {} };
}