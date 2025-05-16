import React from 'react';
import { FaPlus, FaFilter, FaSortAmountDown } from 'react-icons/fa';

function WorkspaceHeader() {
  return (
    <div className="bg-white border-b border-monday-border p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-monday-text">Main Workspace</h1>
          <button className="bg-monday-blue text-white px-3 py-1.5 rounded-lg flex items-center space-x-2">
            <FaPlus className="text-sm" />
            <span>New Item</span>
          </button>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-3 py-1.5 rounded-lg hover:bg-monday-gray">
            <FaFilter />
            <span>Filter</span>
          </button>
          <button className="flex items-center space-x-2 px-3 py-1.5 rounded-lg hover:bg-monday-gray">
            <FaSortAmountDown />
            <span>Sort</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default WorkspaceHeader; 