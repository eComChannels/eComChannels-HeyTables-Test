import React from 'react';

function GroupSection({ title, items }) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-2">
        <button className="text-blue-400">▼</button>
        <h2 className="text-white">{title}</h2>
      </div>

      <div className="bg-[#282A4D] rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#2C2F4D]">
              <th className="text-left p-3 text-gray-400">Item</th>
              <th className="text-left p-3 text-gray-400">Person</th>
              <th className="text-left p-3 text-gray-400">Status</th>
              <th className="text-left p-3 text-gray-400">Date</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} className="border-b border-[#2C2F4D] last:border-0">
                <td className="p-3 text-white">{item.name}</td>
                <td className="p-3 text-white">{item.person}</td>
                <td className="p-3">
                  {item.status && (
                    <span className={`px-2 py-1 rounded ${
                      item.status === 'Done' ? 'bg-green-500' : 'bg-yellow-500'
                    }`}>
                      {item.status}
                    </span>
                  )}
                </td>
                <td className="p-3 text-white">{item.date}</td>
              </tr>
            ))}
            <tr>
              <td colSpan="4" className="p-2">
                <button className="text-gray-400 hover:text-white w-full text-left px-2">
                  + Add Item
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default GroupSection; 