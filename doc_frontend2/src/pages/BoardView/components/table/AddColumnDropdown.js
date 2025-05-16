import React, { useState } from 'react';
import { Menu } from '@mui/material';
import { BsPlus } from 'react-icons/bs';
import api from '../../../../services/api';
import { COLUMN_TYPES } from '../../../../config/columnTypes';

const AddColumnDropdown = ({ viewId, groupId, onViewUpdate }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleShowDropdown = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleAddColumn = async (columnType) => {
    try {
      const response = await api.post('/views/addColumn', {
        viewId,
        groupId,
        columnType: columnType.value,
      });
      if (response.data) {
        onViewUpdate(response.data);
      }
      handleClose();
    } catch (error) {
      console.error('Error adding column:', error);
    }
  };

  return (
    <div>
      <button 
        onClick={handleShowDropdown}
        className="text-skin-secondary hover:bg-skin-card-lighter w-full h-full flex items-center justify-center"
      >
        <BsPlus className="w-5 h-5" />
      </button>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        disableRestoreFocus
        keepMounted
        PaperProps={{
          sx: {
            background: 'var(--color-card) !important',
            backdropFilter: 'none !important',
            WebkitBackdropFilter: 'none !important',
            color: 'var(--color-text-primary)',
            minWidth: 320,
            padding: '8px',
            boxShadow: '0 6px 20px rgba(0, 0, 0, 0.5) !important',
            '& .MuiMenuItem-root': {
              padding: 0,
            }
          }
        }}
        slotProps={{
          backdrop: {
            sx: {
              backgroundColor: 'transparent !important'
            }
          }
        }}
      >
        <div className="max-h-[400px] overflow-y-auto bg-skin-card">
          <div className="p-2 grid grid-cols-2 gap-2">
            {COLUMN_TYPES.filter(type => type.value !== 'item').map(type => (
              <button
                key={type.value}
                onClick={() => handleAddColumn(type)}
                className="flex items-center gap-2 p-2.5 rounded-lg hover:bg-skin-card-lighter active:bg-skin-card-darker text-left transition-all duration-150 relative group"
              >
                <div className="w-7 h-7 rounded-lg bg-skin-card-lighter flex items-center justify-center">
                  {type.icon}
                </div>
                <div>
                  <div className="text-skin-primary text-sm font-medium">{type.label}</div>
                  <div className="text-skin-secondary text-xs mt-0.5">{type.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </Menu>
    </div>
  );
};

export default AddColumnDropdown; 