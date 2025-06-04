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
      'advertising', 'meals', 'badDebts', 'insurance', 'interest', 'businessTax', 'office', 'supplies', 'legal', 'admin',
      'rent', 'repairs', 'salaries', 'propertyTax', 'travel', 'utilities', 'fuel', 'delivery', 'other'
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

      const homePct = data.homeSqft > 0 ? parseFloat(data.businessSqft || 0) / data.homeSqft : 0;
      const home = [
        'homeHeat', 'homeElectricity', 'homeInsurance', 'homeMaintenance', 'homeMortgage', 'homePropertyTax'
      ].reduce((sum, f) => sum + parseFloat(data[f] || 0), 0) * homePct;

      const vehiclePct = data.kmsThisMonth > 0 ? parseFloat(data.businessKms || 0) / data.kmsThisMonth : 0;
      const vehicle = [
        'vehicleFuel', 'vehicleInsurance', 'vehicleLicense', 'vehicleRepairs'
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
      body: monthSummaries,
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [52, 73, 94] }
    });

    const totalsList = categories.map(cat => [cat.charAt(0).toUpperCase() + cat.slice(1), `$${expenseTotals[cat].toFixed(2)}`]);

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 15,
      head: [['Expense Category', 'Year-End Total']],
      body: totalsList,
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [52, 73, 94] }
    });

    // Compute Y-position for the final summary text
    let finalY = doc.lastAutoTable.finalY + 10;

    // If near the bottom, start a new page
    if (finalY > 250) {
      doc.addPage();
      finalY = 20;
    }

    doc.setFontSize(12);
    doc.text(`Total Income: $${totalIncome.toFixed(2)}`, 14, finalY);
    doc.text(`Total GST Collected: $${totalGSTCollected.toFixed(2)}`, 14, finalY + 8);
    doc.text(`Total GST Remitted: $${totalGSTRemitted.toFixed(2)}`, 14, finalY + 16);
    doc.text(`Total Business Expenses: $${Object.values(expenseTotals).reduce((a, b) => a + b, 0).toFixed(2)}`, 14, finalY + 24);
    doc.text(`Total Home Expenses: $${totalHome.toFixed(2)}`, 14, finalY + 32);
    doc.text(`Total Vehicle Expenses: $${totalVehicle.toFixed(2)}`, 14, finalY + 40);
    doc.text(`Total All Expenses: $${totalAllExpenses.toFixed(2)}`, 14, finalY + 48);
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const safeBusinessName = (businessName || 'summary').replace(/\s+/g, '_').replace(/[^\w\-]/g, '');
    const filename = `${safeBusinessName}-Summary-${dateStr}.pdf`;
    // Add footer to all pages
    const pageCount = doc.internal.getNumberOfPages();
    const year = new Date().getFullYear();

    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      doc.setFontSize(10);
      doc.setTextColor(150);

      // Centered branding text
      doc.text(`Prepared using TaxTracker.ca - ${year}`, pageWidth / 2, pageHeight - 10, { align: 'center' });

      // Right-aligned page number
      doc.text(`Page ${i} of ${pageCount}`, pageWidth - 14, pageHeight - 10, {
        align: 'right'
      });
    }
    doc.save(filename);
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
