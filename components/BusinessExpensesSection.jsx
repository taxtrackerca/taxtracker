import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import Tooltip from './Tooltip'; // adjust path if needed

export default function BusinessExpensesSection({ data, updateField }) {
  const [open, setOpen] = useState(false);

  const fields = [
    'advertising','meals','badDebts','insurance','interest','businessTax','office','supplies',
    'legal','admin','rent','repairs','salaries','propertyTax','travel','utilities','fuel','delivery','other'
  ];

  const tooltips = {
    advertising: "Costs for promoting your business, like ads or flyers.",
    meals: "50% of meals and entertainment costs related to business activities.",
    badDebts: "Money you're owed but can’t collect, like unpaid invoices. Only claim if you already reported it as income earlier and now it's clearly uncollectible.aid amounts you previously included as income.",
    insurance: "Business insurance premiums (not personal).",
    interest: "Interest on money borrowed for your business, like credit card charges or loan interest. Doesn’t include interest on personal loans.",
    businessTax: "Business taxes, licenses, and fees (excluding income tax).",
    office: "Office supplies like pens, paper, or printer ink. Doesn’t include furniture or computers.",
    supplies: "Items used directly to provide your service or product, like paint for a painter or paper for a printer.",
    legal: "Fees paid to lawyers, accountants, or other professionals for business-related services (not personal matters).",
    admin: "General admin costs like bookkeeping, virtual assistant services, or subscriptions that support business operations.",
    rent: "Rent for business-use space or equipment.",
    repairs: "Fixes or maintenance to business property or equipment. Doesn’t include major upgrades or personal-use repairs.",
    salaries: "Wages paid to employees (not yourself). Doesn’t include dividends or payments to contractors.",
    propertyTax: "Property taxes for business-use space (like a rented studio). Doesn’t apply to home office — that goes in Home Expenses.",
    travel: "Travel costs for business trips, like flights, hotels, and taxis. Commuting from home to work doesn’t count.",
    utilities: "Electricity, heat, water, etc. for business spaces.",
    fuel: "Fuel costs not claimed under vehicle section.",
    delivery: "Costs to ship or deliver items for business purposes — like postage, couriers, or freight charges.",
    other: "Any other business expense not listed above.",
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl mb-6 max-w-4xl mx-auto shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-6 py-4 flex items-center justify-between text-left bg-gray-50 hover:bg-gray-100 transition"
      >
        <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
          💸 Business Expenses
        </h3>
        {open ? <ChevronDown className="w-5 h-5 text-gray-500" /> : <ChevronRight className="w-5 h-5 text-gray-500" />}
      </button>

      {open && (
        <div className="p-6 border-t border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map((field) => (
              <div key={field}>
                <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                  {field.replace(/([A-Z])/g, ' $1')}
                  {tooltips[field] && <Tooltip text={tooltips[field]} />}
                </label>
                <input
                  type="number"
                  value={data[field] || ''}
                  onChange={(e) => updateField(field, e.target.value)}
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