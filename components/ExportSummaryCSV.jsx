// components/ExportSummaryCSV.jsx
import { collection, getDocs } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export default function ExportSummaryCSV() {
  const exportCSV = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const snapshot = await getDocs(collection(db, 'users', uid, 'months'));
    let csv = 'Month,Income,Expenses,GST Collected,GST Remitted\n';

    snapshot.forEach((doc) => {
      const data = doc.data();
      csv += `${doc.id},${data.income || 0},${data.expenses || 0},${data.gstCollected || 0},${data.gstRemitted || 0}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'TaxTracker_Summary.csv');
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