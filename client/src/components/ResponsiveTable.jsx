import React from 'react';

// src/components/ResponsiveTable.jsx
export default function ResponsiveTable({ 
  columns, 
  data, 
  renderMobileCard, 
  keyExtractor = (item) => item._id || item.id 
}) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-500">
        No records found.
      </div>
    );
  }

  return (
    <>
      {/* Desktop View (Table) */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {columns.map((col, i) => (
                  <th key={i} className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.map((row) => (
                <tr key={keyExtractor(row)} className="hover:bg-gray-50 transition-colors">
                  {columns.map((col, i) => (
                    <td key={i} className={`px-6 py-4 text-sm ${col.className || 'text-gray-900'}`}>
                      {col.cell(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile View (Cards) */}
      <div className="block md:hidden space-y-4">
        {data.map((row) => (
          <div key={keyExtractor(row)} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            {renderMobileCard(row)}
          </div>
        ))}
      </div>
    </>
  );
}
