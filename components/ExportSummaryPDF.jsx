// Simplified ExportSummaryPDF.jsx with monthly expense summaries and year-end totals
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useEffect, useState } from 'react';
import { auth, db } from '../lib/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';

export default function ExportSummaryPDF() {
  const [userId, setUserId] = useState(null);
  const [businessName, setBusinessName] = useState('');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUserId(user.uid);
        const profileRef = doc(db, 'users', user.uid);
        const snap = await getDoc(profileRef);
        if (snap.exists()) {
          setBusinessName(snap.data().businessName || '');
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const handleExport = async () => {
    if (!userId) return;

    const monthsRef = collection(db, 'users', userId, 'months');
    const snapshot = await getDocs(monthsRef);
    const categories = [
      'advertising','meals','badDebts','insurance','interest','businessTax','office','supplies','legal','admin',
      'rent','repairs','salaries','propertyTax','travel','utilities','fuel','delivery','other'
    ];

    let totalIncome = 0;
    let totalGSTCollected = 0;
    let totalGSTRemitted = 0;
    let totalAllExpenses = 0;
    let totalHome = 0;
    let totalVehicle = 0;
    const expenseTotals = {};
    categories.forEach(cat => expenseTotals[cat] = 0);

    const monthSummaries = [];

    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const month = docSnap.id;
      const income = parseFloat(data.income || 0);
      const gstCollected = parseFloat(data.gstCollected || 0);
      const gstRemitted = parseFloat(data.gstRemitted || 0);

      let monthBusiness = 0;
      categories.forEach(cat => {
        const val = parseFloat(data[cat] || 0);
        monthBusiness += val;
        expenseTotals[cat] += val;
      });

      const homePct = parseFloat(data.businessSqft || 0) / parseFloat(data.homeSqft || 1);
      const home = [
        'homeHeat','homeElectricity','homeInsurance','homeMaintenance','homeMortgage','homePropertyTax'
      ].reduce((sum, f) => sum + parseFloat(data[f] || 0), 0) * homePct;

      const vehiclePct = parseFloat(data.businessKms || 0) / parseFloat(data.kmsThisMonth || 1);
      const vehicle = [
        'vehicleFuel','vehicleInsurance','vehicleLicense','vehicleRepairs'
      ].reduce((sum, f) => sum + parseFloat(data[f] || 0), 0) * vehiclePct;

      const totalExpenses = monthBusiness + home + vehicle;

      monthSummaries.push([
        month,
        `$${income.toFixed(2)}`,
        `$${gstCollected.toFixed(2)}`,
        `$${gstRemitted.toFixed(2)}`,
        `$${monthBusiness.toFixed(2)}`,
        `$${home.toFixed(2)}`,
        `$${vehicle.toFixed(2)}`,
        `$${totalExpenses.toFixed(2)}`
      ]);

      totalIncome += income;
      totalGSTCollected += gstCollected;
      totalGSTRemitted += gstRemitted;
      totalHome += home;
      totalVehicle += vehicle;
      totalAllExpenses += totalExpenses;
    });

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(businessName || 'Business Summary Report', 14, 20);
    doc.setFontSize(12);
    doc.text(`Exported: ${new Date().toLocaleDateString()}`, 14, 28);

    autoTable(doc, {
      startY: 35,
      head: [['Month', 'Income', 'GST Collected', 'GST Remitted', 'Business Expenses', 'Home Use', 'Vehicle Use', 'Total Expenses']],
      body: monthSummaries
    });

    const totalsList = categories.map(cat => [cat.charAt(0).toUpperCase() + cat.slice(1), `$${expenseTotals[cat].toFixed(2)}`]);

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [['Expense Category', 'Year-End Total']],
      body: totalsList
    });

    doc.text(`Total Income: $${totalIncome.toFixed(2)}`, 14, doc.lastAutoTable.finalY + 12);
    doc.text(`Total GST Collected: $${totalGSTCollected.toFixed(2)}`, 14, doc.lastAutoTable.finalY + 20);
    doc.text(`Total GST Remitted: $${totalGSTRemitted.toFixed(2)}`, 14, doc.lastAutoTable.finalY + 28);
    doc.text(`Total Business Expenses: $${Object.values(expenseTotals).reduce((a, b) => a + b, 0).toFixed(2)}`, 14, doc.lastAutoTable.finalY + 36);
    doc.text(`Total Home Expenses: $${totalHome.toFixed(2)}`, 14, doc.lastAutoTable.finalY + 44);
    doc.text(`Total Vehicle Expenses: $${totalVehicle.toFixed(2)}`, 14, doc.lastAutoTable.finalY + 52);
    doc.text(`Total All Expenses: $${totalAllExpenses.toFixed(2)}`, 14, doc.lastAutoTable.finalY + 60);

    doc.save('summary.pdf');
  };

  return (
    <button
      onClick={handleExport}
      className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-500"
    >
      Export PDF Summary
    </button>
  );
}
