import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { auth, db } from '../lib/firebase';
import {
  sendEmailVerification,
  EmailAuthProvider,
  reauthenticateWithCredential,
  deleteUser,
  signOut,
  GoogleAuthProvider,
  reauthenticateWithPopup,
} from 'firebase/auth';
import { deleteDoc, doc } from 'firebase/firestore';
import { CheckCircle } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';

export default function VerifyEmail() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [redirecting, setRedirecting] = useState(false);
  const intervalIdRef = useRef(null);
  const redirectLockRef = useRef(false); // ✅ Add this 

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    intervalIdRef.current = setInterval(async () => {
      const currentUser = auth.currentUser;
      if (!currentUser || redirecting) return;

      await currentUser.reload();

      if (currentUser.emailVerified) {
        setRedirecting(true);
        clearInterval(intervalIdRef.current); // ✅ stop polling
        try {

          const token = await currentUser.getIdToken();
          const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

          const res = await fetch('/api/create-checkout-session', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              customerEmail: currentUser.email,
              firebaseUid: currentUser.uid,
            }),
          });

          const data = await res.json();
          if (data.url) {
            window.location.href = data.url;
          } else {
            throw new Error('Stripe session creation failed.');
          }
        } catch (err) {
          console.error('Stripe redirect error:', err);
          setError('Error redirecting to Stripe. Please try again later.');
          setRedirecting(false);
          redirectLockRef.current = false;
        }
      }
    }, 3000);

    return () => clearInterval(intervalIdRef.current);
  }, [redirecting]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setInterval(() => setResendCooldown(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [resendCooldown]);

  const handleResend = async () => {
    try {
      if (user && resendCooldown === 0) {
        await sendEmailVerification(user);
        setResent(true);
        setError('');
        setResendCooldown(60);
      }
    } catch (err) {
      setError('Failed to resend email. Please try again.');
    }
  };

  const handleDeleteAndRestart = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('No user signed in');

      const providerId = currentUser.providerData[0]?.providerId;

      if (providerId === 'password') {
        const password = prompt('Please re-enter your password to delete your account:');
        if (!password) return;

        const credential = EmailAuthProvider.credential(currentUser.email, password);
        await reauthenticateWithCredential(currentUser, credential);
      } else if (providerId === 'google.com') {
        const provider = new GoogleAuthProvider();
        await reauthenticateWithPopup(currentUser, provider);
      } else {
        throw new Error('Re-authentication not supported for this provider.');
      }

      await deleteDoc(doc(db, 'users', currentUser.uid));
      await deleteUser(currentUser);

      router.push('/signup');
    } catch (err) {
      console.error(err);
      setError('Unable to delete account. Please try again.');
    }
  };

  const handleManualStripeRedirect = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('No user signed in');

      await currentUser.reload();

      if (currentUser.emailVerified) {
        const token = await currentUser.getIdToken(); // ✅ after checking the user
        const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

        const res = await fetch('/api/create-checkout-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`, // ✅ correct placement
          },
          body: JSON.stringify({
            customerEmail: currentUser.email,
            firebaseUid: currentUser.uid,
          }),
        });

        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
        } else {
          setError('Stripe session failed. Try again later.');
        }
      } else {
        setResent(false);
        setError('Your email is not verified yet. Please check your inbox.');
      }
    } catch (err) {
      console.error(err);
      setError('Error checking verification or starting Stripe.');
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 text-center">
      <CheckCircle className="mx-auto text-green-500 w-16 h-16 animate-pulse mb-4" />
      <h1 className="text-2xl font-bold mb-2">You're Almost There!</h1>
      <p className="text-gray-700 mb-4">
        Your 30-day free trial has begun! Please check your inbox and click the email verification link we sent you.
      </p>

      {resent && <p className="text-green-600 mb-3 font-medium">Verification email sent!</p>}
      {error && <p className="text-red-600 mb-3 font-medium">{error}</p>}

      {redirecting && (
        <div className="flex flex-col items-center mb-3">
          <div className="loader ease-linear rounded-full border-4 border-t-4 border-blue-500 h-6 w-6 mb-2 animate-spin"></div>
          <p className="text-green-600 font-semibold">✅ Email verified! Redirecting...</p>
        </div>
      )}

      <div className="flex flex-col items-center space-y-3 mb-4">
        <button
          onClick={handleResend}
          disabled={resendCooldown > 0}
          className={`w-full max-w-xs bg-blue-600 text-white font-semibold py-2 rounded ${resendCooldown > 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-500'
            }`}
        >
          {resendCooldown > 0 ? `Try again in ${resendCooldown}s` : 'Send Email'}
        </button>

        <button
          onClick={handleManualStripeRedirect}
          className="text-blue-600 hover:text-blue-800 underline text-sm"
        >
          Already verified? Click here to continue
        </button>

        <button
          onClick={handleLogout}
          className="text-gray-600 hover:text-gray-800 underline text-sm"
        >
          Log out
        </button>

        <button
          onClick={handleDeleteAndRestart}
          className="text-red-600 hover:text-red-800 underline text-sm"
        >
          Can't verify your email? Delete account and start over
        </button>
      </div>
    </div>
  );
}