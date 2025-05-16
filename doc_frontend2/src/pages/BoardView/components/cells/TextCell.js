import React, { useState } from 'react';
import { Tooltip } from '@mui/material';
import { useSelector } from 'react-redux';
import { MdLock } from 'react-icons/md';

const TextCell = ({ 
  value, 
  onUpdateCell,
  cellId, 
  rowId, 
  groupId,
  column,
  board
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value);

  const { user } = useSelector((state) => state.auth);
  const isOwner = board?.userId === user?.id;

  const canEdit = isOwner || (column?.canEdit?.some(u => u._id === user?.id));
  const canView = isOwner || (column?.canView?.some(u => u._id === user?.id));

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

  const truncateText = (text, maxLength = 10) => {
    if (!text || text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  // If user doesn't have view permission, show restricted content
  if (!canView && !isOwner) {
    return (
      <div className="flex p-2 items-center justify-center w-full h-full bg-skin-muted">
        <MdLock className="text-skin-muted" size={16} />
      </div>
    );
  }

  return (
    <div className="flex p-2 items-center w-full h-full cursor-pointer" onClick={() => {
      if (canEdit || isOwner) {
        setIsEditing(true);
      }
    }}>
      <div 
        className={`relative flex-1 ${isHovered && !isEditing ? 'border border-dashed border-[#676879] rounded' : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {isEditing ? (
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onBlur={handleCellUpdate}
            onKeyDown={handleKeyDown}
            className="bg-transparent text-skin-primary outline-none border border-[#0073ea] rounded px-2 w-full h-[22px]"
            autoFocus
          />
        ) : (
          <Tooltip 
            title={value || ''}
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
                  '& .MuiTooltip-arrow': {
                    color: 'var(--bg-main)',
                  },
                }
              }
            }}
          >
            <div className="text-skin-primary break-words whitespace-normal">
              {truncateText(value)}
            </div>
          </Tooltip>
        )}
      </div>
    </div>
  );
};

export default TextCell; 