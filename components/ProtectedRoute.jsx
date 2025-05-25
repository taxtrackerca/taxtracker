import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { auth, db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function ProtectedRoute({ children, adminOnly = false, allowIncompleteProfile = false }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [redirecting, setRedirecting] = useState(false); // prevent multiple redirects

  useEffect(() => {
    const checkAccess = async () => {
      const user = auth.currentUser;

      if (!user) {
        safeRedirect('/login');
        return;
      }

      await user.reload();

      if (!user.emailVerified) {
        safeRedirect('/verify-email');
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const data = userDoc.data();

        if (!data?.businessName || !data?.province) {
            if (!allowIncompleteProfile) {
              safeRedirect('/account-setup');
              return;
            }
          }

        if (adminOnly && !data?.isAdmin) {
          safeRedirect('/');
          return;
        }

        setLoading(false);
      } catch (err) {
        console.error('Error loading user profile:', err);
        setError('Something went wrong loading your account. Please refresh or try again later.');
        setLoading(false);
      }
    };

    if (!router.isReady) return; // 🚫 Avoid early redirect before route is ready
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        checkAccess();
      } else {
        safeRedirect('/login');
      }
    });

    return () => unsubscribe();
  }, [router, adminOnly]);

  const safeRedirect = (path) => {
    if (!redirecting && router.pathname !== path && router.isReady) {
      setRedirecting(true);
      // Defer redirect to the next event loop tick to avoid race
      setTimeout(() => {
        router.replace(path);
      }, 0);
    }
  };

  if (loading) return null;

  if (error) {
    return (
      <div className="p-6 max-w-md mx-auto text-center">
        <p className="text-red-600 font-medium mb-2">{error}</p>
        <button
          onClick={() => router.reload()}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
        >
          Reload Page
        </button>
      </div>
    );
  }

  return children;
}