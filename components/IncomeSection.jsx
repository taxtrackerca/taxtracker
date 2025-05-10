import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import Tooltip from './Tooltip';

export default function IncomeSection({ data, updateField }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl mb-6 max-w-4xl mx-auto shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-6 py-4 flex items-center justify-between text-left bg-gray-50 hover:bg-gray-100 transition"
      >
        <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
          💼 Income & GST/HST
        </h3>
        {open ? (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronRight className="w-5 h-5 text-gray-500" />
        )}
      </button>

      {open && (
        <div className="p-6 border-t border-gray-100 space-y-6">
          {/* Business Income */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Business Income</label>
            <input
              type="number"
              value={data.income || ''}
              onChange={(e) => updateField('income', e.target.value)}
              placeholder="0.00"
              className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>

          {/* Other Income & Taxed Option */}
          <div className="max-w-md w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              Other Personal Income
              <Tooltip text="Include any income not from your business, like job wages, salary, or tips. This helps determine your overall tax bracket." />
            </label>
            <input
              type="number"
              value={data.otherIncome || ''}
              onChange={(e) => updateField('otherIncome', e.target.value)}
              placeholder="0.00"
              className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tax Already Deducted?</label>
            <select
              value={data.otherIncomeTaxed}
              onChange={(e) => updateField('otherIncomeTaxed', e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 transition"
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>

          {/* GST/HST */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">GST Collected</label>
              <input
                type="number"
                value={data.gstCollected || ''}
                onChange={(e) => updateField('gstCollected', e.target.value)}
                placeholder="0.00"
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">GST Remitted</label>
              <input
                type="number"
                value={data.gstRemitted || ''}
                onChange={(e) => updateField('gstRemitted', e.target.value)}
                placeholder="0.00"
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}