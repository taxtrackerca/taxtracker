import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc, collection, getDocs, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import IncomeSection from './IncomeSection';
import BusinessExpensesSection from './BusinessExpensesSection';
import HomeExpensesSection from './HomeExpensesSection';
import VehicleExpensesSection from './VehicleExpensesSection';
import { federalRates, federalCredit, provincialData } from '../lib/taxRates';
import LogSection from './LogSection';

export default function MonthTracker({ monthId, onRefresh }) {
  const [data, setData] = useState({});
  const [message, setMessage] = useState('');
  const [ytdKm, setYtdKm] = useState(0);
  const [priorIncome, setPriorIncome] = useState(0);
  const [priorDeductions, setPriorDeductions] = useState(0);
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const [showCheck, setShowCheck] = useState(false);
  const [saveTimeout, setSaveTimeout] = useState(null);
  const [province, setProvince] = useState('Nova Scotia');

  const sumFields = (source, fields) =>
    fields.reduce((t, f) => t + parseFloat(source[f] || 0), 0);

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

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const unsubscribe = onSnapshot(doc(db, 'users', uid), (snap) => {
      if (snap.exists()) {
        const userData = snap.data();
        setProvince(userData.province || 'Nova Scotia');
      }
    });

    const fetchData = async () => {
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

        const business = sumFields(d, ['advertising', 'meals', 'badDebts', 'insurance', 'interest', 'businessTax', 'office', 'supplies', 'legal', 'admin', 'rent', 'repairs', 'salaries', 'propertyTax', 'travel', 'utilities', 'fuel', 'delivery', 'other']);
        const home = sumFields(d, ['homeHeat', 'homeElectricity', 'homeInsurance', 'homeMaintenance', 'homeMortgage', 'homePropertyTax']) * (parseFloat(d.businessSqft || 0) / parseFloat(d.homeSqft || 1));
        const vehicle = sumFields(d, ['vehicleFuel', 'vehicleInsurance', 'vehicleLicense', 'vehicleRepairs']) * (parseFloat(d.businessKms || 0) / parseFloat(d.kmsThisMonth || 1));

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

    return () => unsubscribe();
  }, [monthId]);

  const handleAutoSave = async (updatedData) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const currentIncome = parseFloat(updatedData.income || 0);
    const otherIncome = parseFloat(updatedData.otherIncome || 0);
    const isOtherTaxed = updatedData.otherIncomeTaxed === 'yes';

    const adjustedPriorIncome = priorIncome + (isOtherTaxed ? otherIncome : 0);
    const adjustedCurrentOtherIncome = isOtherTaxed ? 0 : otherIncome;

    const businessExpenses = sumFields(updatedData, ['advertising', 'meals', 'badDebts', 'insurance', 'interest', 'businessTax', 'office', 'supplies', 'legal', 'admin', 'rent', 'repairs', 'salaries', 'propertyTax', 'travel', 'utilities', 'fuel', 'delivery', 'other']);
    const homeUsePercent = parseFloat(updatedData.businessSqft || 0) / parseFloat(updatedData.homeSqft || 1);
    const homeExpenses = sumFields(updatedData, ['homeHeat', 'homeElectricity', 'homeInsurance', 'homeMaintenance', 'homeMortgage', 'homePropertyTax']) * homeUsePercent;
    const vehicleUsePercent = parseFloat(updatedData.businessKms || 0) / parseFloat(updatedData.kmsThisMonth || 1);
    const vehicleExpenses = sumFields(updatedData, ['vehicleFuel', 'vehicleInsurance', 'vehicleLicense', 'vehicleRepairs']) * vehicleUsePercent;

    const taxableBefore = adjustedPriorIncome - priorDeductions;
    const taxableNow = (adjustedPriorIncome + currentIncome + adjustedCurrentOtherIncome) - (priorDeductions + businessExpenses + homeExpenses + vehicleExpenses);

    const provincial = provincialData[province];
    const federalTaxBefore = calculateBracketTax(taxableBefore, federalRates, federalCredit, 0.15);
    const provincialTaxBefore = calculateBracketTax(taxableBefore, provincial.rates, provincial.credit, provincial.rates[0].rate);
    const federalTaxNow = calculateBracketTax(taxableNow, federalRates, federalCredit, 0.15);
    const provincialTaxNow = calculateBracketTax(taxableNow, provincial.rates, provincial.credit, provincial.rates[0].rate);

    const estimatedTaxThisMonth = (federalTaxNow + provincialTaxNow) - (federalTaxBefore + provincialTaxBefore);

    const dataWithTax = {
      ...updatedData,
      estimatedTaxThisMonth: Math.round(estimatedTaxThisMonth * 100) / 100
    };

    await setDoc(doc(db, 'users', uid, 'months', monthId), dataWithTax, { merge: true });

    if (onRefresh) onRefresh();
    setShowCheck(true);
    setTimeout(() => setShowCheck(false), 1500);
  };

  const updateField = (field, value) => {
    setData(prev => {
      const updated = { ...prev, [field]: value };

      if (saveTimeout) clearTimeout(saveTimeout);
      const timeout = setTimeout(async () => {
        await handleAutoSave(updated);
      }, 1000);
      setSaveTimeout(timeout);

      return updated;
    });
  };

  const updateLogs = (logType, newEntries) => {
    setData((prev) => {
      const updatedLogs = { ...prev.logs, [logType]: newEntries };
      const updated = { ...prev, logs: updatedLogs };
  
      if (saveTimeout) clearTimeout(saveTimeout);
      const timeout = setTimeout(() => handleAutoSave(updated), 1000);
      setSaveTimeout(timeout);
  
      return updated;
    });
  };

  const handleSave = async () => {
    await handleAutoSave(data);
    setMessage('Saved!');
    setTimeout(() => setMessage(''), 2000);
  };

  const handleClear = async () => {
    if (!window.confirm('Clear all fields for this month?')) return;
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const clearedData = {
      ...defaultData,
      estimatedTaxThisMonth: 0
    };

    setData(clearedData);
    await setDoc(doc(db, 'users', uid, 'months', monthId), clearedData);

    setMessage('Fields cleared and saved!');
    setTimeout(() => setMessage(''), 2000);
    if (onRefresh) onRefresh();
  };

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
    kmsThisMonth: '', businessKms: '', vehicleFuel: '', vehicleInsurance: '', vehicleLicense: '', vehicleRepairs: '',
    logs: {
      driving: [],
      meal: [],
      travel: [],
      mobilePhone: [],
      inventory: [],
      gift: [],
      misc: []
    }
  };

  const businessExpenses = sumFields(data, ['advertising', 'meals', 'badDebts', 'insurance', 'interest', 'businessTax', 'office', 'supplies', 'legal', 'admin', 'rent', 'repairs', 'salaries', 'propertyTax', 'travel', 'utilities', 'fuel', 'delivery', 'other']);
  const homeUsePercent = parseFloat(data.businessSqft || 0) / parseFloat(data.homeSqft || 1);
  const homeExpenses = sumFields(data, ['homeHeat', 'homeElectricity', 'homeInsurance', 'homeMaintenance', 'homeMortgage', 'homePropertyTax']) * homeUsePercent;
  const vehicleUsePercent = parseFloat(data.businessKms || 0) / parseFloat(data.kmsThisMonth || 1);
  const vehicleExpenses = sumFields(data, ['vehicleFuel', 'vehicleInsurance', 'vehicleLicense', 'vehicleRepairs']) * vehicleUsePercent;
  const currentIncome = parseFloat(data.income || 0);
  const otherIncome = parseFloat(data.otherIncome || 0);
  const isOtherTaxed = data.otherIncomeTaxed === 'yes';
  const adjustedPriorIncome = priorIncome + (isOtherTaxed ? otherIncome : 0);
  const adjustedCurrentOtherIncome = isOtherTaxed ? 0 : otherIncome;
  const taxableBefore = adjustedPriorIncome - priorDeductions;
  const taxableNow = (adjustedPriorIncome + currentIncome + adjustedCurrentOtherIncome) - (priorDeductions + businessExpenses + homeExpenses + vehicleExpenses);
  const provincial = provincialData[province];
  const totalTaxBefore = calculateBracketTax(taxableBefore, federalRates, federalCredit, 0.15) + calculateBracketTax(taxableBefore, provincial.rates, provincial.credit, provincial.rates[0].rate);
  const totalTaxNow = calculateBracketTax(taxableNow, federalRates, federalCredit, 0.15) + calculateBracketTax(taxableNow, provincial.rates, provincial.credit, provincial.rates[0].rate);
  const liveEstimatedTaxThisMonth = totalTaxNow - totalTaxBefore;

  return (
    <div className="bg-white p-4 rounded shadow space-y-4">
      <h2 className="text-xl font-bold">Tracking: {monthId}</h2>

      <IncomeSection data={data} updateField={updateField} />
      <BusinessExpensesSection data={data} updateField={updateField} />
      <HomeExpensesSection data={data} updateField={updateField} />
      <VehicleExpensesSection data={data} updateField={updateField} ytdKm={ytdKm} />
      <LogSection logs={data.logs || {}} updateLogs={updateLogs} />

      <div className="sticky bottom-0 bg-white border-t border-gray-200 shadow z-50">
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex justify-between items-center">
            <p className="font-semibold text-gray-800">
              📊 Estimated Tax Owing (This Month): ${liveEstimatedTaxThisMonth.toFixed(2)}
            </p>
            <button
              onClick={() => setSummaryExpanded(!summaryExpanded)}
              className="text-sm text-blue-600 underline hover:text-blue-800"
            >
              {summaryExpanded ? 'Collapse ▲' : 'Expand Summary ▼'}
            </button>
          </div>

          {showCheck && (
            <div className="mt-2 flex items-center justify-center space-x-2 text-sm text-green-600">
              <span className="text-green-500">✔</span>
              <span>Autosaved</span>
            </div>
          )}

          {summaryExpanded && (
            <div className="mt-4 bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left text-sm text-gray-700">
                <p><strong>Business Income:</strong> ${currentIncome.toFixed(2)}</p>
                <p><strong>Other Income ({isOtherTaxed ? 'already taxed' : 'not yet taxed'}):</strong> ${otherIncome.toFixed(2)}</p>
                <p><strong>Total Expenses:</strong> ${(businessExpenses + homeExpenses + vehicleExpenses).toFixed(2)}</p>
              </div>

              <div className="mt-4 flex flex-col sm:flex-row justify-center gap-4">
                <button
                  onClick={handleSave}
                  className="bg-blue-600 text-white px-6 py-2 rounded-xl font-medium hover:bg-blue-500 transition"
                >
                  Save
                </button>
                <button
                  onClick={handleClear}
                  className="bg-red-600 text-white px-6 py-2 rounded-xl font-medium hover:bg-red-500 transition"
                >
                  Clear All
                </button>
              </div>

              {message && <p className="text-green-600 text-sm mt-2">{message}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
