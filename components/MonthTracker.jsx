import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { federalRates, federalCredit, provincialData } from '../lib/taxRates';
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
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const [showCheck, setShowCheck] = useState(false);
  const [saveTimeout, setSaveTimeout] = useState(null);
  const [province, setProvince] = useState(null);

  useEffect(() => {
    const fetchUserProvince = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        setProvince(userDoc.data().province);
      }
    };
    fetchUserProvince();
  }, []);

  const sumFields = (source, fields) =>
    fields.reduce((t, f) => t + parseFloat(source[f] || 0), 0);

  const applyBrackets = (rates, income) => {
    let remaining = income;
    let tax = 0;
    let previousThreshold = 0;
    for (const { rate, threshold } of rates) {
      const bracketAmount = Math.min(remaining, threshold - previousThreshold);
      if (bracketAmount <= 0) break;
      tax += bracketAmount * rate;
      remaining -= bracketAmount;
      previousThreshold = threshold;
    }
    return tax;
  };

  const calculateCombinedTax = (taxableIncome) => {
    if (!province || !provincialData[province]) return { total: 0 };
    const provRates = provincialData[province].rates;
    const provCredit = provincialData[province].credit;
    const provBaseRate = provRates[0]?.rate || 0;

    const federalTax = applyBrackets(federalRates, taxableIncome) - federalCredit * 0.15;
    const provTax = applyBrackets(provRates, taxableIncome) - provCredit * provBaseRate;

    return { total: Math.max(0, federalTax + provTax) };
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

    const totalTaxBefore = calculateCombinedTax(adjustedPriorIncome - priorDeductions);
    const totalTaxNow = calculateCombinedTax((adjustedPriorIncome + currentIncome + adjustedCurrentOtherIncome) - (priorDeductions + businessExpenses + homeExpenses + vehicleExpenses));
    const estimatedTaxThisMonth = totalTaxNow.total - totalTaxBefore.total;

    const dataWithTax = {
      ...updatedData,
      estimatedTaxThisMonth: Math.round(estimatedTaxThisMonth * 100) / 100
    };

    await setDoc(doc(db, 'users', uid, 'months', monthId), dataWithTax, { merge: true });

    if (onRefresh) onRefresh();
    setShowCheck(true);
    setTimeout(() => setShowCheck(false), 1500);
  };

  // Continue with rendering components and summary display...
}