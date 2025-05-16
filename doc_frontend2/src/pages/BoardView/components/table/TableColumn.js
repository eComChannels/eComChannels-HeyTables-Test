import React, { useState, useRef, useEffect } from 'react';
import { BsThreeDots } from 'react-icons/bs';
import { MdEdit, MdDelete, MdLock, MdVisibility } from 'react-icons/md';
import { Menu, MenuItem } from '@mui/material';
import api from '../../../../services/api';
import { COLUMN_TYPES } from '../../../../config/columnTypes';
import ConfirmModal from '../../../../components/modals/ConfirmModal';
import { useSelector } from 'react-redux';
import axios from "../../../../services/api";

const TableColumn = ({ board, column, groupId, isFirstColumn, viewId, onViewUpdate }) => {
  const [hoveredColumnId, setHoveredColumnId] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [titleValue, setTitleValue] = useState(column.title);
  const [canHandleBlur, setCanHandleBlur] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const inputRef = useRef(null);

  const [editMenuAnchorEl, setEditMenuAnchorEl] = useState(null);
  const [viewMenuAnchorEl, setViewMenuAnchorEl] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [selectedEditUsers, setSelectedEditUsers] = useState(column?.canEdit || []);
  const [selectedViewUsers, setSelectedViewUsers] = useState(column?.canView || []);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);

  const columnType = COLUMN_TYPES.find(type => type.value === column.type);
  const columnWidth = column.width || columnType?.width || 150;

  const { user } = useSelector((state) => state.auth);
  const isOwner = board?.userId === user?.id;

  // Fetch all users when component mounts
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get("/users/cellUsers");
        setAllUsers(response.data.filter(u => u._id !== user.id)); // Exclude current user
        setFilteredUsers(response.data.filter(u => u._id !== user.id));
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    fetchUsers();
  }, [user.id]);

  // Filter users based on search text and current menu
  useEffect(() => {
    if (editMenuAnchorEl) {
      const filtered = allUsers.filter(user => 
        user.email.toLowerCase().includes(searchText.toLowerCase()) &&
        !selectedEditUsers.some(selected => selected._id === user._id)
      );
      setFilteredUsers(filtered);
    } else if (viewMenuAnchorEl) {
      const filtered = allUsers.filter(user => 
        user.email.toLowerCase().includes(searchText.toLowerCase()) &&
        !selectedViewUsers.some(selected => selected._id === user._id)
      );
      setFilteredUsers(filtered);
    }
  }, [searchText, selectedEditUsers, selectedViewUsers, allUsers, editMenuAnchorEl, viewMenuAnchorEl]);

  const handleMenuOpen = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEditMenuOpen = (event) => {
    event.stopPropagation();
    setEditMenuAnchorEl(event.currentTarget);
    handleMenuClose();
  };

  const handleEditMenuClose = () => {
    setEditMenuAnchorEl(null);
    setSearchText('');
  };

  const handleViewMenuOpen = (event) => {
    event.stopPropagation();
    setViewMenuAnchorEl(event.currentTarget);
    handleMenuClose();
  };

  const handleViewMenuClose = () => {
    setViewMenuAnchorEl(null);
    setSearchText('');
  };

  const handleUpdateCellEditPermissions = async ({ value}) => {
    try {
      const { data: updatedView } = await api.put('/views/updateCellPermissions', {
        viewId,
        columnId: column._id,
        value
      });
      onViewUpdate(updatedView);
    } catch (error) {
      console.error('Error updating cell edit permissions:', error);
    }
  };
  

  const handleSelectEditUser = (user) => {
    const newSelected = [...selectedEditUsers];
    if (!newSelected.find(u => u._id === user._id)) {
      newSelected.push(user);
      setSelectedEditUsers(newSelected);
      handleUpdateCellEditPermissions({
        value: newSelected,
      });
    }
  };

  const handleRemoveEditUser = (userId) => {
    const newSelected = selectedEditUsers.filter(user => user._id !== userId);
    setSelectedEditUsers(newSelected);
    handleUpdateCellEditPermissions({
      value: newSelected,
    });
  };

  const handleUpdateCellViewPermissions = async ({ value}) => {
    try {
      const { data: updatedView } = await api.put('/views/updateCellViewPermissions', {
        viewId,
        columnId: column._id,
        value
      });
      onViewUpdate(updatedView);
    } catch (error) {
      console.error('Error updating cell view permissions:', error);
    }
  };
  

  const handleSelectViewUser = (selectedUser) => {
    const newSelected = [...selectedViewUsers];
    if (!newSelected.find(u => u._id === selectedUser._id)) {
      newSelected.push(selectedUser);
      setSelectedViewUsers(newSelected);
      handleUpdateCellViewPermissions({
        value: newSelected,
      });
    }
  };  

  const handleRemoveViewUser = (userId) => {
    const newSelected = selectedViewUsers.filter(user => user._id !== userId);
    setSelectedViewUsers(newSelected);
    handleUpdateCellViewPermissions({
      value: newSelected,
    });
  };

  const handleDelete = () => {
    setShowConfirmModal(true);
    handleMenuClose();
  };

  const handleConfirmDelete = async () => {
    try {
      const { data: updatedView } = await api.post('/views/deleteColumn', {
        viewId,
        columnId: column._id
      });
      onViewUpdate(updatedView);
      setShowConfirmModal(false);
    } catch (error) {
      console.error('Error deleting column:', error);
    }
  };

  const handleStartRename = () => {
    setCanHandleBlur(false);
    setIsEditing(true);
    handleMenuClose();
    setTimeout(() => {
      inputRef.current?.focus();
      setCanHandleBlur(true);
    }, 100);
  };

  const handleRenameColumn = async () => {
    setIsEditing(false);
    if (titleValue !== column.title) {
      try {
        const { data: updatedView } = await api.put('/views/renameColumn', {
          viewId,
          columnId: column._id,
          title: titleValue
        });
        onViewUpdate(updatedView);
      } catch (error) {
        console.error('Error:', error);
        setTitleValue(column.title);
      }
    }
  };

  const handleRestrictColumnEditing = (event) => {
    handleEditMenuOpen(event);
  };

  const handleRestrictColumnView = (event) => {
    handleViewMenuOpen(event);
  };

  return (
    <div 
      // onMouseEnter={() => setHoveredColumnId(column._id)}
      // onMouseLeave={() => setHoveredColumnId(null)}
      className={`flex items-center border-r border-skin-border ${columnType.width} ${columnType.align || 'text-center'} overflow-hidden group relative ${
        column.type === 'item' ? 'bg-skin-card z-10 sticky left-0 bg-[var(--color-card-darker)]' : 'bg-skin-card'
      }`}
      style={{ 
        minWidth: columnWidth,
        minHeight: "40px",
        height: "100%" 
      }}
    >
      <div className={`flex-1 px-4 py-2 ${hoveredColumnId === column._id ? 'pr-8' : ''}`}>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={() => canHandleBlur && handleRenameColumn()}
              onKeyDown={(e) => e.key === 'Enter' && handleRenameColumn()}
              className="bg-transparent text-skin-secondary outline-none border border-[#0073ea] rounded px-2 w-full"
            />
          ) : (
            <span className="text-skin-secondary font-medium truncate">{column.title}</span>
          )}
        </div>
      </div>
      {!isFirstColumn && (
        <button
          onClick={handleMenuOpen}
          className="absolute right-0 top-1/2 -translate-y-1/2 p-1 hover:bg-skin-hover rounded opacity-0 group-hover:opacity-100 mr-1"
        >
          <BsThreeDots className="w-3.5 h-3.5 text-skin-secondary" />
        </button>
      )}

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
            backgroundColor: 'var(--color-card)',
            color: 'var(--color-text-primary)',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
            zIndex: 9000,
            '& .MuiMenuItem-root': {
              py: 0.75,
              px: 2,
              fontSize: '13px',
            },
          },
        }}
      >
        <MenuItem 
          onClick={handleStartRename}
          className="text-skin-secondary hover:bg-skin-hover"
          disabled={!isOwner}
        >
          <MdEdit className="w-4 h-4 mr-2" />
          Edit column title
        </MenuItem>
        <MenuItem 
          onClick={handleRestrictColumnEditing}
          className="text-skin-secondary hover:bg-skin-hover"
          disabled={!isOwner}
        >
          <MdLock className="w-4 h-4 mr-2" />
          {column.restrictions?.editingRestricted ? 'Edit editing restrictions' : 'Restrict column editing'}
        </MenuItem>
        <MenuItem 
          onClick={handleRestrictColumnView}
          className="text-skin-secondary hover:bg-skin-hover"
          disabled={!isOwner}
        >
          <MdVisibility className="w-4 h-4 mr-2" />
          {column.restrictions?.viewRestricted ? 'Edit view restrictions' : 'Restrict column view'}
        </MenuItem>
        <MenuItem 
          onClick={handleDelete}
          className="text-[#e2445c] hover:bg-skin-hover"
          disabled={!isOwner}
        >
          <MdDelete className="w-4 h-4 mr-2" />
          Delete column
        </MenuItem>
      </Menu>

      {/* Edit Restrictions Menu */}
      <Menu
        anchorEl={editMenuAnchorEl}
        open={Boolean(editMenuAnchorEl)}
        onClose={handleEditMenuClose}
        PaperProps={{
          sx: {
            bgcolor: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            minWidth: 280,
            padding: '16px',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
          }
        }}
      >
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-medium">Restrict Editing Access</h3>
          
          {selectedEditUsers.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {selectedEditUsers.map(user => (
                <div key={user._id} className="flex items-center gap-1 bg-skin-primary px-2 py-1 rounded">
                  <div className="w-6 h-6 rounded-full bg-monday-blue flex items-center justify-center text-white">
                    {user.email[0].toUpperCase()}
                  </div>
                  <span className="text-skin-primary">{user.email}</span>
                  <span 
                    className="cursor-pointer ml-1 text-skin-secondary hover:text-skin-primary"
                    onClick={() => handleRemoveEditUser(user._id)}
                  >×</span>
                </div>
              ))}
            </div>
          )}

          <input
            type="text"
            placeholder="Search names, roles or teams"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full p-2 bg-skin-primary text-skin-primary rounded border border-[var(--border-color)] outline-none focus:ring-2 focus:ring-monday-blue/20"
          />
          
          <div>
            <div className="text-sm text-skin-secondary mb-2">Suggested people</div>
            {filteredUsers.map(user => (
              <div 
                key={user._id}
                className="flex items-center gap-2 p-2 hover:bg-skin-hover cursor-pointer rounded"
                onClick={() => handleSelectEditUser(user)}
              >
                <div className="w-6 h-6 rounded-full bg-monday-blue flex items-center justify-center text-white">
                  {user.email[0].toUpperCase()}
                </div>
                <span className="text-skin-primary">{user.email}</span>
              </div>
            ))}
          </div>
        </div>
      </Menu>

      {/* View Restrictions Menu */}
      <Menu
        anchorEl={viewMenuAnchorEl}
        open={Boolean(viewMenuAnchorEl)}
        onClose={handleViewMenuClose}
        PaperProps={{
          sx: {
            bgcolor: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            minWidth: 280,
            padding: '16px',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
          }
        }}
      >
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-medium">Restrict Viewing Access</h3>
          
          {selectedViewUsers.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {selectedViewUsers.map(user => (
                <div key={user._id} className="flex items-center gap-1 bg-skin-primary px-2 py-1 rounded">
                  <div className="w-6 h-6 rounded-full bg-monday-blue flex items-center justify-center text-white">
                    {user.email[0].toUpperCase()}
                  </div>
                  <span className="text-skin-primary">{user.email}</span>
                  <span 
                    className="cursor-pointer ml-1 text-skin-secondary hover:text-skin-primary"
                    onClick={() => handleRemoveViewUser(user._id)}
                  >×</span>
                </div>
              ))}
            </div>
          )}

          <input
            type="text"
            placeholder="Search names, roles or teams"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full p-2 bg-skin-primary text-skin-primary rounded border border-[var(--border-color)] outline-none focus:ring-2 focus:ring-monday-blue/20"
          />
          
          <div>
            <div className="text-sm text-skin-secondary mb-2">Suggested people</div>
            {filteredUsers.map(user => (
              <div 
                key={user._id}
                className="flex items-center gap-2 p-2 hover:bg-skin-hover cursor-pointer rounded"
                onClick={() => handleSelectViewUser(user)}
              >
                <div className="w-6 h-6 rounded-full bg-monday-blue flex items-center justify-center text-white">
                  {user.email[0].toUpperCase()}
                </div>
                <span className="text-skin-primary">{user.email}</span>
              </div>
            ))}
          </div>
        </div>
      </Menu>

      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Column"
        message="Are you sure you want to delete this column? This action cannot be undone."
      />
    </div>
  );
};

export default TableColumn; 