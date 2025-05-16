import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from '../../services/api';
import { 
  FaHome, 
  FaProjectDiagram,
  FaChevronLeft,
  FaPlus,
  FaClipboard,
  FaEllipsisH,
  FaEdit,
  FaTrash,
  FaLock,
  FaShareAlt,
  FaUserEdit,
  FaEye
} from 'react-icons/fa';
import CreateBoardModal from '../modals/CreateBoardModal';
import EditBoardModal from '../modals/EditBoardModal';
import { toast } from 'react-toastify';
import ConfirmModal from '../modals/ConfirmModal';
import { useSelector } from 'react-redux';

function Sidebar({ isOpen, onToggle }) {
  const [boards, setBoards] = useState([]);
  const [activeMenu, setActiveMenu] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCreateBoard, setShowCreateBoard] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editingBoard, setEditingBoard] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [boardToDelete, setBoardToDelete] = useState(null);
  const navigate = useNavigate();
  const { url } = useParams();
  const { user } = useSelector((state) => state.auth);

  // Organize boards by type
  const organizedBoards = {
    owned: boards.filter(board => board.isOwner),
    shared: boards.filter(board => !board.isOwner && board.members.some(m => m.userId === user?.id)),
    public: boards.filter(board => !board.isOwner && board.privacy === 'main')
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'owner':
        return null;
      case 'editor':
        return <FaUserEdit className="w-3 h-3 text-skin-secondary" title="Editor" />;
      case 'viewer':
        return <FaEye className="w-3 h-3 text-skin-secondary" title="Viewer" />;
      default:
        return null;
    }
  };

  const getPrivacyIcon = (privacy) => {
    switch (privacy) {
      case 'private':
        return <FaLock className="w-3 h-3 text-skin-secondary" title="Private" />;
      case 'shareable':
        return <FaShareAlt className="w-3 h-3 text-skin-secondary" title="Shareable" />;
      default:
        return null;
    }
  };

  useEffect(() => {
    fetchBoards();
  }, []);

  const fetchBoards = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('/boards');
      setBoards(response.data);
    } catch (error) {
      console.error('Error fetching boards:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBoardCreated = (newBoard) => {
    setBoards(prevBoards => [...prevBoards, newBoard]);
  };

  const handleEdit = (board) => {
    setEditingBoard(board);
    setActiveMenu(null);
  };

  const handleDelete = async (board) => {
    if (board.userId !== user?.id) {
      toast.error('Only the board owner can delete this board');
      return;
    }
    setBoardToDelete(board);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    try {
      // Get current URL from window.location
      const currentUrl = window.location.pathname.split('/board/')[1];
      
      // First check if this is the current board
      const isCurrentBoard = boardToDelete.url === currentUrl;      
      // Get all boards before deletion to find where to redirect
      const updatedBoards = boards.filter(b => b._id !== boardToDelete._id);
      
      // Delete from server
      await axios.delete(`/boards/${boardToDelete._id}`);
      
      // Update local state
      setBoards(updatedBoards);
      
      // Handle redirect BEFORE closing modals
      if (isCurrentBoard) {
        if (updatedBoards.length > 0) {
          window.location.href = `/board/${updatedBoards[0].url}`;
        } else {
          window.location.href = '/';
        }
      }

      // Clean up UI
      setDeleteConfirmOpen(false);
      setBoardToDelete(null);
      toast.success('Board deleted successfully!');
      
    } catch (error) {
      console.error('Error deleting board:', error);
      if (error.response?.status === 403) {
        toast.error('Only the board owner can delete this board');
      } else {
        toast.error('Failed to delete board');
      }
    }
  };

  const handleBoardUpdated = (updatedBoard) => {
    setBoards(prevBoards =>
      prevBoards.map(board =>
        board._id === updatedBoard._id ? updatedBoard : board
      )
    );
  };

  const handlePlusClick = (e) => {
    e.stopPropagation();
    setShowDropdown(!showDropdown);
  };

  const handleBoardClick = (e) => {
    e.preventDefault();
    setShowDropdown(false);
    setShowCreateBoard(true);
  };

  React.useEffect(() => {
    const closeDropdown = () => setShowDropdown(false);
    document.addEventListener('click', closeDropdown);
    return () => document.removeEventListener('click', closeDropdown);
  }, []);

  const renderBoardSection = (title, boardsList) => {
    if (!boardsList || boardsList.length === 0) return null;
    
    return (
      <div className="mt-4">
        <div className="px-3 py-1 text-xs text-skin-secondary uppercase">{title}</div>
        {boardsList.map(board => (
          <div key={board._id} className="group relative flex items-center">
            <Link
              to={`/board/${board.url}`}
              className="flex flex-1 items-center px-3 py-2 text-skin-secondary hover:bg-skin-hover rounded transition-colors"
            >
              <FaClipboard className="w-4 h-4 mr-3" />
              <span className="text-sm flex-1">{board.name}</span>
              <div className="flex items-center gap-2">
                {getRoleIcon(board.role)}
                {getPrivacyIcon(board.privacy)}
              </div>
            </Link>
            {board.isOwner && (
              <button
                onClick={() => setActiveMenu(activeMenu === board._id ? null : board._id)}
                className="absolute right-2 p-1 text-skin-secondary hover:text-skin-primary opacity-0 group-hover:opacity-100"
              >
                <FaEllipsisH className="w-3 h-3" />
              </button>
            )}
            
            {/* Popup Menu */}
            {activeMenu === board._id && board.isOwner && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-skin-primary rounded-md shadow-lg z-50">
                <div className="py-1">
                  <button
                    onClick={() => {
                      handleEdit(board);
                      setActiveMenu(null);
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-skin-secondary hover:bg-skin-hover hover:text-skin-primary"
                  >
                    <FaEdit className="mr-2" />
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      handleDelete(board);
                      setActiveMenu(null);
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-400 hover:bg-skin-hover hover:text-red-300"
                  >
                    <FaTrash className="mr-2" />
                    Delete
                  </button>
                  {/* <Link
                    to={`/taskboard/${board._id}`}
                    onClick={() => setActiveMenu(null)}
                    className="flex items-center w-full px-4 py-2 text-sm text-skin-secondary hover:bg-skin-hover hover:text-skin-primary"
                  >
                    <FaClipboard className="mr-2" />
                    View as Task Board
                  </Link> */}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <div className="flex h-full">
        <div className={`${isOpen ? 'w-[255px]' : 'w-0'} transition-all duration-200 bg-skin-primary rounded-lg overflow-hidden flex-shrink-0 relative`}>
          {isOpen && (
            <button
              onClick={onToggle}
              className="absolute top-3 right-3 p-1 text-skin-secondary hover:text-skin-primary hover:bg-skin-hover rounded transition-colors"
            >
              <FaChevronLeft className="w-3 h-3" />
            </button>
          )}

          <div className="w-[255px] h-full flex flex-col">
            <div className="flex-1 overflow-y-auto">
              <div className="px-2 py-1">
                <SidebarLink icon={<FaHome />} text="Home" to="/" />
                
                {/* My Workflow with plus button */}
                <div className="flex items-center justify-between">
                  <SidebarLink icon={<FaProjectDiagram />} text="My Workflow" to="/workflow" />
                  <button 
                    onClick={handlePlusClick}
                    className="px-2 py-1 mr-2 border border-[var(--border-color)] rounded-md hover:bg-skin-hover transition-all flex items-center justify-center"
                    title="Add new item"
                  >
                    <FaPlus className="w-3 h-3 text-skin-secondary hover:text-skin-primary" />
                  </button>
                </div>

                {/* Board Sections */}
                {renderBoardSection('My Boards', organizedBoards.owned)}
                {renderBoardSection('Shared With Me', organizedBoards.shared)}
                {renderBoardSection('Public Boards', organizedBoards.public)}
              </div>
            </div>
          </div>
        </div>

        {/* Toggle Strip */}
        {!isOpen && (
          <div className="w-6 bg-skin-primary rounded-lg border-r border-[var(--border-color)] flex-shrink-0">
            <button
              onClick={onToggle}
              className="w-full h-[50px] flex items-center justify-center text-skin-secondary hover:text-skin-primary hover:bg-skin-hover rounded-tl-lg rounded-bl-lg"
            >
              <FaChevronLeft className="w-3 h-3 rotate-180" />
            </button>
          </div>
        )}
      </div>

      {/* Popup Menu */}
      {showDropdown && (
        <div className="absolute z-50 bg-skin-primary rounded-md shadow-xl border border-[var(--border-color)] w-[200px] left-[270px] top-[120px]">
          <div className="py-1">
            <div className="px-3 py-2 text-sm text-skin-secondary border-b border-[var(--border-color)]">Add new</div>
            <Link 
              to="#"
              onClick={handleBoardClick}
              className="w-full px-4 py-2.5 text-left text-skin-primary hover:bg-skin-hover flex items-center"
            >
              <div className="w-5 h-5 mr-3 flex items-center justify-center">
                <FaClipboard className="w-4 h-4 text-[#00CA72]" />
              </div>
              <span className="text-[14px]">Board</span>
            </Link>
            <Link 
              to="/doc"
              className="w-full px-4 py-2.5 text-left text-skin-primary hover:bg-skin-hover flex items-center transition-colors"
            >
              <div className="w-5 h-5 mr-3 flex items-center justify-center">
                <FaClipboard className="w-4 h-4 text-[#00CA72]" />
              </div>
              <span className="text-[14px] text-skin-primary">Doc</span>
            </Link>
            <Link 
              to="/form"
              className="w-full px-4 py-2.5 text-left text-skin-primary hover:bg-skin-hover flex items-center transition-colors"
            >
              <div className="w-5 h-5 mr-3 flex items-center justify-center">
                <FaClipboard className="w-4 h-4 text-[#00CA72]" />
              </div>
              <span className="text-[14px] text-skin-primary">Form</span>
            </Link>
          </div>
        </div>
      )}

      {/* CreateBoardModal with onBoardCreated prop */}
      {showCreateBoard && (
        <CreateBoardModal 
          onClose={() => setShowCreateBoard(false)}
          onBoardCreated={handleBoardCreated}
        />
      )}

      {editingBoard && (
        <EditBoardModal
          board={editingBoard}
          onClose={() => setEditingBoard(null)}
          onBoardUpdated={handleBoardUpdated}
        />
      )}

      <ConfirmModal
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setBoardToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Board"
        message={`Are you sure you want to delete "${boardToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        type="danger"
      />
    </>
  );
}

function SidebarLink({ icon, text, to }) {
  return (
    <Link 
      to={to}
      className="flex items-center px-3 py-2.5 rounded text-skin-secondary hover:text-skin-primary hover:bg-skin-hover transition-colors w-full"
    >
      <span className="mr-3">
        {React.cloneElement(icon, { className: "w-4 h-4" })}
      </span>
      <span className="text-[15px] font-medium tracking-wide">{text}</span>
    </Link>
  );
}

export default Sidebar; 