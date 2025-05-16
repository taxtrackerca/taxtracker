// components/AdminDashboard.jsx
import { useState } from 'react';
import { doc, setDoc, getDoc, getDocs, collection } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { federalRates, federalCredit, provincialData } from '../lib/taxRates';
import AdminSupportRequests from './AdminSupportRequests';

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
    const provData = provincialData[newProvince];

    for (const monthSnap of months.docs) {
      const data = monthSnap.data();
      const income = parseFloat(data.income || 0);
      const otherIncome = parseFloat(data.otherIncome || 0);
      const isOtherTaxed = data.otherIncomeTaxed === 'yes';
      const adjustedOther = isOtherTaxed ? 0 : otherIncome;

      const business = [
        'advertising','meals','badDebts','insurance','interest','businessTax','office','supplies','legal','admin',
        'rent','repairs','salaries','propertyTax','travel','utilities','fuel','delivery','other'
      ].reduce((sum, f) => sum + parseFloat(data[f] || 0), 0);

      const homeUse = parseFloat(data.businessSqft || 0) / parseFloat(data.homeSqft || 1);
      const home = ['homeHeat','homeElectricity','homeInsurance','homeMaintenance','homeMortgage','homePropertyTax']
        .reduce((sum, f) => sum + parseFloat(data[f] || 0), 0) * homeUse;

      const vehicleUse = parseFloat(data.businessKms || 0) / parseFloat(data.kmsThisMonth || 1);
      const vehicle = ['vehicleFuel','vehicleInsurance','vehicleLicense','vehicleRepairs']
        .reduce((sum, f) => sum + parseFloat(data[f] || 0), 0) * vehicleUse;

      const taxable = income + adjustedOther - (business + home + vehicle);
      const fed = calculateBracketTax(taxable, federalRates, federalCredit, 0.15);
      const prov = calculateBracketTax(taxable, provData.rates, provData.credit, provData.rates[0].rate);
      const estimate = Math.round((fed + prov) * 100) / 100;

      await setDoc(doc(db, 'users', uid, 'months', monthSnap.id), {
        ...data,
        estimatedTaxThisMonth: estimate
      });
    }

    setStatus(`Province updated to ${newProvince} and tax recalculated.`);
    setCurrentProvince(newProvince);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-10">
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
    </div>
  );
}
