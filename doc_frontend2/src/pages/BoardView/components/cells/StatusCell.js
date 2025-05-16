import React, { useState, useEffect } from 'react';
import { Menu, MenuItem, Divider, Popover } from '@mui/material';
import { BsPencil } from 'react-icons/bs';
import { FiTrash2 } from 'react-icons/fi';
import { BiPaint } from 'react-icons/bi';
import { IoColorFillOutline } from 'react-icons/io5';
import { useSelector } from 'react-redux';
import { MdLock } from 'react-icons/md';

const COLORS = [
  ['#037f4c', '#00c875', '#9cd326', '#cab641'],
  ['#ffcb00', '#ff642e', '#ff7575', '#c4162a'],
  ['#ff158a', '#ff5ac4', '#ffc7d4', '#784bd1'],
  ['#5559df', '#0086c0', '#579bfc', '#66ccff'],
  ['#66cfcc', '#7e8da3', '#333333', '#4f3a49'],
  ['#ff9900', '#bb3354', '#d974b0', '#9d99b9'],
  ['#0647b9', '#1e1f21', '#9898a0', '#99b9c4']
];

const StatusCell = ({ value, cellId, rowId, groupId, statuses = [], columnId,onUpdateCell, onUpdateBoardStatuses, column, board }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingStatuses, setEditingStatuses] = useState([...statuses]);
  const [colorPickerAnchor, setColorPickerAnchor] = useState(null);
  const [selectedStatusId, setSelectedStatusId] = useState(null);
  const open = Boolean(anchorEl);

  const { user } = useSelector((state) => state.auth);
  const isOwner = board?.userId === user?.id;

  const canEdit = column?.canEdit?.some(u => u._id == user?.id);
  const canView = column?.canView?.some(u => u._id == user?.id);

  const handleClick = (event) => {
    if (canEdit || isOwner) {
      setAnchorEl(event.currentTarget);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
    setIsEditing(false);
    setEditingStatuses([...statuses]);
  };

  const handleStatusSelect = async (status) => {
    try {
      onUpdateCell({
        groupId,
        rowId,
        cellId,
        value: status || null
      });
      handleClose();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleEditClick = (e) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleStatusChange = (statusId, newValue) => {
    const newStatuses = editingStatuses.map((status,index) => 
      index === statusId 
        ? { ...status, value: newValue }
        : status
    );
    setEditingStatuses(newStatuses);
  };

  const handleAddNewLabel = () => {
    const newStatus = {
      value: 'New Label',
      color: '#c4c4c4'  // Default color
    };
    setEditingStatuses([...editingStatuses, newStatus]);
  };

  const handleDeleteStatus = (statusId) => {
    setEditingStatuses(editingStatuses.filter((status,index) => index !== statusId));
  };

  const handleColorPickerOpen = (event, statusId) => {
    event.stopPropagation();
    setColorPickerAnchor(event.currentTarget);
    setSelectedStatusId(statusId);
  };

  const handleColorPickerClose = () => {
    setColorPickerAnchor(null);
    setSelectedStatusId(null);
  };

  const handleColorSelect = (color) => {
    const newStatuses = editingStatuses.map((status,index) => 
      index === selectedStatusId 
        ? { ...status, color }
        : status
    );
    setEditingStatuses(newStatuses);
    handleColorPickerClose();
  };

  const handleApply = async () => {
    try {
      await onUpdateBoardStatuses(editingStatuses, columnId);
      setIsEditing(false);
      setAnchorEl(null);
    } catch (error) {
      console.error('Error updating board statuses:', error);
    }
  };

  const currentStatus = value || null;

  if (!canView && !isOwner) {
    return (
      <div className="flex p-2 items-center justify-center w-full h-full bg-skin-muted">
        <MdLock className="text-skin-muted" size={16} />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[30px]">
      <div 
        className="w-full h-full min-h-[30px] flex items-center justify-center cursor-pointer text-white px-1" 
        style={{ 
          backgroundColor: currentStatus?.color || '#c4c4c4',
          minHeight: "30px" 
        }}
        onClick={handleClick}
      >
        <span className="truncate">{currentStatus?.value || ''}</span>
      </div>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            bgcolor: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            width: 'min-content',
            padding: '0px 10px',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
            '& .MuiMenuItem-root': {
              // padding:'2px 0px',
              height: '50px',
              width: '150px',
              '&:hover': {
                backgroundColor: 'transparent'
              }
            }
          }
        }}
      >
        {!isEditing ? (
          <>
            {statuses.map((status) => (
              <MenuItem 
                key={status._id}
                onClick={() => handleStatusSelect(status)}
                selected={currentStatus?._id === status._id}
              >
                <div 
                  className="w-full h-full flex items-center justify-center text-white overflow-hidden"
                  style={{ backgroundColor: status.color }}
                >
                  {status.value}
                </div>
              </MenuItem>
            ))}
            <Divider sx={{ margin: '8px 0', borderColor: 'var(--border-color)' }} />
            <MenuItem 
              sx={{ color: 'var(--text-secondary)', justifyContent: 'center' }}
              onClick={handleEditClick}
            >
              <BsPencil className="w-3.5 h-3.5 mr-2" />
              Edit Labels
            </MenuItem>
          </>
        ) : (
          <>
            {editingStatuses.map((status,index) => (
              <MenuItem 
                key={status._id}
                disableRipple
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                className="group relative"
              >
                <div 
                  className="w-full h-full flex items-center text-white border rounded transition-all duration-200 group-hover:border-transparent"
                  style={{ 
                    borderColor: status.color,
                    backgroundColor: 'transparent',
                  }}
                >
                  <div className="flex items-center gap-2 px-2 flex-1">
                    <div 
                      className="w-5 h-5 rounded-sm cursor-pointer hover:ring-2 hover:ring-white hover:ring-opacity-50 relative flex items-center justify-center"
                      style={{ backgroundColor: status.color }}
                      title="Change color"
                      onClick={(e) => handleColorPickerOpen(e, index)}
                    >
                      <IoColorFillOutline 
                        className="text-white"
                        size={12}
                      />
                    </div>
                    <div className="relative flex-1 overflow-hidden">
                      <input
                        type="text"
                        value={status.value}
                        className="bg-transparent text-skin-primary border-none outline-none w-full opacity-0 group-hover:opacity-100 z-10 relative truncate"
                        onChange={(e) => handleStatusChange(index, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                      />
                      <span className="absolute inset-0 text-skin-primary group-hover:opacity-0 truncate">
                        {status.value}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="absolute top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-full" style={{right: '-12px'}}>
                  <FiTrash2 
                    className="absolute text-skin-secondary w-3.5 h-3.5 opacity-0 group-hover:opacity-100 cursor-pointer hover:text-skin-primary"
                    style={{ 
                      right: '-4px',
                      top: '50%',
                      transform: 'translateY(-50%)'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteStatus(index);
                    }}
                  />
                </div>
              </MenuItem>
            ))}
            <MenuItem>
              <div 
                className="w-full h-9 flex items-center justify-between text-skin-primary border border-dashed border-skin-secondary rounded cursor-pointer"
                onClick={handleAddNewLabel}
              >
                <div className="flex items-center gap-2 px-3">
                  <div className="w-3 h-3 rounded-sm bg-skin-secondary" />
                  <span>+ New label</span>
                </div>
              </div>
            </MenuItem>
            <Divider sx={{ margin: '8px 0', borderColor: 'var(--border-color)' }} />
            <MenuItem 
              sx={{ color: 'var(--text-secondary)', justifyContent: 'center' }}
              onClick={handleApply}
            >
              Apply
            </MenuItem>
          </>
        )}
      </Menu>

      <Popover
        open={Boolean(colorPickerAnchor)}
        anchorEl={colorPickerAnchor}
        onClose={handleColorPickerClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        PaperProps={{
          sx: {
            bgcolor: '#1f2441',
            padding: '8px',
            marginTop: '4px'
          }
        }}
      >
        <div className="w-[144px]">
          {COLORS.map((row, rowIndex) => (
            <div key={rowIndex} className="flex gap-1 mb-1">
              {row.map((color, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className="w-7 h-7 rounded cursor-pointer hover:ring-2 hover:ring-white hover:ring-opacity-50"
                  style={{ backgroundColor: color }}
                  onClick={() => handleColorSelect(color)}
                />
              ))}
            </div>
          ))}
        </div>
      </Popover>
    </div>
  );
};

export default StatusCell; 