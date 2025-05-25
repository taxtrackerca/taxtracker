// Verify email page content
// pages/verify-email.jsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { auth } from '../lib/firebase';
import { sendEmailVerification } from 'firebase/auth';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react'; // Make sure lucide-react is installed
import { signOut } from 'firebase/auth';
import { deleteUser } from 'firebase/auth';
import { deleteDoc, doc } from 'firebase/firestore';

export default function VerifyEmail() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        setUser(currentUser);
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

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [resendCooldown]);

  const handleResend = async () => {
    try {
      if (user && resendCooldown === 0) {
        await sendEmailVerification(user);
        setResent(true);
        setError('');
        setResendCooldown(60); // 60-second timer
      }
    } catch (err) {
      setError('Failed to resend email. Please try again.');
    }
  };

  const handleDeleteAndRestart = async () => {
    try {
      const currentUser = auth.currentUser;
  
      if (currentUser) {
        const uid = currentUser.uid;
  
        // 1. Delete Firestore user doc
        await deleteDoc(doc(db, 'users', uid));
  
        // 2. Delete Firebase Auth user
        await deleteUser(currentUser);
  
        // 3. Redirect to signup
        router.push('/signup');
      }
    } catch (err) {
      console.error('Delete failed:', err);
      setError('Unable to delete account. Please try again.');
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 text-center">
      <CheckCircle className="mx-auto text-green-500 w-16 h-16 animate-pulse mb-4" />
      <h1 className="text-2xl font-bold mb-2">You're Almost There!</h1>
      <p className="text-gray-700 mb-4">
        Your 30-day free trial has begun! To get started, please check your inbox and click the email verification link we sent you.
      </p>

      {resent && <p className="text-green-600 mb-2">Verification email sent!</p>}
      {error && <p className="text-red-500 mb-2">{error}</p>}

      <button
  onClick={handleResend}
  disabled={resendCooldown > 0}
  className={`bg-blue-600 text-white px-6 py-2 rounded mb-4 ${
    resendCooldown > 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-500'
  }`}
>
  {resendCooldown > 0 ? `Try again in ${resendCooldown}s` : 'Resend Email'}
</button>

      <button
  onClick={async () => {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      if (auth.currentUser.emailVerified) {
        router.push('/account-setup');
      } else {
        setError('Your email is not verified yet. Please check your inbox.');
      }
    }
  }}
  className="text-sm underline text-blue-600 hover:text-blue-800"
>
  Already verified? Click here to continue
</button>
<button
  onClick={handleLogout}
  className="mt-2 text-sm text-gray-600 underline hover:text-gray-800"
>
  Log out
</button>

<button
  onClick={handleDeleteAndRestart}
  className="mt-2 text-sm text-red-600 underline hover:text-red-800"
>
  Can't verify your email? Delete account and start over
</button>

     
    </div >
  );
}
