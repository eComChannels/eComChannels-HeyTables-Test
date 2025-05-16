import React, { useState } from 'react';
import { Tooltip } from '@mui/material';

const ItemCell = ({ 
  value, 
  onUpdateCell,
  cellId, 
  rowId, 
  groupId 
}) => {
  
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value);

  const handleCellUpdate = async () => {
    if (value !== inputValue && inputValue.trim()) {
      try {
        await onUpdateCell({
          groupId,
          rowId,
          cellId,
          value: inputValue.trim()
        });
      } catch (error) {
        setInputValue(value);
      }
    } else {
      setInputValue(value);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleCellUpdate();
    }
  };

  return (
    <div className="flex items-center justify-between w-full h-full cursor-pointer p-2">
      <div 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => setIsEditing(true)}
        className="w-full"
      >
        <Tooltip 
          title={
            isEditing ? (
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onBlur={handleCellUpdate}
                onKeyDown={handleKeyDown}
                className="bg-transparent w-full outline-none focus:ring-2 focus:ring-primary/20 rounded-md px-3 py-2 min-h-[100px] resize-none border border-skin-border"
                autoFocus
                onClick={(e) => e.stopPropagation()}
                rows={5}
              />
            ) : (
              <div className="min-h-[100px] py-2">
                {value}
              </div>
            )
          }
          placement="top"
          enterDelay={500}
          arrow
          componentsProps={{
            tooltip: {
              sx: {
                bgcolor: 'var(--bg-main)',
                color: 'var(--text-primary)',
                fontSize: '12px',
                padding: '6px 12px',
                borderRadius: '6px',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
                maxWidth: 'none',
                width: '300px',
                '& .MuiTooltip-arrow': {
                  color: 'var(--bg-main)',
                },
              }
            }
          }}
        >
          <div className="text-skin-primary truncate w-full max-w-[240px]">
            {value}
          </div>
        </Tooltip>
      </div>
    </div>
  );
};

export default ItemCell; 