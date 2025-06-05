// components/ExportSummaryCSV.jsx
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export default function ExportSummaryCSV() {
  const exportCSV = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const uid = user.uid;
    const profileSnap = await getDoc(doc(db, 'users', uid));
    const businessName = profileSnap.exists() ? profileSnap.data().businessName || 'TaxTracker' : 'TaxTracker';
    const safeBusinessName = businessName.replace(/\s+/g, '_').replace(/[^\w\-]/g, '');

    const snapshot = await getDocs(collection(db, 'users', uid, 'months'));

    const categories = [
      'advertising', 'meals', 'badDebts', 'insurance', 'interest', 'businessTax', 'office', 'supplies', 'legal', 'admin',
      'rent', 'repairs', 'salaries', 'propertyTax', 'travel', 'utilities', 'fuel', 'delivery', 'other'
    ];

    let csv = `${businessName} Summary Export\nExported: ${new Date().toLocaleDateString()}\n\n`;

    csv += 'Month,Income,GST Collected,GST Remitted,Business Expenses,Home Use,Vehicle Use,Total Expenses\n';

    let totalIncome = 0;
    let totalGSTCollected = 0;
    let totalGSTRemitted = 0;
    let totalBusiness = 0;
    let totalHome = 0;
    let totalVehicle = 0;
    let totalAllExpenses = 0;

    const categoryTotals = {};
    categories.forEach(cat => categoryTotals[cat] = 0);

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const month = docSnap.id;

      const income = parseFloat(data.income || 0);
      const gstCollected = parseFloat(data.gstCollected || 0);
      const gstRemitted = parseFloat(data.gstRemitted || 0);

      let business = 0;
      categories.forEach(cat => {
        const val = parseFloat(data[cat] || 0);
        business += val;
        categoryTotals[cat] += val;
      });

      const homePct = data.homeSqft > 0 ? parseFloat(data.businessSqft || 0) / data.homeSqft : 0;
      const home = [
        'homeHeat', 'homeElectricity', 'homeInsurance', 'homeMaintenance', 'homeMortgage', 'homePropertyTax'
      ].reduce((sum, f) => sum + parseFloat(data[f] || 0), 0) * homePct;

      const vehiclePct = data.kmsThisMonth > 0 ? parseFloat(data.businessKms || 0) / data.kmsThisMonth : 0;
      const vehicle = [
        'vehicleFuel', 'vehicleInsurance', 'vehicleLicense', 'vehicleRepairs'
      ].reduce((sum, f) => sum + parseFloat(data[f] || 0), 0) * vehiclePct;

      const total = business + home + vehicle;

      totalIncome += income;
      totalGSTCollected += gstCollected;
      totalGSTRemitted += gstRemitted;
      totalBusiness += business;
      totalHome += home;
      totalVehicle += vehicle;
      totalAllExpenses += total;

      csv += `${month},${income.toFixed(2)},${gstCollected.toFixed(2)},${gstRemitted.toFixed(2)},${business.toFixed(2)},${home.toFixed(2)},${vehicle.toFixed(2)},${total.toFixed(2)}\n`;
    });

    csv += `\nTOTALS,${totalIncome.toFixed(2)},${totalGSTCollected.toFixed(2)},${totalGSTRemitted.toFixed(2)},${totalBusiness.toFixed(2)},${totalHome.toFixed(2)},${totalVehicle.toFixed(2)},${totalAllExpenses.toFixed(2)}\n\n`;

    csv += 'Category,Year-End Total\n';
    categories.forEach(cat => {
      const label = cat.charAt(0).toUpperCase() + cat.slice(1);
      csv += `${label},${categoryTotals[cat].toFixed(2)}\n`;
    });
    csv += `Home Use Total,${totalHome.toFixed(2)}\n`;
    csv += `Vehicle Use Total,${totalVehicle.toFixed(2)}\n`;

    // Filename
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `${safeBusinessName}_Summary_${dateStr}.csv`;

    // Download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button onClick={exportCSV} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-500">
      Export CSV
    </button>
  );
}