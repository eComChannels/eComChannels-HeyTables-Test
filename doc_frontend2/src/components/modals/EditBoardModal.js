import React, { useState } from 'react';
import { toast } from 'react-toastify';
import {
  FaTimes,
  FaLock,
  FaShare,
} from 'react-icons/fa';
import axios from '../../services/api';

function EditBoardModal({ board, onClose, onBoardUpdated }) {
  const [boardName, setBoardName] = useState(board.name);
  const [privacy, setPrivacy] = useState(board.privacy);
  const [managing, setManaging] = useState(board.managing_type);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!boardName.trim()) {
      toast.error('Please enter a board name');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await axios.put(`/boards/${board._id}`, {
        name: boardName,
        privacy: privacy,
        managing_type: managing,
      });

      toast.success('Board updated successfully!');
      onBoardUpdated(response.data);
      onClose();
    } catch (error) {
      console.error('Error updating board:', error);
      toast.error('Failed to update board');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-skin-primary rounded-lg w-[500px] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-[var(--border-color)]">
          <h2 className="text-xl text-skin-primary font-medium">Edit board</h2>
          <button onClick={onClose} className="text-skin-secondary hover:text-skin-primary">
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Board Name */}
          <div className="mb-6">
            <label className="block text-skin-secondary mb-2">Board name</label>
            <input
              type="text"
              value={boardName}
              onChange={(e) => setBoardName(e.target.value)}
              className="w-full bg-skin-main border border-[var(--border-color)] rounded-md px-4 py-2 text-skin-primary focus:outline-none focus:ring-2 focus:ring-[#00CA72]"
            />
          </div>

          {/* Privacy */}
          <div className="mb-6">
            <label className="block text-skin-secondary mb-2">Privacy</label>
            <div className="space-y-2">
              <label className="flex items-center p-2 rounded hover:bg-skin-hover cursor-pointer">
                <input
                  type="radio"
                  name="privacy"
                  value="main"
                  checked={privacy === 'main'}
                  onChange={(e) => setPrivacy(e.target.value)}
                  className="mr-3"
                />
                <span className="text-skin-secondary">Main</span>
                <span className="text-skin-secondary text-sm ml-2">Visible to everyone in your account</span>
              </label>
              <label className="flex items-center p-2 rounded hover:bg-skin-hover cursor-pointer">
                <input
                  type="radio"
                  name="privacy"
                  value="private"
                  checked={privacy === 'private'}
                  onChange={(e) => setPrivacy(e.target.value)}
                  className="mr-3"
                />
                <FaLock className="mr-2 text-skin-secondary" />
                <span className="text-skin-secondary">Private</span>
              </label>
              <label className="flex items-center p-2 rounded hover:bg-skin-hover cursor-pointer">
                <input
                  type="radio"
                  name="privacy"
                  value="shareable"
                  checked={privacy === 'shareable'}
                  onChange={(e) => setPrivacy(e.target.value)}
                  className="mr-3"
                />
                <FaShare className="mr-2 text-skin-secondary" />
                <span className="text-skin-secondary">Shareable</span>
              </label>
            </div>
          </div>

          {/* Managing Options */}
          <div>
            <label className="block text-gray-400 mb-2">Select what you're managing in this board</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                'Items', 'Budgets', 'Employees', 'Campaigns',
                'Leads', 'Projects', 'Creatives', 'Clients',
                'Tasks'
              ].map((option) => (
                <label key={option.toLowerCase()} className="flex items-center p-2 rounded hover:bg-skin-hover cursor-pointer">
                  <input
                    type="radio"
                    name="managing"
                    value={option.toLowerCase()}
                    checked={managing === option.toLowerCase()}
                    onChange={(e) => setManaging(e.target.value)}
                    className="mr-3"
                  />
                  <span className="text-skin-secondary">{option}</span>
                </label>
              ))}
              <label className="flex items-center p-2 rounded hover:bg-skin-hover cursor-pointer">
                <input
                  type="radio"
                  name="managing"
                  value="custom"
                  checked={managing === 'custom'}
                  onChange={(e) => setManaging(e.target.value)}
                  className="mr-3"
                />
                <input
                  type="text"
                  placeholder="Custom"
                  className="bg-transparent text-white placeholder-gray-400 focus:outline-none"
                  disabled={managing !== 'custom'}
                />
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[var(--border-color)] flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !boardName.trim()}
            className="px-6 py-2 text-white bg-[#0073ea] rounded-md hover:bg-[#0060b9] transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditBoardModal; 