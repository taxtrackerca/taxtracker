import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

const logTypes = {
  driving: {
    name: 'Driving Log', icon: '🚗',
    fields: [
      { label: 'Date', type: 'date' },
      { label: 'Purpose', type: 'text' },
      { label: 'Total KM', type: 'number' }
    ]
  },
  meal: {
    name: 'Meal Log', icon: '🍽️',
    fields: [
      { label: 'Date', type: 'date' },
      { label: 'Restaurant', type: 'text' },
      { label: 'Amount', type: 'number' },
      { label: 'Client', type: 'text' }
    ]
  },
  travel: {
    name: 'Travel Log', icon: '✈️',
    fields: [
      { label: 'Date', type: 'date' },
      { label: 'Location', type: 'text' },
      { label: 'Purpose', type: 'text' },
      { label: 'Cost', type: 'number' }
    ]
  },
  mobilePhone: {
    name: 'Mobile Phone Log', icon: '📱',
    fields: [
      { label: 'Date', type: 'date' },
      { label: 'Business Use (%)', type: 'number' }
    ]
  },
  inventory: {
    name: 'Inventory Log', icon: '📦',
    fields: [
      { label: 'Item', type: 'text' },
      { label: 'Qty', type: 'number' },
      { label: 'Value', type: 'number' }
    ]
  },
  gift: {
    name: 'Gift Log', icon: '🎁',
    fields: [
      { label: 'Date', type: 'date' },
      { label: 'Recipient', type: 'text' },
      { label: 'Amount', type: 'number' }
    ]
  },
  misc: {
    name: 'Misc Log', icon: '📝',
    fields: [
      { label: 'Note', type: 'text' }
    ]
  }
};

export default function LogSection({ logs, updateLogs }) {
  return (
    <div className="space-y-4">
      {Object.entries(logTypes).map(([key, { name, icon, fields }]) => (
        <LogCard
          key={key}
          logKey={key}
          title={name}
          icon={icon}
          fields={fields}
          entries={logs[key] || []}
          update={(entries) => updateLogs(key, entries)}
        />
      ))}
    </div>
  );
}

function LogCard({ logKey, title, icon, fields, entries, update }) {
  const [open, setOpen] = useState(false);
  const [expandedEntryIndex, setExpandedEntryIndex] = useState(null);

  const handleChange = (index, field, value) => {
    const updated = [...entries];
    updated[index][field] = value;
    update(updated);
  };

  const handleAdd = () => {
    const newEntry = fields.reduce((acc, field) => ({ ...acc, [field]: '' }), {});
    update([...entries, newEntry]);
    setExpandedEntryIndex(entries.length);
  };

  const handleDelete = (index) => {
    const updated = entries.filter((_, i) => i !== index);
    update(updated);
    if (expandedEntryIndex === index) setExpandedEntryIndex(null);
  };

  const calculateLogTotal = (entries, fields) => {
    let total = 0;
    fields.forEach(({ label, type }) => {
      if (type === 'number') {
        entries.forEach(entry => {
          const val = parseFloat(entry[label]);
          if (!isNaN(val)) total += val;
        });
      }
    });
    return total.toFixed(2);
  };

  return (
    <div className="border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-3 flex items-center justify-between text-left bg-gray-100 hover:bg-gray-200 transition"
      >
        <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <span className="text-base">{icon}</span> {title}
        </h4>
        {open ? (
          <ChevronDown className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-500" />
        )}
      </button>


      {open && (
        <div className="p-4 space-y-4 bg-white border-t border-gray-100">

          {/* Entries */}
          {entries.map((entry, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg p-3 bg-gray-50 space-y-2"
            >
              {expandedEntryIndex !== index ? (
                <button
                  onClick={() => setExpandedEntryIndex(index)}
                  className="w-full text-left text-sm text-gray-700 hover:underline flex justify-between"
                >
                  <span>
                    {fields.map(({ label }) => entry[label]).filter(Boolean).join(' • ') || 'Untitled Entry'}
                  </span>
                  <span className="text-blue-500 text-xs">Edit</span>
                </button>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 items-end">
                  {fields.map(({ label, type }) => (
                    <div key={label} className="flex flex-col space-y-1 w-full">
                      <label className="text-sm font-medium text-gray-700">{label}</label>
                      <input
                        type={type}
                        value={entry[label] || ''}
                        onChange={(e) => handleChange(index, label, e.target.value)}
                        className="bg-gray-50 border border-gray-300 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 transition"
                      />
                    </div>
                  ))}
                  <div className="flex items-center justify-end space-x-3 mt-1 col-span-full">
                    <button
                      onClick={() => setExpandedEntryIndex(null)}
                      className="text-xs text-gray-500 hover:underline"
                    >
                      Collapse
                    </button>
                    <button
                      onClick={() => handleDelete(index)}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Add Entry Button — Always Visible */}
          <button
            onClick={handleAdd}
            className="text-sm text-blue-600 hover:underline"
          >
            + Add Entry
          </button>

          {/* Total */}
          {entries.length > 0 && (
            <div className="text-right text-sm text-gray-700 font-medium pt-2 border-t border-gray-200">
              {title === 'Driving Log' ? 'Total KM' : 'Total'}: {calculateLogTotal(entries, fields)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
