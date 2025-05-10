import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

export default function VehicleExpensesSection({ data, updateField, ytdKm }) {
  const [open, setOpen] = useState(false);

  const fields = [
    { name: 'vehicleFuel', label: 'Fuel & Oil' },
    { name: 'vehicleInsurance', label: 'Insurance' },
    { name: 'vehicleLicense', label: 'License & Registration' },
    { name: 'vehicleRepairs', label: 'Maintenance & Repairs' },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-2xl mb-6 max-w-4xl mx-auto shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-6 py-4 flex items-center justify-between text-left bg-gray-50 hover:bg-gray-100 transition"
      >
        <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
          🚗 Motor Vehicle Expenses
        </h3>
        {open ? <ChevronDown className="w-5 h-5 text-gray-500" /> : <ChevronRight className="w-5 h-5 text-gray-500" />}
      </button>

      {open && (
        <div className="p-6 border-t border-gray-100 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">KMs Driven This Month</label>
              <input
                type="number"
                value={data.kmsThisMonth || ''}
                onChange={(e) => updateField('kmsThisMonth', e.target.value)}
                placeholder="e.g. 800"
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business KMs</label>
              <input
                type="number"
                value={data.businessKms || ''}
                onChange={(e) => updateField('businessKms', e.target.value)}
                placeholder="e.g. 600"
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map(({ name, label }) => (
              <div key={name}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <input
                  type="number"
                  value={data[name] || ''}
                  onChange={(e) => updateField(name, e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                />
              </div>
            ))}
          </div>

          
        </div>
      )}
    </div>
  );
}