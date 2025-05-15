// Updated pages/account.jsx with business name + province selector + delete account
import { useEffect, useState } from 'react';
import { auth, db } from '../lib/firebase';
import { sendPasswordResetEmail, updateEmail, deleteUser } from 'firebase/auth';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import Link from 'next/link';
import { getIdToken } from 'firebase/auth';
import { Check } from 'lucide-react';

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
          setProvince(profile.province || '');
          setHasSubscription(!!profile.subscriptionId);
          setCredits(profile.credits || 0);
          setReferralCode(profile.referralCode || '');
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
      setBusinessMessage('Business name saved.');
      setTimeout(() => setBusinessMessage(''), 3000);
    } catch (error) {
      setBusinessMessage('Error saving business name.');
    }
  };

  const handleProvinceUpdate = async () => {
    try {
      const uid = user.uid;
      const profileRef = doc(db, 'users', uid);
      await setDoc(profileRef, { province }, { merge: true });
  
      // ✅ Recalculate estimated tax for each month
      const snapshot = await getDocs(collection(db, 'users', uid, 'months'));
      const { federalRates, federalCredit, provincialData } = await import('../lib/taxRates');
  
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
  
      let priorIncome = 0;
      let priorDeductions = 0;
  
      const sortedMonths = [...snapshot.docs].sort((a, b) => {
        const [monthA, yearA] = a.id.split(' ');
        const [monthB, yearB] = b.id.split(' ');
        const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
        return new Date(`${monthA} 1, ${yearA}`) - new Date(`${monthB} 1, ${yearB}`);
      });
  
      for (const docSnap of sortedMonths) {
        const data = docSnap.data();
        const income = parseFloat(data.income || 0);
        const otherIncome = parseFloat(data.otherIncome || 0);
        const isOtherTaxed = data.otherIncomeTaxed === 'yes';
  
        const adjustedPriorIncome = priorIncome + (isOtherTaxed ? otherIncome : 0);
        const adjustedCurrentOtherIncome = isOtherTaxed ? 0 : otherIncome;
  
        const business = [
          'advertising','meals','badDebts','insurance','interest','businessTax','office','supplies','legal','admin',
          'rent','repairs','salaries','propertyTax','travel','utilities','fuel','delivery','other'
        ].reduce((sum, f) => sum + parseFloat(data[f] || 0), 0);
  
        const home = [
          'homeHeat','homeElectricity','homeInsurance','homeMaintenance','homeMortgage','homePropertyTax'
        ].reduce((sum, f) => sum + parseFloat(data[f] || 0), 0) *
          (parseFloat(data.businessSqft || 0) / parseFloat(data.homeSqft || 1));
  
        const vehicle = [
          'vehicleFuel','vehicleInsurance','vehicleLicense','vehicleRepairs'
        ].reduce((sum, f) => sum + parseFloat(data[f] || 0), 0) *
          (parseFloat(data.businessKms || 0) / parseFloat(data.kmsThisMonth || 1));
  
        const provincial = provincialData[province];
        const taxableBefore = adjustedPriorIncome - priorDeductions;
        const taxableNow = (adjustedPriorIncome + income + adjustedCurrentOtherIncome) - (priorDeductions + business + home + vehicle);
  
        const federalBefore = calculateBracketTax(taxableBefore, federalRates, federalCredit, 0.15);
        const provincialBefore = calculateBracketTax(taxableBefore, provincial.rates, provincial.credit, provincial.rates[0].rate);
        const federalNow = calculateBracketTax(taxableNow, federalRates, federalCredit, 0.15);
        const provincialNow = calculateBracketTax(taxableNow, provincial.rates, provincial.credit, provincial.rates[0].rate);
  
        const estimatedTaxThisMonth = (federalNow + provincialNow) - (federalBefore + provincialBefore);
  
        await setDoc(doc(db, 'users', uid, 'months', docSnap.id), {
          ...data, // ← keep the rest of the month intact
          estimatedTaxThisMonth: Math.round(estimatedTaxThisMonth * 100) / 100,
        });
  
        priorIncome = adjustedPriorIncome + income + adjustedCurrentOtherIncome;
        priorDeductions = priorDeductions + business + home + vehicle;
      }
  
      setMessage('Location updated and tax recalculated.');
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
      {businessMessage && (
        <p className="text-green-600 text-sm mt-2">{businessMessage}</p>
      )}

      <div className="mb-4">
        <label className="block text-sm mb-1">Current Province or Territory</label>
        <select
          value={province}
          onChange={(e) => setProvince(e.target.value)}
          className="w-full border p-2 rounded"
        >
          <option value="">Select...</option>
          {provinces.map((prov) => (
            <option key={prov} value={prov}>{prov}</option>
          ))}
        </select>
      </div>

      <button onClick={handleProvinceUpdate} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-500 mb-6">Save Location</button>
      {provinceMessage && (
        <p className="text-green-600 text-sm mt-2">{provinceMessage}</p>
      )}

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
    </div>
  );
}
