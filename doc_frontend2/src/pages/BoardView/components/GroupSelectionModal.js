import React, { useState } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';

const GroupSelectionModal = ({ 
  isOpen, 
  onClose, 
  onSelectGroup, 
  groups = [],
  currentGroupId 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  if (!isOpen) return null;
  
  const filteredGroups = groups.filter(group => 
    group.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[999] flex items-center justify-center">
      <div 
        className="bg-skin-main border border-skin-border rounded-lg shadow-xl max-w-md w-full mx-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-skin-border">
          <h2 className="font-medium text-skin-primary text-lg">Choose group</h2>
          <button 
            onClick={onClose}
            className="text-skin-secondary hover:text-skin-primary"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4">
          <div className="relative mb-4">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-skin-secondary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search group"
              className="w-full bg-skin-input border border-skin-border rounded-md py-2 pl-10 pr-4 text-skin-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="max-h-[240px] overflow-y-auto">
            {filteredGroups.map(group => (
              <button
                key={group._id}
                className={`w-full flex items-center p-3 rounded-md hover:bg-skin-hover mb-1 text-left ${
                  currentGroupId === group._id 
                    ? 'bg-green-900/20 hover:bg-green-900/30' 
                    : ''
                }`}
                onClick={() => onSelectGroup(group)}
                disabled={currentGroupId === group._id}
              >
                <div 
                  className={`w-5 h-5 rounded-full mr-3 flex-shrink-0 ${
                    currentGroupId === group._id 
                      ? 'bg-green-500' 
                      : 'bg-blue-500'
                  }`}
                >
                  {currentGroupId === group._id && (
                    <div className="flex items-center justify-center h-full text-white font-bold">✓</div>
                  )}
                </div>
                <span>{group.title}</span>
              </button>
            ))}
            
            {filteredGroups.length === 0 && (
              <div className="text-center py-4 text-skin-secondary">
                No groups found matching your search.
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-end p-4 border-t border-skin-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-skin-primary bg-skin-button-secondary border border-skin-border rounded-md mr-2 hover:bg-skin-hover"
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupSelectionModal; 