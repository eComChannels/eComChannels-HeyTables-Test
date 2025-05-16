import React, { useState, useRef, useEffect } from 'react';
import TextCell from '../cells/TextCell';
import PersonCell from '../cells/PersonCell';
import StatusCell from '../cells/StatusCell';
import DateCell from '../cells/DateCell';
import ItemCell from '../cells/ItemCell';
import FormulaCell from '../cells/FormulaCell';
import { BsChevronDown, BsThreeDots, BsPlus } from 'react-icons/bs';
import { BiDuplicate, BiCopy } from 'react-icons/bi';
import { RiDeleteBinLine } from 'react-icons/ri';
import { BsPencil } from 'react-icons/bs';
import { Menu, MenuItem } from '@mui/material';
import { FiMoreHorizontal } from 'react-icons/fi';
import TableColumn from './TableColumn';
import AddColumnDropdown from './AddColumnDropdown';
import ConfirmModal from '../../../../components/modals/ConfirmModal';
import api from '../../../../services/api';
import zIndex from '@mui/material/styles/zIndex';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableRow } from './SortableRow';
import { useDroppable } from '@dnd-kit/core';
import TaskActionsMenu from '../TaskActionsMenu';

function TableGroup({ group, board, view, onUpdateGroup, users, onViewUpdate}) {
  console.log("board", board)
  const [rows ,setRows] = useState(group.rows || []);
  const [columns ,setColumns] = useState(view.table.columns || []);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(group.title);
  const [hoveredRowId, setHoveredRowId] = useState(null);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const inputRef = useRef(null);
  const [canHandleBlur, setCanHandleBlur] = useState(true);
  const [rowMenuAnchorEl, setRowMenuAnchorEl] = useState(null);
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [showTaskActions, setShowTaskActions] = useState(false);
  const [taskActionsPosition, setTaskActionsPosition] = useState({ top: '50%', left: '50%' });

  const { setNodeRef } = useDroppable({
    id: group._id,
    data: {
      type: 'group',
      groupId: group._id
    }
  });


  useEffect(() => {
    setRows(group.rows || []);
    setColumns(view.table.columns || []);
  }, [view,group]);
  const handleRename = async () => {
    try {
      if (editTitle.trim() && editTitle !== group.title) {
        const { data: updatedView } = await api.patch('/views/renameGroup', {
          viewId: view._id,
          groupId: group._id,
          name: editTitle
        });
        onViewUpdate(updatedView);
      }
      setIsEditing(false);
    } catch (error) {
      console.error('Error renaming group:', error);
      // Reset to original title on error
      setEditTitle(group.title);
      setIsEditing(false);
    }
  };

  const handleCellUpdate = async ({ rowId, cellId, value }) => {
    try {
      const { data: updatedView } = await api.patch('/views/updateCell', {
        viewId: view._id,
        groupId: group._id,
        rowId,
        cellId,
        value
      });
      onViewUpdate(updatedView);
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  };
  const handleMenuOpen = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDelete = () => {
    setShowConfirmModal(true);
    handleMenuClose();
  };

  const handleConfirmDelete = async () => {
    try {
      const { data: updatedView } = await api.post('/views/deleteGroup', {
        viewId: view._id,
        groupId: group._id
      });
      onViewUpdate(updatedView);
      setShowConfirmModal(false);
    } catch (error) {
      console.error('Error deleting group:', error);
    }
  };

  const handleDuplicate = async () => {
    handleMenuClose();
    try {
      const { data: updatedView } = await api.post('/views/duplicateGroup', {
        viewId: view._id,
        groupId: group._id
      });
      onViewUpdate(updatedView);
    } catch (error) {
      console.error('Error duplicating group:', error);
    }
  };

  const handleAddItem = async () => {
    if (!newItemTitle.trim()) return;
    
    try {
      const { data: updatedView } = await api.post('/views/addItem', {
        viewId: view._id,
        groupId: group._id,
        title: newItemTitle
      });
      onViewUpdate(updatedView);
      setIsAddingItem(false);
      setNewItemTitle('');
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  const handleRowMenuClose = () => {
    setRowMenuAnchorEl(null);
  };

  const handleDeleteRow = async (itemId) => {
    try {
      const { data: updatedView } = await api.post('/views/deleteRawItem', {
        viewId: view._id,
        groupId: group._id,
        itemId
      });
      handleRowMenuClose();
      onViewUpdate(updatedView);
    } catch (error) {
      console.error('Error deleting row:', error);
    }
  };

  const menuItems = [
    {
      icon: <BsPencil className="w-3.5 h-3.5" />,
      label: 'Rename group',
      onClick: (e) => {
        e.preventDefault();
        e.stopPropagation();
        setCanHandleBlur(false);
        setIsEditing(true);
        handleMenuClose();
        setTimeout(() => {
          inputRef.current?.focus();
          setCanHandleBlur(true);
        }, 100);
      },
      color: 'text-skin-secondary'
    },
    {
      icon: <BiCopy className="w-3.5 h-3.5" />,
      label: 'Duplicate group',
      onClick: handleDuplicate,
      color: 'text-skin-secondary'
    },
    {
      icon: <RiDeleteBinLine className="w-3.5 h-3.5" />,
      label: 'Delete group',
      onClick: handleDelete,
      color: 'text-[#e2445c]'
    }
  ];
  const handleUpdateBoardStatuses = async (newStatuses, columnId) => {
    try {
      const { data: updatedView } = await api.patch('/views/updateBoardStatus', { boardId:view._id, viewId:view._id, columnId, statuses: newStatuses});
      onViewUpdate(updatedView);
    } catch (error) {
      console.error('Error updating board statuses:', error);
    }
  };
  const renderCell = (cell, row, column) => {
    const commonProps = {
      value: cell.value,
      cellId: cell._id,
      rowId: row._id,
      groupId: group._id,
      board,
      column,
      onUpdateCell: handleCellUpdate
    };

    switch (column.type) {
      case 'item':
        return <ItemCell {...commonProps} />;
      case 'person':
        return <PersonCell {...commonProps} users={users} />;
      case 'status':
        return <StatusCell {...commonProps} columnId={column._id} statuses={column.statuses} onUpdateBoardStatuses={handleUpdateBoardStatuses}/>;
      case 'date':
        return <DateCell {...commonProps} />;
      case 'formula':
        return <FormulaCell 
          {...commonProps} 
          viewId={view._id} 
          columnId={column._id}
          viewData={view}
          rowData={row}
        />;
      default:
        return <TextCell {...commonProps} />;
    }
  };

  const handleSelectTask = (task, isSelected) => {
    if (isSelected) {
      setSelectedTasks(prev => [...prev, task]);
    } else {
      setSelectedTasks(prev => prev.filter(t => t._id !== task._id));
    }
    
    // Always show task actions menu if there are selected tasks after this operation
    const willHaveSelectedTasks = isSelected || selectedTasks.length > 1;
    
    if (willHaveSelectedTasks) {
      setShowTaskActions(true);
      setTaskActionsPosition({
        bottom: '40px',
        left: '50%',
        position: 'fixed',
        zIndex: 1000
      });
    } else {
      setShowTaskActions(false);
    }
  };
  
  const handleTaskClick = (task) => {
    const isAlreadySelected = selectedTasks.some(t => t._id === task._id);
    handleSelectTask(task, !isAlreadySelected);
  };
  
  const handleCloseTaskActions = () => {
    setShowTaskActions(false);
    setSelectedTasks([]);
  };
  
  const handleTasksUpdated = (updatedView) => {
    setSelectedTasks([]);
    onViewUpdate(updatedView);
  };
  
  const handleSelectAllTasks = (e) => {
    if (e.target.checked) {
      setSelectedTasks([...rows]);
      setShowTaskActions(true);
      setTaskActionsPosition({
        bottom: '40px',
        left: '50%',
        position: 'fixed',
        zIndex: 1000
      });
    } else {
      setSelectedTasks([]);
      setShowTaskActions(false);
    }
  };

  // Add safety check at the start
  if (!group || !view?.table?.columns) {
    return null;
  }

  return (
    <div className="mb-6" style={{width: 'fit-content'}}>
      {/* Group Header */}
      <div className="bg-skin-primary" style={{position:'sticky', top:'0px', zIndex:'20'}}>

        <div className='flex items-center h-9'>
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 hover:bg-skin-hover rounded"
          >
            <BsChevronDown 
              className={`text-skin-secondary w-4 h-4 transform transition-transform duration-200 ${
                isCollapsed ? 'rotate-[-90deg]' : ''
              }`}
            />
          </button>

          {isEditing ? (
            <input
              ref={inputRef}
              autoFocus
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={(e) => {
                if (canHandleBlur) {
                  handleRename();
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename();
                if (e.key === 'Escape') {
                  setIsEditing(false);
                  setEditTitle(group.title);
                }
              }}
              className="bg-transparent text-skin-primary font-medium outline-none border-b border-[#1f76c2] px-0"
              style={{ width: `${editTitle.length * 8}px` }}
            />
          ) : (
            <span className="text-skin-primary font-medium">{group.title}</span>
          )}

          <button
            onClick={handleMenuOpen}
            className="group-menu p-1 hover:bg-skin-hover rounded ml-2"
          >
            <BsThreeDots className="text-skin-secondary w-4 h-4" />
          </button>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
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
                mt: 1,
                minWidth: 180,
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                '& .MuiMenuItem-root': {
                  py: 0.75,
                  px: 2,
                  fontSize: '13px',
                },
              },
            }}
          >
            {menuItems.map((item, index) => (
              <MenuItem
                key={index}
                onClick={item.onClick}
                className={`flex items-center gap-2 ${item.color}`}
              >
                {item.icon}
                {item.label}
              </MenuItem>
            ))}
          </Menu>
        </div>

        <div className='relative' style={{width: 'max-content', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.02)'}}>
          {/* Table Header */}
          <div className="flex border border-skin-border bg-skin-card table-fixed">
            {/* Fixed Left Checkbox */}
            <div className="w-[60px] p-2 border-r border-skin-border bg-skin-card flex items-center min-h-[40px]">
              <div className="w-[30px]"></div>
              <input 
                type="checkbox" 
                className="rounded accent-blue-500"
                checked={selectedTasks.length > 0 && selectedTasks.length === rows.length}
                onChange={handleSelectAllTasks}
              />
            </div>

            {/* Columns */}
            {columns.map((col, colIndex) => (
              <TableColumn
                board={board}
                key={col._id}
                column={col}
                groupId={group._id}
                isFirstColumn={colIndex === 0}
                viewId={view._id}
                onViewUpdate={onViewUpdate}
              />
            ))}

            {/* Fixed Right */}
            <div className="w-[40px] bg-skin-card flex items-center justify-center min-h-[40px]" style={{minWidth: '40px'}}>
              <AddColumnDropdown 
                viewId={view._id}
                groupId={group._id}
                onViewUpdate={onViewUpdate}
              />
            </div>
          </div>
        </div>
      </div>

      <SortableContext
        items={group.rows.map(row => row._id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          ref={setNodeRef}
          className="relative min-h-[50px] transition-colors duration-200" style={{paddingLeft: '1px'}}
        >
          {!isCollapsed && group.rows.map((row) => (
            <SortableRow
              key={row._id}
              board={board}
              row={row}
              groupId={group._id}
              viewId={view._id}
              columns={view.table.columns}
              renderCell={renderCell}
              isSelected={selectedTasks.some(task => task._id === row._id)}
              onSelectTask={handleSelectTask}
              onTaskClick={handleTaskClick}
            />
          ))}
          
          {/* Add Item button */}
          {!isCollapsed && (isAddingItem ? (
            <div className="flex border-b border-skin-border bg-skin-hover">
              <div className="w-[60px] p-2 border-r border-skin-border bg-skin-card"></div>
              <div className={`${view.table.columns[0]?.width || 'w-[300px]'} p-2 border-r border-skin-border bg-skin-card`}>
                <input
                  type="text"
                  value={newItemTitle}
                  onChange={(e) => setNewItemTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddItem();
                    if (e.key === 'Escape') {
                      setIsAddingItem(false);
                      setNewItemTitle('');
                    }
                  }}
                  onBlur={() => {
                    if (newItemTitle.trim()) {
                      handleAddItem();
                    } else {
                      setIsAddingItem(false);
                    }
                  }}
                  placeholder="Enter item name..."
                  autoFocus
                  className="bg-transparent text-skin-primary w-full p-2 outline-none border border-blue-500 rounded"
                />
              </div>
            </div>
          ) : (
            <div 
              className="flex border-b border-skin-border hover:bg-skin-hover cursor-pointer py-2 px-4 text-skin-secondary"
              onClick={() => setIsAddingItem(true)}
            >
              <div className="flex items-center gap-2">
                <BsPlus className="w-5 h-5" />
                <span>Add Item</span>
              </div>
            </div>
          ))}
        </div>
      </SortableContext>

      {/* Task Actions Menu (floating at the bottom) */}
      <div className="fixed bottom-0 left-0 w-full z-[1000]">
        {showTaskActions && selectedTasks.length > 0 && (
          <TaskActionsMenu
            selectedTasks={selectedTasks}
            onClose={handleCloseTaskActions}
            position={taskActionsPosition}
            onTasksUpdated={handleTasksUpdated}
            viewId={view._id}
            groupId={group._id}
            view={view}
          />
        )}
      </div>

      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Group"
        message="Are you sure you want to delete this group? This action cannot be undone."
      />
    </div>
  );
}

export default TableGroup; 