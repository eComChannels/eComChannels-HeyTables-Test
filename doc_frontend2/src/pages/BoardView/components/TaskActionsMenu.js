import React, { useState, useRef, useEffect } from 'react';
import { 
  FiCopy, 
  FiDownload, 
  FiArchive, 
  FiTrash2, 
  FiRefreshCw, 
  FiArrowRight, 
  FiGrid,
  FiLoader,
  FiLayers,
  FiLayout
} from 'react-icons/fi';
import api from '../../../services/api';
import GroupSelectionModal from './GroupSelectionModal';
import BoardSelectionModal from './BoardSelectionModal';

const TaskActionsMenu = ({ 
  selectedTasks, 
  onClose, 
  position, 
  onTasksUpdated,
  viewId,
  groupId,
  view  // Add view prop to access all groups
}) => {
  const [loading, setLoading] = useState({
    duplicate: false,
    export: false,
    archive: false,
    delete: false,
    convert: false,
    moveTo: false,
    apps: false
  });
  
  const [showMoveToOptions, setShowMoveToOptions] = useState(false);
  const [showGroupSelectionModal, setShowGroupSelectionModal] = useState(false);
  const [showBoardSelectionModal, setShowBoardSelectionModal] = useState(false);
  const moveToRef = useRef(null);
  
  // Close the move to submenu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (moveToRef.current && !moveToRef.current.contains(event.target)) {
        setShowMoveToOptions(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [moveToRef]);
  
  if (!selectedTasks || selectedTasks.length === 0) return null;
  
  const handleDuplicate = async () => {
    try {
      setLoading(prev => ({ ...prev, duplicate: true }));
      // Process items one by one
      let lastUpdatedView = null;
      for (const task of selectedTasks) {
        const { data: updatedView } = await api.post('/views/duplicateRow', {
          viewId: viewId,
          groupId: groupId,
          rowId: task._id
        });
        lastUpdatedView = updatedView;
      }
      
      if (lastUpdatedView) {
        onTasksUpdated(lastUpdatedView);
      }
      setLoading(prev => ({ ...prev, duplicate: false }));
      onClose();
    } catch (error) {
      console.error('Error duplicating items:', error);
      setLoading(prev => ({ ...prev, duplicate: false }));
    }
  };
  
  const handleExport = () => {
    try {
      setLoading(prev => ({ ...prev, export: true }));
      
      const tasksData = selectedTasks.map(task => {
        const taskData = { id: task._id };
        task.cells.forEach(cell => {
          const column = cell.columnId;
          taskData[column] = cell.value;
        });
        return taskData;
      });
      
      const dataStr = JSON.stringify(tasksData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = 'items.json';
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      setLoading(prev => ({ ...prev, export: false }));
      onClose();
    } catch (error) {
      console.error('Error exporting items:', error);
      setLoading(prev => ({ ...prev, export: false }));
    }
  };
  
  const handleArchive = async () => {
    try {
      setLoading(prev => ({ ...prev, archive: true }));
      // Process items one by one
      let lastUpdatedView = null;
      for (const task of selectedTasks) {
        const { data: updatedView } = await api.post('/views/archiveRow', {
          viewId: viewId,
          groupId: groupId,
          rowId: task._id
        });
        lastUpdatedView = updatedView;
      }
      
      if (lastUpdatedView) {
        onTasksUpdated(lastUpdatedView);
      }
      setLoading(prev => ({ ...prev, archive: false }));
      onClose();
    } catch (error) {
      console.error('Error archiving items:', error);
      setLoading(prev => ({ ...prev, archive: false }));
    }
  };
  
  const handleDelete = async () => {
    try {
      setLoading(prev => ({ ...prev, delete: true }));
      // Process items one by one
      let lastUpdatedView = null;
      for (const task of selectedTasks) {
        const { data: updatedView } = await api.post('/views/deleteRawItem', {
          viewId: viewId,
          groupId: groupId,
          itemId: task._id
        });
        lastUpdatedView = updatedView;
      }
      
      if (lastUpdatedView) {
        onTasksUpdated(lastUpdatedView);
      }
      setLoading(prev => ({ ...prev, delete: false }));
      onClose();
    } catch (error) {
      console.error('Error deleting items:', error);
      setLoading(prev => ({ ...prev, delete: false }));
    }
  };
  
  const handleConvert = () => {
    try {
      setLoading(prev => ({ ...prev, convert: true }));
      // Apply conversion to all selected items
      // Placeholder for conversion logic
      
      setLoading(prev => ({ ...prev, convert: false }));
      onClose();
    } catch (error) {
      console.error('Error converting items:', error);
      setLoading(prev => ({ ...prev, convert: false }));
    }
  };
  
  const handleMoveToClick = (e) => {
    e.stopPropagation();
    setShowMoveToOptions(!showMoveToOptions);
  };
  
  const handleMoveToGroup = async () => {
    // Show group selection modal
    setShowGroupSelectionModal(true);
    setShowMoveToOptions(false);
    setShowBoardSelectionModal(false);
  };
  
  const handleSelectGroup = async (targetGroup) => {
    try {
      setLoading(prev => ({ ...prev, moveTo: true }));
      
      // Make sure we're not moving to the same group
      if (targetGroup._id === groupId) {
        setShowGroupSelectionModal(false);
        setLoading(prev => ({ ...prev, moveTo: false }));
        return;
      }
      
      // Process each selected task and move it to the target group
      let lastUpdatedView = null;
      for (const task of selectedTasks) {
        const { data: updatedView } = await api.patch('/views/moveRow', {
          viewId: viewId,
          sourceGroupId: groupId,
          targetGroupId: targetGroup._id,
          rowId: task._id
        });
        lastUpdatedView = updatedView;
      }
      
      if (lastUpdatedView) {
        onTasksUpdated(lastUpdatedView);
      }
      
      setLoading(prev => ({ ...prev, moveTo: false }));
      setShowGroupSelectionModal(false);
      onClose(); // Close the actions menu after moving
    } catch (error) {
      console.error('Error moving items to group:', error);
      setLoading(prev => ({ ...prev, moveTo: false }));
      setShowGroupSelectionModal(false);
    }
  };
  
  const handleMoveToBoard = async () => {
    setShowBoardSelectionModal(true);
    setShowMoveToOptions(false);
    setShowGroupSelectionModal(false);
  };
  
  const handleSelectBoard = async (targetBoard) => {
    try {
      setLoading(prev => ({ ...prev, moveTo: true }));
      
      // Process each selected task and move it to the target board
      let lastUpdatedView = null;
      for (const task of selectedTasks) {
        const { data: updatedView } = await api.post('/views/moveRowToBoard', {
          sourceViewId: viewId,
          sourceGroupId: groupId,
          rowId: task._id,
          targetBoardId: targetBoard._id
        });
        lastUpdatedView = updatedView;
      }
      
      if (lastUpdatedView) {
        onTasksUpdated(lastUpdatedView);
      }
      
      setLoading(prev => ({ ...prev, moveTo: false }));
      setShowBoardSelectionModal(false);
      onClose(); // Close the actions menu after moving
    } catch (error) {
      console.error('Error moving items to board:', error);
      setLoading(prev => ({ ...prev, moveTo: false }));
      setShowBoardSelectionModal(false);
    }
  };
  
  const handleApps = () => {
    try {
      setLoading(prev => ({ ...prev, apps: true }));
      // Apply apps integration to all selected items
      // Placeholder for apps integration
      
      setLoading(prev => ({ ...prev, apps: false }));
      onClose();
    } catch (error) {
      console.error('Error applying apps to items:', error);
      setLoading(prev => ({ ...prev, apps: false }));
    }
  };
  
  const menuPosition = {
    ...(position?.top && { top: position.top }),
    ...(position?.bottom && { bottom: position.bottom }),
    left: position?.left || '50%',
    transform: position?.bottom ? 'translate(-50%, 0)' : 'translate(-50%, 0)',
    ...(position?.position && { position: position.position }),
    ...(position?.zIndex && { zIndex: position.zIndex })
  };
  
  const LoadingSpinner = () => (
    <FiLoader className="w-5 h-5 mb-1 animate-spin" />
  );
  
  return (
    <>
      <div 
        className="fixed bg-skin-main border border-skin-border rounded-lg shadow-xl flex items-center p-3 "
        style={menuPosition}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 text-skin-secondary">
          <div className="bg-blue-500 text-white w-8 h-8 rounded-md flex items-center justify-center font-semibold mr-2">
            {selectedTasks.length}
          </div>
          <span className="text-sm text-skin-primary mr-4">Item{selectedTasks.length > 1 ? 's' : ''} selected</span>
          
          <button 
            onClick={handleDuplicate}
            className="flex flex-col items-center justify-center p-2 hover:bg-skin-hover rounded-md disabled:opacity-50"
            title="Duplicate"
            disabled={loading.duplicate}
          >
            {loading.duplicate ? <LoadingSpinner /> : <FiCopy className="w-5 h-5 mb-1" />}
            <span className="text-xs">Duplicate</span>
          </button>
          
          <button 
            onClick={handleExport}
            className="flex flex-col items-center justify-center p-2 hover:bg-skin-hover rounded-md disabled:opacity-50"
            title="Export"
            disabled={loading.export}
          >
            {loading.export ? <LoadingSpinner /> : <FiDownload className="w-5 h-5 mb-1" />}
            <span className="text-xs">Export</span>
          </button>
          
          <button 
            onClick={handleArchive}
            className="flex flex-col items-center justify-center p-2 hover:bg-skin-hover rounded-md disabled:opacity-50"
            title="Archive"
            disabled={loading.archive}
          >
            {loading.archive ? <LoadingSpinner /> : <FiArchive className="w-5 h-5 mb-1" />}
            <span className="text-xs">Archive</span>
          </button>
          
          <button 
            onClick={handleDelete}
            className="flex flex-col items-center justify-center p-2 hover:bg-skin-hover rounded-md disabled:opacity-50"
            title="Delete"
            disabled={loading.delete}
          >
            {loading.delete ? <LoadingSpinner /> : <FiTrash2 className="w-5 h-5 mb-1" />}
            <span className="text-xs">Delete</span>
          </button>
          
          <button 
            onClick={handleConvert}
            className="flex flex-col items-center justify-center p-2 hover:bg-skin-hover rounded-md disabled:opacity-50"
            title="Convert"
            disabled={loading.convert}
          >
            {loading.convert ? <LoadingSpinner /> : <FiRefreshCw className="w-5 h-5 mb-1" />}
            <span className="text-xs">Convert</span>
          </button>
          
          <div className="relative" ref={moveToRef}>
            <button 
              onClick={handleMoveToClick}
              className="flex flex-col items-center justify-center p-2 hover:bg-skin-hover rounded-md disabled:opacity-50"
              title="Move to"
              disabled={loading.moveTo}
            >
              {loading.moveTo ? <LoadingSpinner /> : <FiArrowRight className="w-5 h-5 mb-1" />}
              <span className="text-xs">Move to</span>
            </button>
            
            {showMoveToOptions && (
              <div className="absolute left-0 bottom-full mb-1 bg-skin-main border border-skin-border rounded-md shadow-lg py-1 min-w-[150px] z-[101]">
                <button 
                  onClick={handleMoveToGroup}
                  className="flex items-center gap-2 w-full px-4 py-2 text-left hover:bg-skin-hover"
                >
                  <FiLayers className="w-4 h-4" />
                  <span>Move to group</span>
                </button>
                <button 
                  onClick={handleMoveToBoard}
                  className="flex items-center gap-2 w-full px-4 py-2 text-left hover:bg-skin-hover"
                >
                  <FiLayout className="w-4 h-4" />
                  <span>Move to board</span>
                </button>
              </div>
            )}
          </div>
          
          <button 
            onClick={handleApps}
            className="flex flex-col items-center justify-center p-2 hover:bg-skin-hover rounded-md disabled:opacity-50"
            title="Apps"
            disabled={loading.apps}
          >
            {loading.apps ? <LoadingSpinner /> : <FiGrid className="w-5 h-5 mb-1" />}
            <span className="text-xs">Apps</span>
          </button>
          
          <button 
            onClick={onClose}
            className="mr-1 text-skin-secondary hover:text-skin-primary"
          >
            ✕
          </button>
        </div>
      </div>
      
      {/* Group Selection Modal */}
      <GroupSelectionModal 
        isOpen={showGroupSelectionModal}
        onClose={() => setShowGroupSelectionModal(false)}
        onSelectGroup={handleSelectGroup}
        groups={view?.table?.groups || []}
        currentGroupId={groupId}
      />
      
      {/* Board Selection Modal */}
      <BoardSelectionModal 
        isOpen={showBoardSelectionModal}
        onClose={() => setShowBoardSelectionModal(false)}
        onSelectBoard={handleSelectBoard}
        currentBoardId={view?.board}
      />
    </>
  );
};

export default TaskActionsMenu; 