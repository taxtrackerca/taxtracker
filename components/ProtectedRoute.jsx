import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { auth, db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function ProtectedRoute({ children, adminOnly = false }) {
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
          safeRedirect('/account-setup');
          return;
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

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        checkAccess();
      } else {
        safeRedirect('/login');
      }
    });

    return () => unsubscribe();
  }, [router, adminOnly]);

  // Prevent multiple redirects
  const safeRedirect = (path) => {
    if (!redirecting && router.pathname !== path) {
      setRedirecting(true);
      router.push(path);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <svg
          className="animate-spin h-8 w-8 text-blue-600"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8H4z"
          ></path>
        </svg>
        <span className="ml-3 text-gray-600 text-sm">Checking access...</span>
      </div>
    );
  }

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