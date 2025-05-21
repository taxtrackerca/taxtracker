// components/LogSection.jsx
export default function LogSection({ logs, updateLogs }) {
    const handleChange = (logType, index, field, value) => {
      const updated = [...(logs[logType] || [])];
      updated[index][field] = value;
      updateLogs(logType, updated);
    };
  
    const handleAddEntry = (logType, fields) => {
      const newEntry = fields.reduce((obj, f) => ({ ...obj, [f]: '' }), {});
      updateLogs(logType, [...(logs[logType] || []), newEntry]);
    };
  
    const renderLog = (logType, fields) => (
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">{logType.replace(/([A-Z])/g, ' $1')} Log</h3>
        {(logs[logType] || []).map((entry, index) => (
          <div key={index} className="grid grid-cols-2 gap-2 mb-2">
            {fields.map((field) => (
              <input
                key={field}
                type="text"
                placeholder={field}
                value={entry[field] || ''}
                onChange={(e) => handleChange(logType, index, field, e.target.value)}
                className="p-2 border rounded"
              />
            ))}
          </div>
        ))}
        <button
          onClick={() => handleAddEntry(logType, fields)}
          className="text-sm text-blue-600 underline"
        >
          + Add Entry
        </button>
      </div>
    );
  
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
        {renderLog('driving', ['Date', 'Start', 'End', 'Purpose'])}
        {renderLog('meal', ['Date', 'Restaurant', 'Amount', 'Client'])}
        {renderLog('travel', ['Date', 'Location', 'Purpose', 'Cost'])}
        {renderLog('mobilePhone', ['Date', 'Business Use (%)'])}
        {renderLog('inventory', ['Item', 'Qty', 'Value'])}
        {renderLog('gift', ['Date', 'Recipient', 'Amount'])}
        {renderLog('misc', ['Note'])}
      </div>
    );
  }