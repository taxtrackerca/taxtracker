// components/DashboardSummary.jsx
import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
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

  useEffect(() => {
    const fetchSummary = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      setLoading(true);

      const snapshot = await getDocs(collection(db, 'users', uid, 'months'));

      let businessIncome = 0;
      let otherIncome = 0;
      let gstCollected = 0;
      let gstRemitted = 0;
      let business = 0, home = 0, vehicle = 0;
      let totalTax = 0;

      snapshot.forEach((doc) => {
        const data = doc.data();

        businessIncome += parseFloat(data.income || 0);
        if (data.otherIncome && data.otherIncomeTaxed === 'yes') {
          otherIncome += parseFloat(data.otherIncome || 0);
        }

        gstCollected += parseFloat(data.gstCollected || 0);
        gstRemitted += parseFloat(data.gstRemitted || 0);

        business += [
          'advertising','meals','badDebts','insurance','interest','businessTax','office','supplies','legal','admin',
          'rent','repairs','salaries','propertyTax','travel','utilities','fuel','delivery','other'
        ].reduce((sum, f) => sum + parseFloat(data[f] || 0), 0);

        const homeSqft = parseFloat(data.homeSqft || 1);
        const businessSqft = parseFloat(data.businessSqft || 0);
        const homeUsePercent = businessSqft / homeSqft;
        home += [
          'homeHeat','homeElectricity','homeInsurance','homeMaintenance','homeMortgage','homePropertyTax'
        ].reduce((sum, f) => sum + parseFloat(data[f] || 0), 0) * homeUsePercent;

        const kmsThisMonth = parseFloat(data.kmsThisMonth || 1);
        const businessKms = parseFloat(data.businessKms || 0);
        const vehicleUsePercent = businessKms / kmsThisMonth;
        vehicle += [
          'vehicleFuel','vehicleInsurance','vehicleLicense','vehicleRepairs'
        ].reduce((sum, f) => sum + parseFloat(data[f] || 0), 0) * vehicleUsePercent;

        totalTax += parseFloat(data.estimatedTaxThisMonth || 0);
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
