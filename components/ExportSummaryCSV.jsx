import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export default function ExportSummaryCSV() {
  const exportCSV = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const uid = user.uid;
    const monthsRef = collection(db, 'users', uid, 'months');
    const snapshot = await getDocs(monthsRef);

    const userDoc = await getDoc(doc(db, 'users', uid));
    const businessName = userDoc.exists() ? userDoc.data().businessName || 'TaxTracker' : 'TaxTracker';

    const headers = [
      'Month',
      'Income',
      'GST Collected',
      'GST Remitted',
      'Business Expenses',
      'Home Use',
      'Vehicle Use',
      'Total Expenses',
    ];
    let csv = headers.join(',') + '\n';

    const businessFields = [
      'advertising', 'meals', 'badDebts', 'insurance', 'interest', 'businessTax', 'office',
      'supplies', 'legal', 'admin', 'rent', 'repairs', 'salaries', 'propertyTax',
      'travel', 'utilities', 'fuel', 'delivery', 'other'
    ];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const income = parseFloat(data.income || 0);
      const gstCollected = parseFloat(data.gstCollected || 0);
      const gstRemitted = parseFloat(data.gstRemitted || 0);

      const businessExpenses = businessFields.reduce((sum, field) => sum + parseFloat(data[field] || 0), 0);

      const homePct = data.homeSqft > 0 ? parseFloat(data.businessSqft || 0) / data.homeSqft : 0;
      const homeUse = [
        'homeHeat', 'homeElectricity', 'homeInsurance', 'homeMaintenance', 'homeMortgage', 'homePropertyTax'
      ].reduce((sum, field) => sum + parseFloat(data[field] || 0), 0) * homePct;

      const vehiclePct = data.kmsThisMonth > 0 ? parseFloat(data.businessKms || 0) / data.kmsThisMonth : 0;
      const vehicleUse = [
        'vehicleFuel', 'vehicleInsurance', 'vehicleLicense', 'vehicleRepairs'
      ].reduce((sum, field) => sum + parseFloat(data[field] || 0), 0) * vehiclePct;

      const totalExpenses = businessExpenses + homeUse + vehicleUse;

      const row = [
        docSnap.id,
        income.toFixed(2),
        gstCollected.toFixed(2),
        gstRemitted.toFixed(2),
        businessExpenses.toFixed(2),
        homeUse.toFixed(2),
        vehicleUse.toFixed(2),
        totalExpenses.toFixed(2),
      ];

      csv += row.map((v) => `"${v}"`).join(',') + '\n';
    });

    const today = new Date().toISOString().split('T')[0];
    const safeName = businessName.replace(/\s+/g, '_').replace(/[^\w\-]/g, '');
    const filename = `${safeName}_Summary_${today}.csv`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={exportCSV}
      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-500"
    >
      Export CSV
    </button>
  );
}