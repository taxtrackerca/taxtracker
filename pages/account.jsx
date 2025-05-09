// Updated pages/account.jsx with business name + delete account
import { useEffect, useState } from 'react';
import { auth, db } from '../lib/firebase';
import { sendPasswordResetEmail, updateEmail, deleteUser } from 'firebase/auth';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import Link from 'next/link';
import { getIdToken } from 'firebase/auth';

export default function Account() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [message, setMessage] = useState('');
  const [hasSubscription, setHasSubscription] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (u) => {
      if (!u) {
        window.location.href = '/login';
      } else {
        setUser(u);
        setEmail(u.email);
        const profileRef = doc(db, 'users', u.uid);
        const snap = await getDoc(profileRef);
        if (snap.exists()) {
          const profile = snap.data();
          setBusinessName(profile.businessName || '');
          setHasSubscription(!!profile.subscriptionId); // ← this is what you’re adding
        }
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      if (!user) return;
      const token = await user.getIdToken();
      const res = await fetch('/api/subscription-status', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setSubscriptionStatus(data);
      }
    };

    fetchSubscriptionStatus();
  }, [user]);

  const handleEmailUpdate = async () => {
    try {
      await updateEmail(user, email);
      setMessage('Email updated successfully.');
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handlePasswordReset = async () => {
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('Password reset email sent.');
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleBusinessNameUpdate = async () => {
    try {
      const profileRef = doc(db, 'users', user.uid);
      await setDoc(profileRef, { businessName }, { merge: true });
      setMessage('Business name saved.');
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm('Are you sure you want to delete your account? This cannot be undone.');
    if (!confirmed) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid));
      await deleteUser(user);
      setMessage('Account deleted.');
      window.location.href = '/login';
    } catch (error) {
      setMessage(error.message);
    }
  };


  if (!user) return null;

  return (
    <div className="p-4 max-w-xl mx-auto">
      <Link href="/dashboard" className="text-blue-600 hover:underline">← Back to Dashboard</Link>

      <h1 className="text-2xl font-bold mb-4 mt-4">Account Settings</h1>

      <div className="bg-gray-100 border rounded p-4 mb-6">
        <h2 className="text-lg font-semibold mb-2">Manage Your Subscription</h2>
        <p className="text-sm mb-4">
          Use the link below to securely view your subscription, update your billing details, check when your next payment is due, or cancel your subscription.
        </p>
        <a
          href="https://billing.stripe.com/p/login/6oE0346eYfk83FCbII"
          className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2 rounded"
        >
          Manage Subscription
        </a>
      </div>

      <div className="mb-4">
        <label className="block text-sm mb-1">Email</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full border p-2 rounded" />
      </div>

      <div className="flex gap-4 mb-6">
        <button onClick={handleEmailUpdate} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500">Update Email</button>
        <button onClick={handlePasswordReset} className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-500">Reset Password</button>
      </div>

      <div className="mb-4">
        <label className="block text-sm mb-1">Business Name</label>
        <input type="text" value={businessName} onChange={e => setBusinessName(e.target.value)} className="w-full border p-2 rounded" />
      </div>

      <button onClick={handleBusinessNameUpdate} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-500 mb-6">Save Business Name</button>

      <hr className="my-6" />


      {/*<button onClick={handleDeleteAccount} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-500">Delete Account</button>*/}


    </div>
  );
}
