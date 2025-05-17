// components/AdminDashboard.jsx
import { useState } from 'react';
import { doc, setDoc, getDocs, collection } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { federalRates, federalCredit, provincialData } from '../lib/taxRates';
import AdminSupportRequests from './AdminSupportRequests';
import AdminOverview from './AdminOverview';
import AdminUserLookup from './AdminUserLookup';
import AdminCreditAdjuster from './AdminCreditAdjuster';
import AdminLogs from './AdminLogs';


const provinces = [
  'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador',
  'Northwest Territories', 'Nova Scotia', 'Nunavut', 'Ontario',
  'Prince Edward Island', 'Quebec', 'Saskatchewan', 'Yukon',
];

export default function AdminDashboard() {
  const [email, setEmail] = useState('');
  const [currentProvince, setCurrentProvince] = useState('');
  const [newProvince, setNewProvince] = useState('');
  const [status, setStatus] = useState('');

  const handleFetch = async () => {
    setStatus('');
    const usersSnapshot = await getDocs(collection(db, 'users'));
    let foundUid = null;
    usersSnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.email === email) {
        setCurrentProvince(data.province || '');
        foundUid = docSnap.id;
      }
    });
    if (!foundUid) {
      setStatus('User not found.');
      return null;
    }
    return foundUid;
  };

  const handleUpdate = async () => {
    setStatus('');
    const uid = await handleFetch();
    if (!uid) return;

    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, { province: newProvince }, { merge: true });

    const months = await getDocs(collection(db, 'users', uid, 'months'));
    for (const monthSnap of months.docs) {
      await setDoc(doc(db, 'users', uid, 'months', monthSnap.id), {
        ...monthSnap.data(),
        income: '',
        otherIncome: '',
        otherIncomeTaxed: 'yes',
        gstCollected: '',
        gstRemitted: '',
        advertising: '', meals: '', badDebts: '', insurance: '', interest: '', businessTax: '',
        office: '', supplies: '', legal: '', admin: '', rent: '', repairs: '', salaries: '', propertyTax: '',
        travel: '', utilities: '', fuel: '', delivery: '', other: '',
        homeHeat: '', homeElectricity: '', homeInsurance: '', homeMaintenance: '', homeMortgage: '', homePropertyTax: '',
        homeSqft: '', businessSqft: '',
        kmsThisMonth: '', businessKms: '', vehicleFuel: '', vehicleInsurance: '', vehicleLicense: '', vehicleRepairs: '',
        estimatedTaxThisMonth: 0,
      });
    }

    setStatus(`Province updated to ${newProvince}. All previous data has been cleared.`);
    
    await logEvent({
      userId: uid,
      email,
      type: 'province_change',
      reason: 'Manual admin province update',
      details: { newProvince }
    });
    
    
    setCurrentProvince(newProvince);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-10">
      <AdminOverview />
      <AdminUserLookup />
      <AdminCreditAdjuster />
      <AdminSupportRequests />

      <div className="bg-white border p-4 rounded shadow">
        <h1 className="text-2xl font-bold mb-4">Admin Province Updater</h1>
        <div className="space-y-4">
          <input
            type="email"
            placeholder="User Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded"
          />
          {currentProvince && (
            <p>Current Province: <strong>{currentProvince}</strong></p>
          )}
          <select
            value={newProvince}
            onChange={(e) => setNewProvince(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="">Select New Province</option>
            {provinces.map((prov) => (
              <option key={prov} value={prov}>{prov}</option>
            ))}
          </select>
          <button
            onClick={handleUpdate}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500"
          >
            Update Province
          </button>
          {status && <p className="text-sm text-green-700 mt-2">{status}</p>}
        </div>
      </div>
      <AdminLogs />
    </div>
  );
}
