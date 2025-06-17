// pages/login.jsx
import { useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword, onAuthStateChanged, setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        (async () => {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);

          const now = Date.now();

          if (!userSnap.exists()) {
            return router.push('/account-setup');
          }

          const userData = userSnap.data();
          const trialStart = userData.trialStart || now;

          if (!userData.trialStart) {
            await setDoc(userRef, { trialStart }, { merge: true });
          }

          const hasStripe = !!userData.stripeCustomerId;
          const trialExpired = now > trialStart + 7 * 24 * 60 * 60 * 1000;

          if (trialExpired && !hasStripe) {
            return router.push('/subscribe');
          }

          router.push('/dashboard');
        })();
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const autoLoginAllowed = localStorage.getItem('autoLoginAllowed') !== 'false';
      await setPersistence(auth, autoLoginAllowed ? browserLocalPersistence : browserSessionPersistence);
      await signInWithEmailAndPassword(auth, email, password);
  
      // ✅ Reset the flag so next login is auto-login unless user explicitly logs out
      localStorage.setItem('autoLoginAllowed', 'true');
  
      // ✅ Define the function first
      const checkTrialAndRedirect = async (user) => {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        const now = Date.now();
      
        if (!userSnap.exists()) {
          return router.push('/account-setup');
        }
      
        const userData = userSnap.data();
        const trialStart = userData.trialStart || now;
      
        if (!userData.trialStart) {
          await setDoc(userRef, { trialStart }, { merge: true });
        }
      
        const trialExpired = now > trialStart + 7 * 24 * 60 * 60 * 1000;
      
        // ✅ If trial is still valid, go to dashboard
        if (!trialExpired) return router.push('/dashboard');
      
        // ✅ Otherwise, check subscription
        const token = await user.getIdToken();
        const res = await fetch('/api/subscription-status', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      
        const subscription = await res.json();
        const hasActiveSub = subscription?.status === 'active' || subscription?.status === 'trialing';
      
        if (hasActiveSub) {
          return router.push('/dashboard');
        }
      
        // ✅ Trial expired and no subscription
        return router.push('/subscribe');
      };
  
      // ✅ Now you can call it
      await checkTrialAndRedirect(auth.currentUser);
    } catch (err) {
      setError('Invalid login credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 pt-24 sm:pt-32">
      <div className="bg-white shadow-md rounded-xl p-8 w-full max-w-md mx-auto">
        <div className="mb-4 text-center">
          <h1 className="text-2xl font-bold text-gray-800">Login to TaxTracker</h1>
          <p className="text-sm text-gray-500 mt-1">
            or <Link href="/signup" className="text-blue-600 hover:underline">create a new account</Link>
          </p>
        </div>

        {error && (
          <div className="mb-4 text-sm text-red-600 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded px-4 py-2 focus:outline-none focus:ring focus:ring-blue-200"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded px-4 py-2 focus:outline-none focus:ring focus:ring-blue-200"
            required
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
          >
            Login
          </button>
        </form>

        <div className="text-center mt-4 text-sm text-gray-600 space-y-2">
          <div>
            <Link href="/reset-password" className="text-blue-600 hover:underline">
              Forgot your password?
            </Link>
          </div>
          <div>
            <Link href="/" className="text-blue-500 hover:underline">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export async function getServerSideProps() {
  return { props: {} };
}