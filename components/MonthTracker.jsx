
// MonthTracker.jsx - Full version with income/expense fields + working tax breakdown + fixed logic
import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import IncomeSection from './IncomeSection';
import BusinessExpensesSection from './BusinessExpensesSection';
import HomeExpensesSection from './HomeExpensesSection';
import VehicleExpensesSection from './VehicleExpensesSection';

export default function MonthTracker({ monthId, onRefresh }) {
  const [data, setData] = useState({});
  const [message, setMessage] = useState('');
  const [ytdKm, setYtdKm] = useState(0);
  const [priorIncome, setPriorIncome] = useState(0);
  const [priorDeductions, setPriorDeductions] = useState(0);
  const [showBreakdown, setShowBreakdown] = useState(false);

  const defaultData = {
    income: '',
    otherIncome: '',
    otherIncomeTaxed: 'yes',
    gstCollected: '', gstRemitted: '',
    advertising: '', meals: '', badDebts: '', insurance: '', interest: '', businessTax: '',
    office: '', supplies: '', legal: '', admin: '', rent: '', repairs: '', salaries: '', propertyTax: '',
    travel: '', utilities: '', fuel: '', delivery: '', other: '',
    homeHeat: '', homeElectricity: '', homeInsurance: '', homeMaintenance: '', homeMortgage: '', homePropertyTax: '',
    homeSqft: '', businessSqft: '',
    kmsThisMonth: '', businessKms: '', vehicleFuel: '', vehicleInsurance: '', vehicleLicense: '', vehicleRepairs: ''
  };

  useEffect(() => {
    const fetchData = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      setData({ ...defaultData });

      const ref = doc(db, 'users', uid, 'months', monthId);
      const snap = await getDoc(ref);
      if (snap.exists()) setData(snap.data());

      const allMonths = await getDocs(collection(db, 'users', uid, 'months'));

      const monthOrder = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const [selectedMonth, selectedYear] = monthId.split(' ');
      const selectedMonthIndex = monthOrder.indexOf(selectedMonth);

      let incomeUpToLastMonth = 0, deductionsUpToLastMonth = 0, kmYTD = 0, priorOtherIncomeTaxed = 0;

      allMonths.forEach(docSnap => {
        const id = docSnap.id;
        const [month, year] = id.split(' ');
        if (year !== selectedYear) return;
        const idx = monthOrder.indexOf(month);
        if (idx >= selectedMonthIndex) return;

        const d = docSnap.data();
        incomeUpToLastMonth += parseFloat(d.income || 0);

        const business = ['advertising', 'meals', 'badDebts', 'insurance', 'interest', 'businessTax', 'office', 'supplies', 'legal', 'admin', 'rent', 'repairs', 'salaries', 'propertyTax', 'travel', 'utilities', 'fuel', 'delivery', 'other'].reduce((sum, f) => sum + parseFloat(d[f] || 0), 0);
        const home = ['homeHeat', 'homeElectricity', 'homeInsurance', 'homeMaintenance', 'homeMortgage', 'homePropertyTax'].reduce((sum, f) => sum + parseFloat(d[f] || 0), 0) * (parseFloat(d.businessSqft || 0) / parseFloat(d.homeSqft || 1));
        const vehicle = ['vehicleFuel', 'vehicleInsurance', 'vehicleLicense', 'vehicleRepairs'].reduce((sum, f) => sum + parseFloat(d[f] || 0), 0) * (parseFloat(d.businessKms || 0) / parseFloat(d.kmsThisMonth || 1));

        deductionsUpToLastMonth += business + home + vehicle;
        kmYTD += parseFloat(d.businessKms || 0);

        if (d.otherIncome && d.otherIncomeTaxed === 'yes') {
          priorOtherIncomeTaxed += parseFloat(d.otherIncome || 0);
        }
      });

      setPriorIncome(incomeUpToLastMonth + priorOtherIncomeTaxed);
      setPriorDeductions(deductionsUpToLastMonth);
      setYtdKm(kmYTD);
    };

    fetchData();
  }, [monthId]);

  const updateField = (field, value) => setData(prev => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    await setDoc(doc(db, 'users', uid, 'months', monthId), data, { merge: true });
    setMessage('Saved!');
    setTimeout(() => setMessage(''), 2000);
    if (onRefresh) onRefresh();
  };

  const handleClear = async () => {
    if (!window.confirm('Clear all fields for this month?')) return;
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    setData({ ...defaultData });
    await setDoc(doc(db, 'users', uid, 'months', monthId), defaultData);
    setMessage('Fields cleared and saved!');
    setTimeout(() => setMessage(''), 2000);
    if (onRefresh) onRefresh();
  };

  const sum = (...fields) => fields.reduce((t, f) => t + parseFloat(data[f] || 0), 0);
  const businessExpenses = sum('advertising', 'meals', 'badDebts', 'insurance', 'interest', 'businessTax', 'office', 'supplies', 'legal', 'admin', 'rent', 'repairs', 'salaries', 'propertyTax', 'travel', 'utilities', 'fuel', 'delivery', 'other');
  const homeUsePercent = parseFloat(data.businessSqft || 0) / parseFloat(data.homeSqft || 1);
  const homeExpenses = sum('homeHeat', 'homeElectricity', 'homeInsurance', 'homeMaintenance', 'homeMortgage', 'homePropertyTax') * homeUsePercent;
  const vehicleUsePercent = parseFloat(data.businessKms || 0) / parseFloat(data.kmsThisMonth || 1);
  const vehicleExpenses = sum('vehicleFuel', 'vehicleInsurance', 'vehicleLicense', 'vehicleRepairs') * vehicleUsePercent;

  const currentIncome = parseFloat(data.income || 0);
  const otherIncome = parseFloat(data.otherIncome || 0);
  const isOtherTaxed = data.otherIncomeTaxed === 'yes';

  const adjustedPriorIncome = priorIncome + (isOtherTaxed ? otherIncome : 0);
  const adjustedCurrentOtherIncome = isOtherTaxed ? 0 : otherIncome;

  const calculateNSTax = (taxableIncome) => {
    let tax = 0;
    const details = [];
    const brackets = [
      { max: 30507, rate: 0.2379 },
      { max: 57375, rate: 0.2995 },
      { max: 61015, rate: 0.3545 },
      { max: 95883, rate: 0.3717 },
      { max: 114750, rate: 0.38 },
      { max: 154650, rate: 0.435 },
      { max: 177882, rate: 0.47 }
    ];
    let remaining = taxableIncome, previousMax = 0;
    for (const { max, rate } of brackets) {
      const range = max - previousMax;
      const slice = Math.min(remaining, range);
      if (slice <= 0) break;
      tax += slice * rate;
      details.push({ rate, amount: slice, tax: slice * rate });
      remaining -= slice;
      previousMax = max;
    }
    if (remaining > 0) {
      tax += remaining * 0.47;
      details.push({ rate: 0.47, amount: remaining, tax: remaining * 0.47 });
    }
    return { total: tax, details };
  };

  const totalTaxBefore = calculateNSTax(adjustedPriorIncome - priorDeductions);
  const totalTaxNow = calculateNSTax((adjustedPriorIncome + currentIncome + adjustedCurrentOtherIncome) - (priorDeductions + businessExpenses + homeExpenses + vehicleExpenses));
  const estimatedTaxThisMonth = totalTaxNow.total - totalTaxBefore.total;

  return (
    <div className="bg-white p-4 rounded shadow space-y-4">
      <h2 className="text-xl font-bold">Tracking: {monthId}</h2>

      <IncomeSection data={data} updateField={updateField} />

      <BusinessExpensesSection data={data} updateField={updateField} />

      <HomeExpensesSection data={data} updateField={updateField} />

      <VehicleExpensesSection data={data} updateField={updateField} ytdKm={ytdKm} />

      {/* Summary */}
      <div className="border-t pt-4">
        <h4 className="text-lg font-semibold mb-2">Monthly Summary</h4>
        <p>Total Business Income: ${currentIncome.toFixed(2)}</p>
        <p>Other Income ({isOtherTaxed ? 'already taxed' : 'not yet taxed'}): ${otherIncome.toFixed(2)}</p>
        <p>Total Expenses: ${(businessExpenses + homeExpenses + vehicleExpenses).toFixed(2)}</p>
        <p>Estimated Tax Owing (This Month): ${estimatedTaxThisMonth.toFixed(2)}</p>

        <button onClick={() => setShowBreakdown(!showBreakdown)} className="text-blue-600 text-sm hover:underline mt-2">
          {showBreakdown ? 'Hide' : 'Show'} Tax Breakdown
        </button>

        {showBreakdown && (
          <div className="mt-2 bg-gray-100 p-2 rounded text-sm">
            {totalTaxNow.details.map((b, i) => (
              <p key={i}>${b.amount.toFixed(2)} @ {(b.rate * 100).toFixed(2)}% = ${b.tax.toFixed(2)}</p>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-4">
        <button onClick={handleSave} className="bg-blue-600 text-white px-4 py-2 rounded">Save</button>
        <button onClick={handleClear} className="bg-red-500 text-white px-4 py-2 rounded">Clear All</button>
        {message && <span className="text-green-600 mt-2">{message}</span>}
      </div>
    </div>
  );
}
