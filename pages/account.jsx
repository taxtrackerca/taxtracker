// Updated pages/account.jsx with business name + province selector + delete account
import { useEffect, useState } from 'react';
import { auth, db } from '../lib/firebase';
import { sendPasswordResetEmail, updateEmail, deleteUser } from 'firebase/auth';
import { collection, getDoc, getDocs, setDoc, deleteDoc, doc, query, where, orderBy, limit } from 'firebase/firestore';
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
  const [userData, setUserData] = useState(null); // 👈 add this line

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
          // Check if user has a pending support request
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
    const handleFocus = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const requestQuery = query(
        collection(db, 'supportRequests'),
        where('email', '==', user.email),
        where('resolved', '==', false),
        orderBy('timestamp', 'desc'),
        limit(1)
      );
      const requestSnap = await getDocs(requestQuery);
      setRequestPending(!requestSnap.empty);
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  useEffect(() => {
    const checkAdmin = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const userRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userRef);
      if (snap.exists() && snap.data().isAdmin === true) {
        setIsAdmin(true);
      }
    };

    auth.onAuthStateChanged(() => checkAdmin());
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
      setBusinessMessage('Business name saved.');
      setTimeout(() => setBusinessMessage(''), 3000);
    } catch (error) {
      setBusinessMessage('Error saving business name.');
    }
  };



  const calculateBracketTax = (income, brackets, credit, creditRate) => {
    let tax = 0;
    let remaining = income;

    for (const bracket of brackets) {
      const slice = Math.min(remaining, bracket.threshold);
      tax += slice * bracket.rate;
      remaining -= slice;
      if (remaining <= 0) break;
    }

    tax -= credit * creditRate;
    return Math.max(tax, 0);
  };

  const handleProvinceUpdate = async () => {
    try {
      const profileRef = doc(db, 'users', user.uid);
      await setDoc(profileRef, { province }, { merge: true });
      setProvinceMessage('Province updated.');

      // Recalculate each month's tax using new province
      const monthDocs = await getDocs(collection(db, 'users', user.uid, 'months'));
      const prov = provincialData[province];
      if (!prov) {
        console.warn('Invalid province:', province);
        setProvinceMessage('Could not find tax data for selected province.');
        return;
      }

      for (const docSnap of monthDocs.docs) {
        const data = docSnap.data();
        if (!data) continue;

        const income = parseFloat(data.income || 0);
        const otherIncome = parseFloat(data.otherIncome || 0);
        const isOtherTaxed = data.otherIncomeTaxed === 'yes';

        const adjustedOther = isOtherTaxed ? 0 : otherIncome;

        const businessExpenses = [
          'advertising', 'meals', 'badDebts', 'insurance', 'interest', 'businessTax', 'office', 'supplies', 'legal', 'admin',
          'rent', 'repairs', 'salaries', 'propertyTax', 'travel', 'utilities', 'fuel', 'delivery', 'other'
        ].reduce((sum, f) => sum + parseFloat(data[f] || 0), 0);

        const homeSqft = parseFloat(data.homeSqft || 0);
        const homeUsePercent = homeSqft > 0 ? parseFloat(data.businessSqft || 0) / homeSqft : 0;
        const homeExpenses = [
          'homeHeat', 'homeElectricity', 'homeInsurance', 'homeMaintenance', 'homeMortgage', 'homePropertyTax'
        ].reduce((sum, f) => sum + parseFloat(data[f] || 0), 0) * homeUsePercent;

        const kmsThisMonth = parseFloat(data.kmsThisMonth || 0);
        const vehicleUsePercent = kmsThisMonth > 0 ? parseFloat(data.businessKms || 0) / kmsThisMonth : 0;
        const vehicleExpenses = [
          'vehicleFuel', 'vehicleInsurance', 'vehicleLicense', 'vehicleRepairs'
        ].reduce((sum, f) => sum + parseFloat(data[f] || 0), 0) * vehicleUsePercent;

        const taxableIncome = Math.max(0, income + adjustedOther - (businessExpenses + homeExpenses + vehicleExpenses));

        const federalTax = calculateBracketTax(taxableIncome, federalRates, federalCredit, 0.15);
        const provincialTax = calculateBracketTax(taxableIncome, prov.rates, prov.credit, prov.rates[0].rate);

        const estimatedTaxThisMonth = federalTax + provincialTax;

        await setDoc(doc(db, 'users', user.uid, 'months', docSnap.id), {
          ...data,
          estimatedTaxThisMonth: Math.round(estimatedTaxThisMonth * 100) / 100
        });
      }

      setTimeout(() => setProvinceMessage(''), 3000);
    } catch (error) {
      setProvinceMessage(error.message);
    }
  };

  const handlePause = async () => {
    try {
      const res = await fetch('/api/pause-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: auth.currentUser.uid }),
      });

      const data = await res.json();
      if (data.success) {
        alert('Subscription pause requested. Access remains active until the end of your current period.');
      } else {
        throw new Error(data.error || 'Pause failed');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while trying to pause the subscription.');
    }
  };

  const handleResume = async () => {
    try {
      const res = await fetch('/api/resume-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: auth.currentUser.uid }),
      });
      if (!res.ok) throw new Error('Resume failed');
      alert('Subscription resumed. You’re back on track!');
      window.location.reload(); // Optional: refresh to reflect changes
    } catch (err) {
      alert('Could not resume subscription.');
      console.error(err);
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

  const handleCopyLink = () => {
    const referralLink = `https://taxtracker.ca/signup?ref=${referralCode}`;
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!user) return null;

  return (
    <div className="p-4 max-w-xl mx-auto">
      <Link href="/dashboard" className="text-blue-600 hover:underline">← Back to Dashboard</Link>

      <h1 className="text-2xl font-bold mb-4 mt-4">Account Settings</h1>

      {isAdmin && (
        <Link href="/admin" className="text-blue-600 hover:underline block mb-4">
          Go to Admin Dashboard
        </Link>
      )}

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

      {subscriptionStatus && subscriptionStatus.status === 'active' && (
        <div className="mt-4">
          <button
            onClick={handlePause}
            className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
          >
            Pause Subscription
          </button>
          <p className="text-sm text-gray-500 mt-1">
            Your access will remain active until the end of your current billing period.
          </p>
        </div>
      )}

      {userData?.paused ? (
        <button onClick={handleResume} className="bg-blue-600 text-white px-4 py-2 rounded">
          Resume Subscription
        </button>
      ) : (
        <button onClick={handlePause} className="bg-yellow-600 text-white px-4 py-2 rounded">
          Pause Subscription
        </button>
      )}

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
      {businessMessage && (
        <p className="text-green-600 text-sm mt-2">{businessMessage}</p>
      )}

      <div className="mb-6">
        <label className="block text-sm mb-1">Current Province or Territory</label>
        <input
          type="text"
          value={province || 'Not Set'}
          readOnly
          className="w-full border p-2 rounded bg-gray-100 text-gray-700 cursor-not-allowed"
        />
        {requestPending && (
          <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-1 rounded">
            Request Sent
          </span>
        )}
        <p className="text-sm text-gray-600 mt-2">
          Need to update your province?{' '}
          <a href="#support-form" className="text-blue-600 underline">
            Submit a request
          </a>
        </p>
      </div>

      <div id="support-form" className="mt-6">
        <SupportForm />
      </div>

      <hr className="my-6" />

      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-2">Referral Rewards</h2>
        <p className="text-gray-700 mb-2">
          You have <strong>{credits}</strong> free month{credits === 1 ? '' : 's'} remaining.
        </p>
        <p className="text-gray-700">
          Your referral code: <code className="bg-gray-100 px-2 py-1 rounded">{referralCode}</code>
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Share this link to earn rewards: <br />
          <code className="bg-gray-100 px-2 py-1 rounded inline-block mt-1">
            https://taxtracker.ca/signup?ref={referralCode}
          </code>
          <button
            onClick={handleCopyLink}
            className={`flex items-center gap-1 text-sm px-3 py-1 rounded transition ${copied ? 'bg-green-600 hover:bg-green-500' : 'bg-blue-600 hover:bg-blue-500'} text-white`}
          >
            {copied ? (
              <>
                <span>Copied</span> <span><Check size={16} /></span>
              </>
            ) : (
              <span>Copy</span>
            )}
          </button>
        </p>
      </div>
      <hr className="my-6" />
      <SupportTicketForm />
    </div>
  );
}
