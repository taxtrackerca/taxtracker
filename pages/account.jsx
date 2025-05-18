// Updated pages/account.jsx with collapsible sections for improved layout
import { useEffect, useState } from 'react';
import { auth, db } from '../lib/firebase';
import {
  sendPasswordResetEmail,
  updateEmail,
  deleteUser,
} from 'firebase/auth';
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
  limit,
} from 'firebase/firestore';
import Link from 'next/link';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { provincialData, federalRates, federalCredit } from '../lib/taxRates';
import SupportForm from '../components/SupportForm';
import SupportTicketForm from '../components/SupportTicketForm';

const provinces = [
  'Alberta',
  'British Columbia',
  'Manitoba',
  'New Brunswick',
  'Newfoundland and Labrador',
  'Northwest Territories',
  'Nova Scotia',
  'Nunavut',
  'Ontario',
  'Prince Edward Island',
  'Quebec',
  'Saskatchewan',
  'Yukon',
];

export default function Account() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [province, setProvince] = useState('');
  const [businessMessage, setBusinessMessage] = useState('');
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [credits, setCredits] = useState(0);
  const [referralCode, setReferralCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [requestPending, setRequestPending] = useState(false);
  const [userData, setUserData] = useState(null);
  const [showPauseConfirm, setShowPauseConfirm] = useState(false);
  const [sectionsOpen, setSectionsOpen] = useState({});

  const toggleSection = (key) => {
    setSectionsOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (u) => {
      if (!u) return (window.location.href = '/login');
      setUser(u);
      setEmail(u.email);
      const profileRef = doc(db, 'users', u.uid);
      const snap = await getDoc(profileRef);
      if (snap.exists()) {
        const profile = snap.data();
        setUserData(profile);
        setBusinessName(profile.businessName || '');
        setProvince(profile.province || '');
        setCredits(profile.credits || 0);
        setReferralCode(profile.referralCode || '');
        if (profile.isAdmin) setIsAdmin(true);

        const requestQuery = query(
          collection(db, 'supportRequests'),
          where('email', '==', u.email),
          where('resolved', '==', false),
          orderBy('timestamp', 'desc'),
          limit(1)
        );
        const requestSnap = await getDocs(requestQuery);
        setRequestPending(!requestSnap.empty);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    user.getIdToken().then((token) => {
      fetch('/api/subscription-status', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => setSubscriptionStatus(data));
    });
  }, [user]);

  const handleEmailUpdate = async () => {
    try {
      await updateEmail(user, email);
    } catch (error) {
      alert(error.message);
    }
  };

  const handlePasswordReset = async () => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      alert(error.message);
    }
  };

  const handleBusinessNameUpdate = async () => {
    await setDoc(doc(db, 'users', user.uid), { businessName }, { merge: true });
    setBusinessMessage('Business name saved.');
    setTimeout(() => setBusinessMessage(''), 3000);
  };

  const handlePause = async () => {
    const confirmed = window.confirm('Pause access at end of billing cycle?');
    if (!confirmed) return;
    const res = await fetch('/api/pause-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: auth.currentUser.uid }),
    });
    const data = await res.json();
    if (data.success) window.location.reload();
    else alert(data.error);
  };

  const handleResume = async () => {
    const res = await fetch('/api/resume-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: auth.currentUser.uid }),
    });
    if (res.ok) window.location.reload();
    else alert('Resume failed');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://taxtracker.ca/signup?ref=${referralCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!user) return null;

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6">
      <Link href="/dashboard" className="text-blue-600 hover:underline">← Back to Dashboard</Link>
      <h1 className="text-3xl font-bold">Account Settings</h1>

      {isAdmin && (
        <Link href="/admin" className="text-blue-600 underline block">Go to Admin Dashboard</Link>
      )}

      {/* Section: Subscription Management */}
      <Section
        title="Manage Your Subscription"
        open={sectionsOpen.subscription}
        toggle={() => toggleSection('subscription')}
      >
        <a href="https://billing.stripe.com/p/login/6oE0346eYfk83FCbII"
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-500 block mb-2 w-fit">
          Manage Subscription
        </a>
        {subscriptionStatus?.status === 'active' && (
          <button onClick={() => setShowPauseConfirm(true)}
            className="bg-yellow-600 text-white px-4 py-2 rounded">
            Pause Subscription
          </button>
        )}
        {userData?.paused && (
          <button onClick={handleResume}
            className="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500">
            Resume Subscription
          </button>
        )}
      </Section>

      {/* Section: Email & Password */}
      <Section title="Email & Password" open={sectionsOpen.auth} toggle={() => toggleSection('auth')}>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
          className="w-full border p-2 rounded mb-2" />
        <div className="flex gap-4">
          <button onClick={handleEmailUpdate} className="bg-blue-600 text-white px-4 py-2 rounded">Update Email</button>
          <button onClick={handlePasswordReset} className="bg-gray-600 text-white px-4 py-2 rounded">Reset Password</button>
        </div>
      </Section>

      {/* Section: Business Info */}
      <Section title="Business Info" open={sectionsOpen.business} toggle={() => toggleSection('business')}>
        <input value={businessName} onChange={(e) => setBusinessName(e.target.value)}
          className="w-full border p-2 rounded mb-2" />
        <button onClick={handleBusinessNameUpdate}
          className="bg-green-600 text-white px-4 py-2 rounded">Save Business Name</button>
        {businessMessage && <p className="text-green-600 text-sm mt-2">{businessMessage}</p>}
      </Section>

      {/* Section: Province */}
      <Section title="Province" open={sectionsOpen.province} toggle={() => toggleSection('province')}>
        <p className="text-sm mb-2">Current Province: <strong>{province || 'Not Set'}</strong></p>
        {requestPending ? (
          <p className="text-yellow-700 text-sm">Province change request pending</p>
        ) : (
          <a href="#support-form" className="text-blue-600 underline text-sm">Request Province Change</a>
        )}
      </Section>

      {/* Section: Referral */}
      <Section title="Referral Rewards" open={sectionsOpen.referral} toggle={() => toggleSection('referral')}>
        <p className="text-sm">You have <strong>{credits}</strong> free month{credits !== 1 ? 's' : ''}.</p>
        <p className="text-sm mt-1">Code: <code className="bg-gray-100 px-2 py-1 rounded">{referralCode}</code></p>
        <p className="text-sm mt-1">Link:</p>
        <code className="bg-gray-100 px-2 py-1 rounded block mb-2">https://taxtracker.ca/signup?ref={referralCode}</code>
        <button onClick={handleCopyLink}
          className={`text-white text-sm px-3 py-1 rounded ${copied ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-500'}`}>
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </Section>

      {/* Section: Support */}
      <Section title="Contact Support" open={sectionsOpen.support} toggle={() => toggleSection('support')}>
        <SupportTicketForm />
      </Section>

      <div id="support-form">
        <SupportForm />
      </div>

      {/* Pause confirmation overlay */}
      {showPauseConfirm && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
            <h2 className="text-xl font-bold mb-4">Pause Subscription</h2>
            <p className="text-gray-700 mb-4">
              You'll retain access until the end of the current billing period. Continue?
            </p>
            <div className="flex justify-end gap-4">
              <button onClick={() => setShowPauseConfirm(false)} className="bg-gray-300 px-4 py-2 rounded">Cancel</button>
              <button onClick={async () => { await handlePause(); setShowPauseConfirm(false); }}
                className="bg-yellow-600 text-white px-4 py-2 rounded">Confirm Pause</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, open, toggle, children }) {
  return (
    <div className="border rounded-lg shadow-sm">
      <button onClick={toggle} className="w-full flex justify-between items-center bg-gray-100 px-4 py-2">
        <span className="font-semibold text-left">{title}</span>
        {open ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>
      {open && <div className="px-4 py-3 bg-white">{children}</div>}
    </div>
  );
}
