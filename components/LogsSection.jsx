import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import LogSection from './LogSection';

export default function LogsSection({ logs, updateLogs }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl mb-6 max-w-4xl mx-auto shadow-sm overflow-hidden relative z-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-6 py-4 flex items-center justify-between text-left bg-gray-50 hover:bg-gray-100 transition"
      >
        <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
          📘 Logs
        </h3>
        {open ? (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronRight className="w-5 h-5 text-gray-500" />
        )}
      </button>

      {open && (
        <div className="p-6 border-t border-gray-100 space-y-6">
          <LogSection logs={logs} updateLogs={updateLogs} />
        </div>
      )}
    </div>
  );
}