import React, { useState, useEffect } from 'react';
import { Menu } from '@mui/material';
import { FaChevronDown, FaSearch, FaUser, FaFilter, FaSort, FaTimes } from 'react-icons/fa';
import { IoMdAdd } from 'react-icons/io';
import { FiX } from 'react-icons/fi';
import api from '../../../services/api';

function BoardToolbar({ view, onSearch, onViewUpdate }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [searchAnchorEl, setSearchAnchorEl] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const searchOpen = Boolean(searchAnchorEl);

  // Update selectedColumns when view changes
  useEffect(() => {
    if (view?.table?.columns) {
      setSelectedColumns([]);
    }
  }, [view]);

  const handleNewItemClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleAddItemToFirstGroup = async () => {
    if (!view?.table?.groups || view.table.groups.length === 0) return;
    
    try {
      const firstGroup = view.table.groups[0];
      const { data: updatedView } = await api.post('/views/addItem', {
        viewId: view._id,
        groupId: firstGroup._id,
        title: 'New Item'
      });
      
      if (onViewUpdate) {
        onViewUpdate(updatedView);
      }
      
      handleClose();
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  const handleSearchClick = (event) => {
    setSearchAnchorEl(event.currentTarget);
  };

  const handleSearchClose = () => {
    setSearchAnchorEl(null);
  };

  const handleToggleAllColumns = () => {
    if (!view?.table?.columns) return;
    
    if (selectedColumns.length === view.table.columns.length) {
      setSelectedColumns([]);
    } else {
      setSelectedColumns(view.table.columns.map(col => col._id));
    }
  };

  const handleToggleColumn = (columnId) => {
    if (selectedColumns.includes(columnId)) {
      setSelectedColumns(selectedColumns.filter(id => id !== columnId));
    } else {
      setSelectedColumns([...selectedColumns, columnId]);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSearch = () => {
      onSearch({
        searchText,
        selectedColumns
      });
    setIsSearchActive(!!searchText && selectedColumns.length > 0);
    // Don't close the search dialog after search
  };

  const handleClearSearch = () => {
    setSearchText('');
    setIsSearchActive(false);
    onSearch({
      searchText: '',
      selectedColumns
    });
  };

  // If view is not ready, render empty or loading state
  if (!view?.table) {
    return (
      <div className="h-14 px-4 border-b border-[var(--border-color)] bg-skin-primary flex items-center">
        <div className="animate-pulse bg-skin-hover h-8 w-32 rounded"></div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-skin-primary border-b border-[var(--border-color)]">
      <div className="flex items-center gap-2">
        <button 
          onClick={handleNewItemClick}
          className="flex items-center gap-2 px-3 py-1.5 bg-[#0073ea] text-white rounded-md hover:bg-[#0060c2] transition-colors"
        >
          <IoMdAdd className="w-4 h-4" />
          <span className="text-sm font-medium">New Item</span>
          <FaChevronDown className="w-3 h-3" />
        </button>
        
        <div className="h-4 w-[1px] bg-[var(--border-color)]" />
        
        <div className="flex items-center gap-1">
          <button 
            className={`flex items-center gap-2 px-3 py-1.5 rounded transition-colors ${
              isSearchActive 
                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                : 'text-skin-secondary hover:bg-skin-hover'
            }`}
            onClick={handleSearchClick}
          >
            <FaSearch className="w-3.5 h-3.5" />
            <span className="text-sm">Search</span>
            {isSearchActive && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleClearSearch();
                }}
                className="ml-1 text-blue-500 hover:text-blue-700"
              >
                <FaTimes className="w-3 h-3" />
              </button>
            )}
          </button>
        </div>
      </div>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 200,
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
            bgcolor: 'var(--bg-primary)',
            color: 'var(--text-primary)',
          }
        }}
      >
        <div className="p-2">
          <button
            onClick={handleAddItemToFirstGroup}
            className="w-full text-left px-4 py-2 hover:bg-skin-hover rounded transition-colors text-skin-primary"
          >
            Add to first group
          </button>
        </div>
      </Menu>

      <Menu
        anchorEl={searchAnchorEl}
        open={searchOpen}
        onClose={handleSearchClose}
        PaperProps={{
          sx: {
            bgcolor: 'var(--color-card-darker)',
            color: 'var(--text-primary)',
            width: 250,
            padding: '16px',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
            '& .MuiMenuItem-root': {
              padding: 0,
              margin: '6px 0',
              '&:hover': {
                backgroundColor: 'transparent'
              }
            }
          }
        }}
      >
        <div>
          <div className="text-sm text-skin-secondary">Choose columns to search</div>
          
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full px-3 py-1.5 bg-transparent text-skin-primary rounded border border-skin-border outline-none focus:ring-2 focus:ring-primary/20 pr-8"
            />
            {searchText && (
              <button
                onClick={handleClearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-skin-secondary hover:text-skin-primary"
              >
                <FiX className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            onClick={handleSearch}
            className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-[#0073ea] text-white rounded-md hover:bg-[#0060c2] transition-colors"
          >
            <FaSearch className="w-3.5 h-3.5" />
            <span className="text-sm font-medium">Search</span>
          </button>

          <div className="flex items-center gap-2 mt-3">
            <input
              type="checkbox"
              checked={selectedColumns.length === view.table.columns.length}
              onChange={handleToggleAllColumns}
              className="rounded"
            />
            <span className="text-skin-primary">All columns</span>
            <span className="text-skin-secondary text-sm ml-1">
              {selectedColumns.length} selected
            </span>
          </div>

          <div className="mt-2 max-h-[200px] overflow-y-auto">
            {view.table.columns.map(column => (
              <div key={column._id} className="flex items-center gap-2 p-1">
                <input
                  type="checkbox"
                  checked={selectedColumns.includes(column._id)}
                  onChange={() => handleToggleColumn(column._id)}
                  className="rounded"
                />
                <span className="text-skin-primary">{column.title}</span>
              </div>
            ))}
          </div>
        </div>
      </Menu>
    </div>
  );
}

export default BoardToolbar; 