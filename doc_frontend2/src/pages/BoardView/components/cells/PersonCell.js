import React, { useState } from 'react';
import { BsPerson } from 'react-icons/bs';
import { Menu } from '@mui/material';
import { useSelector } from 'react-redux';
import { MdLock } from 'react-icons/md';

const PersonCell = ({ value, users = [], cellId, rowId, groupId, boardId, onUpdateCell, column, board }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [searchText, setSearchText] = useState('');
  const open = Boolean(anchorEl);

  const { user } = useSelector((state) => state.auth);
  const isOwner = board?.userId === user?.id;

  const canEdit = column?.canEdit?.some(u => u._id === user?.id);
  const canView = column?.canView?.some(u => u._id === user?.id);

  // Get selected users array from value
  const selectedUsers = value || [];
  // Filter users based on search
  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleClick = (event) => {
    if (canEdit || isOwner) {
      setAnchorEl(event.currentTarget);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelectUser = (user) => {
    const newSelected = [...selectedUsers];
    if (!newSelected.find(u => u._id === user._id)) {
      newSelected.push(user);
      onUpdateCell({
        value: newSelected,
        cellId,
        rowId,
        groupId,
        boardId
      });
    }
  };

  const handleRemoveUser = (userId) => {
    const newSelected = selectedUsers.filter(user => user._id !== userId);
    onUpdateCell({
      value: newSelected,
      cellId,
      rowId,
      groupId,
      boardId
    });
  };

  if (!canView && !isOwner) {
    return (
      <div className="flex p-2 items-center justify-center w-full h-full bg-skin-muted">
        <MdLock className="text-skin-muted" size={16} />
      </div>
    );
  }

  return (
    <div className="flex items-center px-3 justify-center" style={{ height: '100%' }}>
      <div className="flex -space-x-2 cursor-pointer" onClick={handleClick}>
        {selectedUsers.length > 0 ? (
          <>
            {selectedUsers.slice(0, 3).map((user, index) => (
              <div 
                key={user._id}
                className="w-8 h-8 rounded-full bg-monday-blue flex items-center justify-center text-white ring-2 ring-skin-main"
              >
                {user.email[0].toUpperCase()}
              </div>
            ))}
            {selectedUsers.length > 3 && (
              <div className="w-8 h-8 rounded-full bg-skin-primary flex items-center justify-center text-skin-primary ring-2 ring-skin-main">
                +{selectedUsers.length - 3}
              </div>
            )}
          </>
        ) : (
          <div className="w-8 h-8 rounded-full bg-skin-primary flex items-center justify-center">
            <BsPerson className="text-skin-secondary w-5 h-5" />
          </div>
        )}
      </div>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
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
          {selectedUsers.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {selectedUsers.map(user => (
                <div key={user._id} className="flex items-center gap-1 bg-skin-primary px-2 py-1 rounded">
                  <div className="w-6 h-6 rounded-full bg-monday-blue flex items-center justify-center text-white">
                    {user.email[0].toUpperCase()}
                  </div>
                  <span className="text-skin-primary">{user.email}</span>
                  <span 
                    className="cursor-pointer ml-1 text-skin-secondary hover:text-skin-primary"
                    onClick={() => handleRemoveUser(user._id)}
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
                onClick={() => handleSelectUser(user)}
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
    </div>
  );
};

export default PersonCell; 