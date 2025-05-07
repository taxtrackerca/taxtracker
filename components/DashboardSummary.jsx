// components/DashboardSummary.jsx
import { useEffect, useState } from 'react';
import { auth, db } from '../lib/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';

export default function DashboardSummary({ refresh }) {
  const [summary, setSummary] = useState({
    businessIncome: 0,
    otherIncome: 0,
    combinedIncome: 0,
    gstCollected: 0,
    gstRemitted: 0,
    businessExpenses: 0,
    homeExpenses: 0,
    vehicleExpenses: 0
  });
  const [daysLeft, setDaysLeft] = useState(null);

  useEffect(() => {
    const fetchSummary = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      const snapshot = await getDocs(collection(db, 'users', uid, 'months'));
      let businessIncome = 0;
      let otherIncome = 0;
      let gstCollected = 0;
      let gstRemitted = 0;
      let business = 0, home = 0, vehicle = 0;

      snapshot.forEach((doc) => {
        const data = doc.data();

        businessIncome += parseFloat(data.income || 0);
        if (data.otherIncome && data.otherIncomeTaxed === 'yes') {
          otherIncome += parseFloat(data.otherIncome || 0);
        }

        gstCollected += parseFloat(data.gstCollected || 0);
        gstRemitted += parseFloat(data.gstRemitted || 0);

        business += [
          'advertising', 'meals', 'badDebts', 'insurance', 'interest', 'businessTax', 'office', 'supplies', 'legal', 'admin',
          'rent', 'repairs', 'salaries', 'propertyTax', 'travel', 'utilities', 'fuel', 'delivery', 'other'
        ].reduce((sum, f) => sum + parseFloat(data[f] || 0), 0);

        const homeSqft = parseFloat(data.homeSqft || 1);
        const businessSqft = parseFloat(data.businessSqft || 0);
        const homeUsePercent = businessSqft / homeSqft;
        home += [
          'homeHeat', 'homeElectricity', 'homeInsurance', 'homeMaintenance', 'homeMortgage', 'homePropertyTax'
        ].reduce((sum, f) => sum + parseFloat(data[f] || 0), 0) * homeUsePercent;

        const kmsThisMonth = parseFloat(data.kmsThisMonth || 1);
        const businessKms = parseFloat(data.businessKms || 0);
        const vehicleUsePercent = businessKms / kmsThisMonth;
        vehicle += [
          'vehicleFuel', 'vehicleInsurance', 'vehicleLicense', 'vehicleRepairs'
        ].reduce((sum, f) => sum + parseFloat(data[f] || 0), 0) * vehicleUsePercent;
      });

      const combinedIncome = businessIncome + otherIncome;

      setSummary({
        businessIncome,
        otherIncome,
        combinedIncome,
        gstCollected,
        gstRemitted,
        businessExpenses: business,
        homeExpenses: home,
        vehicleExpenses: vehicle
      });
    };

    const fetchSignupDate = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      const profileRef = doc(db, 'users', uid);
      const snap = await getDoc(profileRef);
      if (snap.exists()) {
        const data = snap.data();
        if (data.signupTimestamp?.toDate) {
          const signupDate = data.signupTimestamp.toDate();
          const now = new Date();

          const msPerDay = 24 * 60 * 60 * 1000;
          const daysSinceSignup = Math.floor((now - signupDate) / msPerDay);
          const remaining = Math.max(0, 30 - daysSinceSignup);
          setDaysLeft(remaining);
        }
      }
    };

    fetchSummary();
  }, [refresh]);

  const totalExpenses = summary.businessExpenses + summary.homeExpenses + summary.vehicleExpenses;
  const taxableIncome = summary.combinedIncome - totalExpenses;

  const calculateNSTax = (income) => {
    let tax = 0;
    const brackets = [
      { max: 30507, rate: 0.2379 }, { max: 57375, rate: 0.2995 }, { max: 61015, rate: 0.3545 },
      { max: 95883, rate: 0.3717 }, { max: 114750, rate: 0.38 }, { max: 154650, rate: 0.435 },
      { max: 177882, rate: 0.47 }
    ];
    let remaining = income;
    let previousMax = 0;

    for (const { max, rate } of brackets) {
      if (remaining <= 0) break;
      const range = max - previousMax;
      const slice = Math.min(remaining, range);
      tax += slice * rate;
      remaining -= slice;
      previousMax = max;
    }

    if (remaining > 0) {
      tax += remaining * 0.47;
    }

    return tax;
  };

  const taxOwing = calculateNSTax(taxableIncome);

  return (
    <div className="bg-gray-100 p-4 rounded shadow">
      {daysLeft > 0 && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 mb-4 rounded">
          Your free trial ends in <strong>{daysLeft}</strong> day{daysLeft !== 1 && 's'}.
        </div>
      )}
      <h2 className="text-xl font-semibold mb-2">Year-to-Date Summary</h2>
      <ul className="text-gray-800 space-y-1">
        <li>Total Business Income: ${summary.businessIncome.toFixed(2)}</li>
        <li>Total Other Income (already taxed): ${summary.otherIncome.toFixed(2)}</li>
        <li className="font-bold">Combined Income: ${summary.combinedIncome.toFixed(2)}</li>
        <li>Total Claimable Expenses: ${totalExpenses.toFixed(2)}</li>
        <li>
          Estimated Tax Owing (NS): ${taxOwing.toFixed(2)}
          <span
            title={`2025 Nova Scotia + Federal combined brackets:
0–$30,507: 23.79%
$30,508–$57,375: 29.95%
$57,376–$61,015: 35.45%
$61,016–$95,883: 37.17%
$95,884–$114,750: 38%
$114,751–$154,650: 43.5%
$154,651+: 47%`}
            className="ml-2 text-blue-500 cursor-help"
          >
            ℹ️
          </span>
        </li>
        <li>GST Collected: ${summary.gstCollected.toFixed(2)}</li>
        <li>GST Remitted: ${summary.gstRemitted.toFixed(2)}</li>
      </ul>
    </div>
  );
}