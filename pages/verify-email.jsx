import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { auth, db } from '../lib/firebase';
import {
  sendEmailVerification,
  EmailAuthProvider,
  reauthenticateWithCredential,
  deleteUser,
  signOut,
  GoogleAuthProvider,
  reauthenticateWithPopup
} from 'firebase/auth';
import { deleteDoc, doc } from 'firebase/firestore';
import { CheckCircle } from 'lucide-react';

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
      if (currentUser) setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        await currentUser.reload();
        if (currentUser.emailVerified) router.push('/account-setup');
      }
    }, 3000);
    return () => clearInterval(interval);
  }, []);

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
  
      // Delete from Firestore
      await deleteDoc(doc(db, 'users', currentUser.uid));
  
      // Delete Auth account
      await deleteUser(currentUser);
  
      router.push('/signup');
    } catch (err) {
      console.error(err);
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

      {resent && <p className="text-green-600 mb-3 font-medium">Verification email sent!</p>}
      {error && <p className="text-red-600 mb-3 font-medium">{error}</p>}

      <div className="flex flex-col items-center space-y-3 mb-4">
        <button
          onClick={handleResend}
          disabled={resendCooldown > 0}
          className={`w-full max-w-xs bg-blue-600 text-white font-semibold py-2 rounded ${
            resendCooldown > 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-500'
          }`}
        >
          {resendCooldown > 0 ? `Try again in ${resendCooldown}s` : 'Send Email'}
        </button>

        <button
          onClick={async () => {
            if (auth.currentUser) {
              await auth.currentUser.reload();
              if (auth.currentUser.emailVerified) {
                router.push('/account-setup');
              } else {
                setResent(false);
                setError('Your email is not verified yet. Please check your inbox.');
              }
            }
          }}
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