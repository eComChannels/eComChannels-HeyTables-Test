import React, { useState, useRef, useEffect } from 'react';
import { HiDotsHorizontal, HiPlus } from 'react-icons/hi';
import { BsTable, BsPencil, BsFiles, BsShare, BsTrash, BsHouseDoor } from 'react-icons/bs';
import axios from '../../../services/api';

function ViewTabs({ boardId, views: passedViews, activeView: passedActiveView, onViewsChange, onChange }) {
  const [views, setViews] = useState(passedViews || []);
  const [activeView, setActiveView] = useState(passedActiveView || null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showViewMenu, setShowViewMenu] = useState(false);
  const [selectedView, setSelectedView] = useState(null);
  const [editingView, setEditingView] = useState(null);
  const [editName, setEditName] = useState('');
  const menuRef = useRef(null);
  const viewMenuRef = useRef(null);
  const inputRef = useRef(null);

  // Reset views and activeView when boardId changes
  useEffect(() => {
    setViews([]);
    setActiveView(null);
    
    const fetchViews = async () => {
      try {
        const response = await axios.get(`/views/${boardId}`);
        setViews(response.data);
        if (response.data.length > 0) {
          setActiveView(response.data[0]);
        }
      } catch (error) {
        console.error('Error fetching views:', error);
      }
    };

    // Fetch views when boardId is available
    if (boardId) {
      fetchViews();
    }
  }, [boardId]);

  // A separate effect to handle passedViews updates
  useEffect(() => {
    if (passedViews?.length > 0) {
      setViews(passedViews);
      if (passedActiveView) {
        setActiveView(passedActiveView);
      }
    }
  }, [passedViews, passedActiveView]);

  // Watch BOTH views and activeView changes
  useEffect(() => {
    if (onViewsChange) {
      onViewsChange({ views, activeView });
    } else if (onChange) {
      onChange({ views, activeView });
    }
  }, [views, activeView]);

  const handleAddView = async () => {
    try {
      const response = await axios.post('/views', {
        name: 'New Table',
        type: 'table',
        boardId: boardId
      });
      setViews(response.data.views);
      setActiveView(response.data.newView);
      setShowAddMenu(false);
    } catch (error) {
      console.error('Error creating view:', error);
    }
  };

  const handleStartRename = (view) => {
    setEditingView(view._id);
    setEditName(view.name);
    setShowViewMenu(false);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleRename = async (view) => {
    try {
      if (editName && editName !== view.name) {
        const response = await axios.put('/views/updateView', {
          viewId: view._id,
          name: editName
        });
        const updatedViews = views.map(v => 
          v._id === view._id ? response.data : v
        );
        setViews(updatedViews);
      }
      setEditingView(null);
    } catch (error) {
      console.error('Error renaming view:', error);
    }
  };

  const handleDuplicate = async (view) => {
    try {
      const response = await axios.post('/views/duplicate', {
        viewId: view._id
      });
      setViews(response.data.views);
      setActiveView(response.data.newView);
      setShowViewMenu(false);
    } catch (error) {
      console.error('Error duplicating view:', error);
    }
  };

  const handleDelete = async (view) => {
    try {
      await axios.delete('/views/deleteView', {
        data: { viewId: view._id }
      });
      const updatedViews = views.filter(v => v._id !== view._id);
      setViews(updatedViews);
      if (view._id === activeView?._id) {
        const defaultView = updatedViews.find(v => v.isDefault);
        setActiveView(defaultView || updatedViews[0] || null);
      }
    } catch (error) {
      console.error('Error deleting view:', error);
    }
  };

  const handleViewClick = (view) => {
    setActiveView(view);
  };

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowAddMenu(false);
      }
      if (viewMenuRef.current && !viewMenuRef.current.contains(event.target)) {
        setShowViewMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex items-center h-12 px-4 border-b border-[var(--border-color)] bg-skin-primary">
      {views.map((view) => (
        <div
          key={view._id}
          className="flex items-center gap-2 relative mr-4"
        >
          <div 
            className={`flex items-center gap-2 cursor-pointer hover:bg-skin-hover px-2 py-1 rounded
              ${view._id === activeView?._id ? 'bg-skin-hover' : ''}`}
            onClick={() => handleViewClick(view)}
          >
            {view.isDefault && (
              <BsHouseDoor className="w-4 h-4 text-skin-secondary" />
            )}
            {editingView === view._id ? (
              <input
                ref={inputRef}
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={() => handleRename(view)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRename(view);
                  if (e.key === 'Escape') setEditingView(null);
                }}
                className="bg-transparent text-sm text-skin-primary font-medium outline-none border-b border-skin-secondary w-[inherit]"
                style={{ width: `${view.name.length * 8}px` }}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="text-sm text-skin-primary font-medium">{view.name}</span>
            )}
          </div>
          {view._id === activeView?._id && (
            <button
              className="hover:bg-skin-hover p-1 rounded"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedView(view);
                setShowViewMenu(true);
              }}
            >
              <HiDotsHorizontal className="w-4 h-4 text-skin-secondary" />
            </button>
          )}
          {showViewMenu && selectedView?._id === view._id && (
            <div 
              ref={viewMenuRef}
              className="absolute z-50 w-48 bg-skin-primary rounded-md shadow-lg border border-[var(--border-color)]"
              style={{ top: '100%', left: '0', marginTop: '2px' }}
            >
              <div 
                className={`px-4 py-2 flex items-center gap-3 
                  ${view.name === 'Main Table' 
                    ? 'cursor-not-allowed text-skin-disabled' 
                    : 'cursor-pointer text-skin-primary hover:bg-skin-hover'}`}
                onClick={() => view.name !== 'Main Table' && handleStartRename(view)}
              >
                <BsPencil className="w-3.5 h-3.5" />
                <span className="text-sm">Rename</span>
              </div>
              <div 
                className="px-4 py-2 hover:bg-skin-hover cursor-pointer text-skin-primary flex items-center gap-3"
                onClick={() => handleDuplicate(view)}
              >
                <BsFiles className="w-3.5 h-3.5" />
                <span className="text-sm">Duplicate</span>
              </div>
              <div className="px-4 py-2 hover:bg-skin-hover cursor-pointer text-skin-primary flex items-center gap-3">
                <BsShare className="w-3.5 h-3.5" />
                <span className="text-sm">Share</span>
              </div>
              <div 
                className={`px-4 py-2 flex items-center gap-3 
                  ${view.name === 'Main Table' 
                    ? 'cursor-not-allowed text-red-400/40' 
                    : 'cursor-pointer text-red-400 hover:bg-skin-hover'}`}
                onClick={() => view.name !== 'Main Table' && handleDelete(view)}
              >
                <BsTrash className="w-3.5 h-3.5" />
                <span className="text-sm">Delete</span>
              </div>
            </div>
          )}
        </div>
      ))}

      <div className="relative" ref={menuRef}>
        <button
          className="p-1 hover:bg-skin-hover rounded"
          onClick={() => setShowAddMenu(!showAddMenu)}
        >
          <HiPlus className="w-4 h-4 text-skin-secondary" />
        </button>

        {showAddMenu && (
          <div 
            className="absolute z-50 w-48 bg-skin-primary rounded-md shadow-lg border border-[var(--border-color)]"
            style={{ top: '100%', left: '0', marginTop: '2px' }}
          >
            <div
              className="px-4 py-2 hover:bg-skin-hover cursor-pointer flex items-center gap-3 text-skin-primary"
              onClick={handleAddView}
            >
              <BsTable className="w-3.5 h-3.5" />
              <span className="text-sm">Table</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ViewTabs; 