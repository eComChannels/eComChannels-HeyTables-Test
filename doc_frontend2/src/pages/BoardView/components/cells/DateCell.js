import React, { useRef } from 'react';
import { useSelector } from 'react-redux';
import { MdLock } from 'react-icons/md';
const DateCell = ({ value, cellId, rowId, groupId, boardId, onUpdateCell, column, board }) => {
  const inputRef = useRef(null);
  const { user } = useSelector((state) => state.auth);
  const isOwner = board?.userId === user?.id;

  const canEdit = column?.canEdit?.some(u => u._id === user?.id);
  const canView = column?.canView?.some(u => u._id === user?.id);

  const formatDate = (dateString) => {
    if (!dateString) return undefined;
    return new Date(dateString).toISOString().split('T')[0];
  };

  const handleClick = () => {
    inputRef.current.showPicker();
  };

  if (!canView && !isOwner) {
    return (
      <div className="flex p-2 items-center justify-center w-full h-full bg-skin-muted">
        <MdLock className="text-skin-muted" size={16} />
      </div>
    );
  }

  return (
    <div className="flex items-center p-2 text-center justify-center" style={{ height: '100%' }}>
      <input 
        ref={inputRef}
        type="date" 
        className="bg-transparent text-skin-secondary outline-none cursor-pointer text-center [&::-webkit-calendar-picker-indicator]:hidden"
        value={formatDate(value)}
        onChange={(e) => {
          if (onUpdateCell) {
            onUpdateCell({
              value: e.target.value,
              cellId,
              rowId,
              groupId,
              boardId
            });
          }
        }}
        onClick={() => {
          if (canEdit || isOwner) {
            handleClick();
          }
        }}
      />
    </div>
  );
};

export default DateCell; 