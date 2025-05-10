import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import Tooltip from './Tooltip';

export default function VehicleExpensesSection({ data, updateField, ytdKm }) {
  const [open, setOpen] = useState(false);

  const fields = [
    { name: 'vehicleFuel', label: 'Fuel & Oil' },
    { name: 'vehicleInsurance', label: 'Insurance' },
    { name: 'vehicleLicense', label: 'License & Registration' },
    { name: 'vehicleRepairs', label: 'Maintenance & Repairs' },
  ];

  const tooltips = {
    kmsThisMonth: "Total kilometers driven this month — for both business and personal use.",
    businessKms: "Only the kilometers driven for business. This is used to calculate the deductible portion.",
    vehicleFuel: "Gas, diesel, or oil expenses used to operate your vehicle for business.",
    vehicleInsurance: "The total vehicle insurance cost — we’ll apply the business-use percentage.",
    vehicleLicense: "Fees for vehicle registration, licenses, or plates.",
    vehicleRepairs: "Maintenance or repair costs (like tire changes or oil changes) for your vehicle.",
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl mb-6 max-w-4xl mx-auto shadow-sm overflow-hidden z-0">
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
          {/* KM Tracking Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-1 mb-1">
                <span className="text-sm font-medium text-gray-700">KMs Driven This Month</span>
                <Tooltip text={tooltips.kmsThisMonth} />
              </div>
              <input
                type="number"
                value={data.kmsThisMonth || ''}
                onChange={(e) => updateField('kmsThisMonth', e.target.value)}
                placeholder="e.g. 800"
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
            <div>
              <div className="flex items-center gap-1 mb-1">
                <span className="text-sm font-medium text-gray-700">Business KMs</span>
                <Tooltip text={tooltips.businessKms} />
              </div>
              <input
                type="number"
                value={data.businessKms || ''}
                onChange={(e) => updateField('businessKms', e.target.value)}
                placeholder="e.g. 600"
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
          </div>

          {/* Expense Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map(({ name, label }) => (
              <div key={name}>
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-sm font-medium text-gray-700">{label}</span>
                  {tooltips[name] && <Tooltip text={tooltips[name]} />}
                </div>
                <input
                  type="number"
                  value={data[name] || ''}
                  onChange={(e) => updateField(name, e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
            ))}
          </div>

          
        </div>
      )}
    </div>
  );
}