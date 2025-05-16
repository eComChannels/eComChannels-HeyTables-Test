import React, { useState, useEffect } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';
import api from '../../../services/api';

const BoardSelectionModal = ({ isOpen, onClose, onSelectBoard, currentBoardId }) => {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBoard, setSelectedBoard] = useState(null);

  useEffect(() => {
    const fetchBoards = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/boards');
        // Filter out the current board
        const filteredBoards = data.filter(board => board._id !== currentBoardId);
        setBoards(filteredBoards);
        setError(null);
      } catch (err) {
        console.error('Error fetching boards:', err);
        setError('Failed to load boards. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchBoards();
      setSearchQuery('');
      setSelectedBoard(null);
    }
  }, [isOpen, currentBoardId]);

  if (!isOpen) return null;

  const filteredBoards = boards.filter(board => 
    board.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectBoard = (board) => {
    setSelectedBoard(board);
  };

  const handleConfirm = () => {
    if (selectedBoard) {
      onSelectBoard(selectedBoard);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[999] flex items-center justify-center">
      <div 
        className="bg-skin-main border border-skin-border rounded-lg shadow-xl max-w-md w-full mx-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-skin-border">
          <h2 className="font-medium text-skin-primary text-lg">Choose board</h2>
          <button 
            onClick={onClose}
            className="text-skin-secondary hover:text-skin-primary"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4">
          <div className="relative mb-4">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-skin-secondary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search board"
              className="w-full bg-skin-input border border-skin-border rounded-md py-2 pl-10 pr-4 text-skin-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="text-center py-4 text-red-500">
              {error}
              <button 
                onClick={() => setLoading(true)} 
                className="block mx-auto mt-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Retry
              </button>
            </div>
          ) : filteredBoards.length === 0 ? (
            <div className="text-center py-4 text-skin-secondary">
              No boards found matching your search.
            </div>
          ) : (
            <div className="max-h-[240px] overflow-y-auto">
              {filteredBoards.map(board => (
                <button
                  key={board._id}
                  className={`w-full flex items-center p-3 rounded-md hover:bg-skin-hover mb-1 text-left ${
                    selectedBoard?._id === board._id 
                      ? 'bg-green-900/20 hover:bg-green-900/30' 
                      : ''
                  }`}
                  onClick={() => handleSelectBoard(board)}
                >
                  <div 
                    className={`w-5 h-5 rounded-full mr-3 flex-shrink-0 ${
                      selectedBoard?._id === board._id 
                        ? 'bg-green-500' 
                        : 'bg-blue-500'
                    }`}
                  >
                    {selectedBoard?._id === board._id && (
                      <div className="flex items-center justify-center h-full text-white font-bold">✓</div>
                    )}
                  </div>
                  <span>{board.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex justify-end gap-2 p-4 border-t border-skin-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-skin-primary bg-skin-button-secondary border border-skin-border rounded-md hover:bg-skin-hover"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedBoard}
            className={`px-4 py-2 text-white rounded-md ${
              selectedBoard 
                ? 'bg-blue-500 hover:bg-blue-600' 
                : 'bg-blue-300 cursor-not-allowed'
            }`}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default BoardSelectionModal; 