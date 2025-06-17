import { useState } from 'react';
import { useRouter } from 'next/router';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import ProtectedRoute from '../components/ProtectedRoute';

const provinces = [
  'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador',
  'Northwest Territories', 'Nova Scotia', 'Nunavut', 'Ontario',
  'Prince Edward Island', 'Saskatchewan', 'Yukon',
];

export default function AccountSetup() {
  const [businessName, setBusinessName] = useState('');
  const [province, setProvince] = useState('');
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    setSaving(true);
    try {
      await setDoc(doc(db, 'users', user.uid), {
        businessName,
        province,
        trialStart: Date.now(), // ✅ set trialStart when account is created
      }, { merge: true });

      router.push('/dashboard');
    } catch (err) {
      console.error("Error saving account setup:", err);
      setSaving(false);
    }
  };

  return (
    <ProtectedRoute allowIncompleteProfile={true}>
      <div className="max-w-md mx-auto mt-20 p-4 bg-white rounded shadow">
        <h1 className="text-2xl font-bold mb-4">Account Setup</h1>
        <form onSubmit={handleSubmit}>
          <label className="block mb-2">Business Name</label>
          <input
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            required
            className="w-full mb-4 p-2 border border-gray-300 rounded"
          />
          <label className="block mb-2">Province/Territory</label>
          <select
            value={province}
            onChange={(e) => setProvince(e.target.value)}
            required
            className="w-full mb-4 p-2 border border-gray-300 rounded"
          >
            <option value="">Select...</option>
            {provinces.map((prov) => (
              <option key={prov} value={prov}>{prov}</option>
            ))}
          </select>
          <button
            type="submit"
            disabled={saving}
            className={`w-full text-white px-4 py-2 rounded ${
              saving ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {saving ? 'Saving...' : 'Save & Continue'}
          </button>
        </form>
      </div>
    </ProtectedRoute>
  );
}