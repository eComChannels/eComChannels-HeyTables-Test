import React, { useState } from 'react';
import { FaChevronDown, FaLink, FaRobot, FaStar } from 'react-icons/fa';
import axios from '../../../services/api';
import { PRIVACY_TYPES } from '../../../constants/boardTypes';
import { toast } from 'react-toastify';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { FiLayout, FiLock, FiShare2 } from 'react-icons/fi';
import InviteBoardModal from '../../../components/modals/InviteBoardModal';
import { useSelector } from 'react-redux';

function BoardHeader({ board, onBoardUpdate }) {
  const [description, setDescription] = useState(board?.description || '');
  const [isLoading, setIsLoading] = useState(false);
  const [boardType, setBoardType] = useState(board?.privacy || 'main');
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Get current user from Redux state
  const { user } = useSelector((state) => state.auth);
  const isOwner = board?.userId === user?.id;

  const boardTypes = [
    {
      id: 'main',
      label: 'Main',
      icon: <FiLayout className="w-4 h-4" />,
      description: 'Visible to everyone in your account'
    },
    {
      id: 'private',
      label: 'Private',
      icon: <FiLock className="w-4 h-4" />,
      description: 'Only you can access'
    },
    {
      id: 'shareable',
      label: 'Shareable',
      icon: <FiShare2 className="w-4 h-4" />,
      description: 'Can be shared with specific people'
    }
  ];

  const handleSave = async () => {
    try {
      setIsLoading(true);
      const response = await axios.put(`/boards/${board._id}`, {
        boardType,
        description,
        privacy: boardType
      });
      
      onBoardUpdate(response.data);
      toast.success('Board updated successfully', {
        position: "top-right",
        autoClose: 3000,
        theme: "dark"
      });
    } catch (error) {
      console.error('Error updating board:', error);
      if (error.response?.status === 403) {
        toast.error('Only the board owner can change privacy settings', {
          position: "top-right",
          autoClose: 3000,
          theme: "dark"
        });
      } else {
        toast.error('Failed to update board', {
          position: "top-right",
          autoClose: 3000,
          theme: "dark"
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBoardTypeChange = (type) => {
    if (!isOwner) {
      toast.error('Only the board owner can change privacy settings', {
        position: "top-right",
        autoClose: 3000,
        theme: "dark"
      });
      return;
    }
    setBoardType(type);
  };

  const handleInviteClick = () => {
    if (!isOwner) {
      toast.error('Only the board owner can invite users', {
        position: "top-right",
        autoClose: 3000,
        theme: "dark"
      });
      return;
    }
    setShowInviteModal(true);
  };

  return (
    <>
    <div className="relative flex items-center justify-between px-4 py-4 bg-skin-primary">
      <div className="relative">
        <Menu as="div" className="relative">
          {({ close }) => (
            <>
              <Menu.Button className="flex items-center gap-2 hover:bg-skin-hover p-1 rounded transition-colors">
                <h1 className="text-xl text-skin-primary font-medium">
                  {board?.name || 'New Board'}
                </h1>
                <FaChevronDown className="text-skin-secondary w-3 h-3" />
              </Menu.Button>

              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute top-full left-0 mt-2 w-[400px] bg-skin-primary rounded-lg shadow-xl z-50">
                  {/* Header with Star */}
                  <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
                    <h2 className="text-xl text-skin-primary">{board?.name || 'New Board'}</h2>
                    <button className="text-skin-secondary hover:text-yellow-400 transition-colors">
                      <FaStar className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Scrollable Content */}
                  <div className="overflow-y-auto custom-scrollbar">
                    {/* Description */}
                    <div className="px-4 pt-4">
                      <textarea 
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Add a description"
                        className="w-full bg-skin-main text-skin-primary p-3 rounded-lg resize-none min-h-[80px] border border-[var(--border-color)] focus:outline-none focus:ring-2 focus:ring-[#0073EA]"
                      />
                    </div>
                  </div>

                    {/* Privacy Section */}
                    <div className="p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <label className="block text-skin-secondary">Privacy</label>
                        {!isOwner && (
                          <span className="text-xs text-skin-secondary">Only the board owner can change privacy settings</span>
                        )}
                      </div>
                      <div className="space-y-2">
                    {boardTypes.map(type => (
                      <label 
                        key={type.id}
                            className={`flex items-center p-3 rounded-md border border-[var(--border-color)] ${
                              isOwner ? 'hover:bg-skin-hover cursor-pointer' : 'cursor-not-allowed opacity-75'
                            }`}
                      >
                        <input
                          type="radio"
                          name="boardType"
                          value={type.id}
                          checked={boardType === type.id}
                          onChange={() => handleBoardTypeChange(type.id)}
                              disabled={!isOwner}
                              className="mr-3"
                        />
                            <div>
                        <div className="flex items-center gap-2">
                                {type.icon}
                                <span className="text-skin-primary">{type.label}</span>
                          </div>
                              <span className="text-skin-secondary text-sm">{type.description}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                    </div>

                  {/* Action Buttons */}
                  <div className="p-4 border-t border-[var(--border-color)] flex justify-end gap-2">
                    <button 
                      onClick={() => close()}
                      className="px-4 py-2 text-skin-secondary hover:text-skin-primary hover:bg-skin-hover rounded transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => {
                        handleSave();
                        close();
                      }}
                      disabled={isLoading}
                      className="px-4 py-2 bg-[#0073EA] hover:bg-[#0060c2] text-white rounded transition-colors disabled:opacity-50"
                    >
                      {isLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </Menu.Items>
              </Transition>
            </>
          )}
        </Menu>
      </div>

      <div className="flex items-center gap-6">
        {/* <button className="text-sm text-skin-secondary hover:text-skin-primary flex items-center gap-2">
          <FaLink className="w-4 h-4" />
          <span>Integrate</span>
        </button>
        <button className="text-sm text-skin-secondary hover:text-skin-primary flex items-center gap-2">
          <FaRobot className="w-4 h-4" />
          <span>Automate</span>
        </button> */}
        {
          board.privacy === 'shareable' && (  
              <button 
                onClick={handleInviteClick}
                className={`bg-[#0073EA] hover:bg-[#0060c2] text-white px-4 py-1.5 rounded text-sm ${
                  !isOwner && 'opacity-50 cursor-not-allowed'
                }`}
                disabled={!isOwner}
              >
                Invite to Board
            </button>
          )
        }
      </div>
    </div>

      {showInviteModal && (
        <InviteBoardModal
          board={board}
          onClose={() => setShowInviteModal(false)}
        />
      )}
    </>
  );
}

export default BoardHeader; 