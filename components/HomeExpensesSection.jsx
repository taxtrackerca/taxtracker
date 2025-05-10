import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import Tooltip from './Tooltip';

export default function HomeExpensesSection({ data, updateField }) {
  const [open, setOpen] = useState(false);

  const fields = [
    { name: 'homeHeat', label: 'Heat' },
    { name: 'homeElectricity', label: 'Electricity' },
    { name: 'homeInsurance', label: 'Insurance' },
    { name: 'homeMaintenance', label: 'Maintenance' },
    { name: 'homeMortgage', label: 'Mortgage Interest' },
    { name: 'homePropertyTax', label: 'Property Tax' },
  ];

  const tooltips = {
    homeHeat: "Heating costs for your entire home (e.g., oil, electric, gas). A percentage will be applied based on your business use.",
    homeElectricity: "Electric bills for your whole home. Only the business-use portion will be claimed.",
    homeInsurance: "Home insurance premiums. Enter the total monthly — we’ll calculate the business-use share.",
    homeMaintenance: "Repairs or maintenance that benefit the whole home — like painting or cleaning services.",
    homeMortgage: "Mortgage interest only — not principal. This is allowed if you own the home and use part of it for business.",
    homePropertyTax: "Annual property tax for your entire home. A percentage based on your business-use area will be applied.",
    homeSqft: "Enter the total square footage of your home. This helps calculate the percentage used for business.",
    businessSqft: "How much of your home is used for business — like an office or workshop. Only this portion is deductible.",
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl mb-6 max-w-4xl mx-auto shadow-sm overflow-hidden z-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-6 py-4 flex items-center justify-between text-left bg-gray-50 hover:bg-gray-100 transition"
      >
        <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
          🏠 Business Use of Home
        </h3>
        {open ? <ChevronDown className="w-5 h-5 text-gray-500" /> : <ChevronRight className="w-5 h-5 text-gray-500" />}
      </button>

      {open && (
        <div className="p-6 border-t border-gray-100 space-y-6">
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
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                />
              </div>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              Total Home Sqft
              <Tooltip text="Enter the total square footage of your home. This helps calculate the percentage used for business." />
            </label>
            <input
              type="number"
              value={data.homeSqft || ''}
              onChange={(e) => updateField('homeSqft', e.target.value)}
              placeholder="Eg. 1500"
              className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              Business Use Sqft
              <Tooltip text="How much of your home is used for business — like an office or workshop. Only this portion is deductible." />
            </label>
            <input
              type="number"
              value={data.businessSqft || ''}
              onChange={(e) => updateField('businessSqft', e.target.value)}
              placeholder="Eg. 300"
              className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
            />
          </div>
        </div>
      )}
    </div>
  );
}