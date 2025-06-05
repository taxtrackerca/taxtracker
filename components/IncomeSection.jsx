import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import Tooltip from './Tooltip';

export default function IncomeSection({ data, updateField }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl mb-6 max-w-4xl mx-auto shadow-sm overflow-hidden relative z-0">
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
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              Business Income
              <Tooltip text="Enter your total business income for the month before any expenses. This includes sales, services, or any revenue earned through your business." />
            </label>
            <input
              type="number"
              value={data.income || ''}
              onChange={(e) => updateField('income', e.target.value)}
              placeholder="0.00"
              className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>

          {/* Other Income & Taxed Option */}
          <div>
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
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700">
              Has tax already been deducted from the other income?
            </label>
            <div className="flex items-center space-x-6 mt-1">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="taxed"
                  value="yes"
                  checked={data.otherIncomeTaxed === 'yes'}
                  onChange={(e) => updateField('otherIncomeTaxed', e.target.value)}
                  className="form-radio text-blue-600"
                />
                <span className="ml-2">Yes</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="taxed"
                  value="no"
                  checked={data.otherIncomeTaxed === 'no'}
                  onChange={(e) => updateField('otherIncomeTaxed', e.target.value)}
                  className="form-radio text-blue-600"
                />
                <span className="ml-2">No</span>
              </label>
            </div>

            {/* ✅ Warning if filled but no selection */}
            {data.otherIncome && data.otherIncome !== '' && !['yes', 'no'].includes(data.otherIncomeTaxed) && (
              <p className="text-red-600 text-sm mt-1">
                Please indicate whether tax has already been deducted from the other income.
              </p>
            )}
          </div>

          


            {/* GST/HST */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  GST Collected
                  <Tooltip text="Enter the total GST/HST you charged your customers this month. This is the tax you collected on sales." />
                </label>
                <input
                  type="number"
                  value={data.gstCollected || ''}
                  onChange={(e) => updateField('gstCollected', e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  GST Remitted
                  <Tooltip text="Enter the amount of GST/HST you submitted to the CRA this month. This is the portion of collected tax you've already paid." />
                </label>
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