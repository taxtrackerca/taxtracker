import { useEffect, useState } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { federalRates, federalCredit, provincialData } from '../lib/taxRates';
import { Loader } from 'lucide-react';

export default function DashboardSummary({ refresh }) {
  const [summary, setSummary] = useState({
    businessIncome: 0,
    otherIncome: 0,
    combinedIncome: 0,
    gstCollected: 0,
    gstRemitted: 0,
    businessExpenses: 0,
    homeExpenses: 0,
    vehicleExpenses: 0,
    totalEstimatedTax: 0
  });

  const [loading, setLoading] = useState(true);

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
    const fetchSummary = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      setLoading(true);

      const userDoc = await getDoc(doc(db, 'users', uid));
      const userData = userDoc.data();
      const province = userData?.province || 'Nova Scotia';
      const prov = provincialData[province];

      const snapshot = await getDocs(collection(db, 'users', uid, 'months'));

      let businessIncome = 0;
      let otherIncome = 0;
      let gstCollected = 0;
      let gstRemitted = 0;
      let business = 0, home = 0, vehicle = 0;
      let totalTax = 0;

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();

        const income = parseFloat(data.income || 0);
        const other = parseFloat(data.otherIncome || 0);
        const isOtherTaxed = data.otherIncomeTaxed === 'yes';
        const adjustedOther = isOtherTaxed ? 0 : other;

        businessIncome += income;
        if (isOtherTaxed) otherIncome += other;

        gstCollected += parseFloat(data.gstCollected || 0);
        gstRemitted += parseFloat(data.gstRemitted || 0);

        const businessExpenses = [
          'advertising','meals','badDebts','insurance','interest','businessTax','office','supplies','legal','admin',
          'rent','repairs','salaries','propertyTax','travel','utilities','fuel','delivery','other'
        ].reduce((sum, f) => sum + parseFloat(data[f] || 0), 0);

        const homeUsePercent = parseFloat(data.businessSqft || 0) / parseFloat(data.homeSqft || 1);
        const homeExpenses = [
          'homeHeat','homeElectricity','homeInsurance','homeMaintenance','homeMortgage','homePropertyTax'
        ].reduce((sum, f) => sum + parseFloat(data[f] || 0), 0) * homeUsePercent;

        const vehicleUsePercent = parseFloat(data.businessKms || 0) / parseFloat(data.kmsThisMonth || 1);
        const vehicleExpenses = [
          'vehicleFuel','vehicleInsurance','vehicleLicense','vehicleRepairs'
        ].reduce((sum, f) => sum + parseFloat(data[f] || 0), 0) * vehicleUsePercent;

        const totalExpenses = businessExpenses + homeExpenses + vehicleExpenses;
        const taxable = income + adjustedOther - totalExpenses;

        const federalTax = calculateBracketTax(taxable, federalRates, federalCredit, 0.15);
        const provincialTax = calculateBracketTax(taxable, prov.rates, prov.credit, prov.rates[0].rate);

        totalTax += federalTax + provincialTax;

        business += businessExpenses;
        home += homeExpenses;
        vehicle += vehicleExpenses;
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
        vehicleExpenses: vehicle,
        totalEstimatedTax: totalTax
      });

      setLoading(false);
    };

    fetchSummary();
  }, [refresh]);

  const totalExpenses = summary.businessExpenses + summary.homeExpenses + summary.vehicleExpenses;

  return (
    <div className="bg-gray-100 p-4 rounded shadow">
      <h2 className="text-xl font-semibold mb-2">Year-to-Date Summary</h2>
      {loading ? (
        <div className="flex items-center justify-center py-10 text-gray-500">
          <Loader className="animate-spin w-6 h-6 mr-2" />
          Loading summary...
        </div>
      ) : (
        <ul className="text-gray-800 space-y-1">
          <li>Total Business Income: ${summary.businessIncome.toFixed(2)}</li>
          <li>Total Other Income (already taxed): ${summary.otherIncome.toFixed(2)}</li>
          <li className="font-bold">Combined Income: ${summary.combinedIncome.toFixed(2)}</li>
          <li>Total Claimable Expenses: ${totalExpenses.toFixed(2)}</li>
          <li className="font-bold text-red-600">Estimated Tax Owing (YTD): ${summary.totalEstimatedTax.toFixed(2)}</li>
          <li>GST Collected: ${summary.gstCollected.toFixed(2)}</li>
          <li>GST Remitted: ${summary.gstRemitted.toFixed(2)}</li>
        </ul>
      )}
    </div>
  );
}