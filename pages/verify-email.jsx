// Verify email page content
// pages/verify-email.jsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { auth } from '../lib/firebase';
import { sendEmailVerification } from 'firebase/auth';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react'; // Make sure lucide-react is installed

export default function VerifyEmail() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        setUser(currentUser);

        if (!currentUser.emailVerified && !resent) {
          sendEmailVerification(currentUser)
            .then(() => setResent(true))
            .catch(() => setError('Failed to send verification email.'));
        }
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        await currentUser.reload();
        if (currentUser.emailVerified) {
          router.push('/account-setup');
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleResend = async () => {
    try {
      if (user) {
        await sendEmailVerification(user);
        setResent(true);
        setError('');
      }
    } catch (err) {
      setError('Failed to resend email. Please try again.');
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 text-center">
      <CheckCircle className="mx-auto text-green-500 w-16 h-16 animate-pulse mb-4" />
      <h1 className="text-2xl font-bold mb-2">You're Almost There!</h1>
      <p className="text-gray-700 mb-4">
        Your 30-day free trial has begun! To get started, please check your inbox and click the email verification link we sent you.
      </p>

      {resent && <p className="text-green-600 mb-2">Verification email resent!</p>}
      {error && <p className="text-red-500 mb-2">{error}</p>}

      <button
        onClick={handleResend}
        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-500 mb-4"
      >
        Resend Email
      </button>

      <div className="text-sm text-gray-600">
        Already verified? <Link href="/dashboard" className="underline">Go to Dashboard</Link>
      </div>
    </div >
  );
}
