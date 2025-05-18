import { useEffect, useState } from 'react';
import { auth, db } from '../lib/firebase';
import { sendPasswordResetEmail, updateEmail, deleteUser } from 'firebase/auth';
import {
  collection,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore';
import Link from 'next/link';
import { getIdToken } from 'firebase/auth';
import { Check } from 'lucide-react';
import { provincialData, federalRates, federalCredit } from '../lib/taxRates';
import SupportForm from '../components/SupportForm';
import SupportTicketForm from '../components/SupportTicketForm';

const provinces = [
  'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador',
  'Northwest Territories', 'Nova Scotia', 'Nunavut', 'Ontario',
  'Prince Edward Island', 'Quebec', 'Saskatchewan', 'Yukon',
];

export default function Account() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [province, setProvince] = useState('');
  const [businessMessage, setBusinessMessage] = useState('');
  const [provinceMessage, setProvinceMessage] = useState('');
  const [hasSubscription, setHasSubscription] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [credits, setCredits] = useState(0);
  const [referralCode, setReferralCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [requestPending, setRequestPending] = useState(false);
  const [userData, setUserData] = useState(null);
  const [showPauseConfirm, setShowPauseConfirm] = useState(false);
  const [showProvinceForm, setShowProvinceForm] = useState(false);

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
          setUserData(profile);
          setBusinessName(profile.businessName || '');
          setProvince(profile.province || '');
          setHasSubscription(!!profile.subscriptionId);
          setCredits(profile.credits || 0);
          setReferralCode(profile.referralCode || '');

          const requestQuery = query(
            collection(db, 'supportRequests'),
            where('email', '==', u.email),
            where('resolved', '==', false),
            orderBy('timestamp', 'desc'),
            limit(1)
          );
          const requestSnap = await getDocs(requestQuery);
          setRequestPending(!requestSnap.empty);

          if (profile.isAdmin === true) {
            setIsAdmin(true);
          }
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

  const handlePause = async () => {
    const confirmed = window.confirm(
      'Pausing your subscription means your dashboard access will be disabled at the end of your current billing cycle. You will still have access to your account settings and can resume anytime. Do you wish to continue?'
    );
    if (!confirmed) return;
    try {
      const res = await fetch('/api/pause-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: auth.currentUser.uid }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Subscription pause requested. Access remains active until the end of your current period.');
        window.location.reload();
      } else {
        throw new Error(data.error || 'Pause failed');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while trying to pause the subscription.');
    }
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      {/* Province Section with Toggleable Form */}
      <div className="mb-6">
        <label className="block text-sm mb-1 font-semibold">Current Province or Territory</label>
        <input
          type="text"
          value={province || 'Not Set'}
          readOnly
          className="w-full border p-2 rounded bg-gray-100 text-gray-700 cursor-not-allowed"
        />
        {requestPending && (
          <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-1 rounded inline-block mt-2">
            Request Sent
          </span>
        )}
        <p className="text-sm text-gray-600 mt-2">
          <button
            className="text-blue-600 underline"
            onClick={() => setShowProvinceForm(prev => !prev)}
          >
            Request Province Change
          </button>
        </p>
        {showProvinceForm && (
          <div className="mt-4 border p-4 rounded bg-white">
            <SupportForm />
          </div>
        )}
      </div>
    </div>
  );
}
