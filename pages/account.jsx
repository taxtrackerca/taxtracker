// pages/account.jsx
import { useEffect, useState } from 'react';
import { auth, db } from '../lib/firebase';
import { sendPasswordResetEmail, updateEmail, deleteUser } from 'firebase/auth';
import { collection, getDoc, getDocs, setDoc, deleteDoc, doc } from 'firebase/firestore';
import Link from 'next/link';
import { getIdToken } from 'firebase/auth';
import { Check } from 'lucide-react';
import { provincialData, federalRates, federalCredit } from '../lib/taxRates';

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
      alert('Email updated successfully.');
    } catch (error) {
      alert(error.message);
    }
  };

  const handlePasswordReset = async () => {
    try {
      await sendPasswordResetEmail(auth, email);
      alert('Password reset email sent.');
    } catch (error) {
      alert(error.message);
    }
  };

  const handleBusinessNameUpdate = async () => {
    try {
      const profileRef = doc(db, 'users', user.uid);
      await setDoc(profileRef, { businessName }, { merge: true });
      setBusinessMessage('Business name saved.');
      setTimeout(() => setBusinessMessage(''), 3000);
    } catch {
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

      const prov = provincialData[province];
      if (!prov) {
        setProvinceMessage('Province data not found.');
        return;
      }

      const monthDocs = await getDocs(collection(db, 'users', user.uid, 'months'));
      for (const docSnap of monthDocs.docs) {
        const data = docSnap.data();
        if (!data) continue;

        const income = parseFloat(data.income || 0);
        const otherIncome = parseFloat(data.otherIncome || 0);
        const isOtherTaxed = data.otherIncomeTaxed === 'yes';
        const adjustedOther = isOtherTaxed ? 0 : otherIncome;

        const businessExpenses = [
          'advertising','meals','badDebts','insurance','interest','businessTax','office','supplies','legal','admin',
          'rent','repairs','salaries','propertyTax','travel','utilities','fuel','delivery','other'
        ].reduce((sum, f) => sum + parseFloat(data[f] || 0), 0);

        const homeSqft = parseFloat(data.homeSqft || 0);
        const homeUsePercent = homeSqft > 0 ? parseFloat(data.businessSqft || 0) / homeSqft : 0;
        const homeExpenses = [
          'homeHeat','homeElectricity','homeInsurance','homeMaintenance','homeMortgage','homePropertyTax'
        ].reduce((sum, f) => sum + parseFloat(data[f] || 0), 0) * homeUsePercent;

        const kmsThisMonth = parseFloat(data.kmsThisMonth || 0);
        const vehicleUsePercent = kmsThisMonth > 0 ? parseFloat(data.businessKms || 0) / kmsThisMonth : 0;
        const vehicleExpenses = [
          'vehicleFuel','vehicleInsurance','vehicleLicense','vehicleRepairs'
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

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This cannot be undone.')) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid));
      await deleteUser(user);
      alert('Account deleted.');
      window.location.href = '/login';
    } catch (error) {
      alert(error.message);
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

      <div className="mb-4">
        <label className="block text-sm mb-1">Business Name</label>
        <input type="text" value={businessName} onChange={e => setBusinessName(e.target.value)} className="w-full border p-2 rounded" />
        <button onClick={handleBusinessNameUpdate} className="bg-green-600 text-white px-4 py-2 rounded mt-2 hover:bg-green-500">Save</button>
        {businessMessage && <p className="text-green-600 text-sm mt-1">{businessMessage}</p>}
      </div>

      <div className="mb-4">
        <label className="block text-sm mb-1">Province or Territory</label>
        <select value={province} onChange={e => setProvince(e.target.value)} className="w-full border p-2 rounded">
          <option value="">Select...</option>
          {provinces.map((prov) => <option key={prov} value={prov}>{prov}</option>)}
        </select>
        <button onClick={handleProvinceUpdate} className="bg-green-600 text-white px-4 py-2 rounded mt-2 hover:bg-green-500">Save</button>
        {provinceMessage && <p className="text-green-600 text-sm mt-1">{provinceMessage}</p>}
      </div>

      <hr className="my-6" />

      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <h2 className="text-lg font-semibold mb-2">Referral Rewards</h2>
        <p>You have <strong>{credits}</strong> free month{credits === 1 ? '' : 's'} remaining.</p>
        <p className="mt-1">Referral code: <code className="bg-gray-100 px-2 py-1 rounded">{referralCode}</code></p>
        <p className="mt-1 text-sm text-gray-600">Share this link: <br /><code className="bg-gray-100 px-2 py-1 rounded inline-block mt-1">https://taxtracker.ca/signup?ref={referralCode}</code></p>
        <button onClick={handleCopyLink} className={`mt-2 ${copied ? 'bg-green-600' : 'bg-blue-600'} text-white px-3 py-1 rounded`}>{copied ? 'Copied!' : 'Copy'}</button>
      </div>
    </div>
  );
}
