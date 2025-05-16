import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { BsGripVertical, BsPerson } from 'react-icons/bs';
import CommentButton from '../../../../components/comments/CommentButton';
import { useSelector } from 'react-redux';

export function SortableRow({
  board,
  row,
  groupId,
  columns,
  renderCell,
  isOverlay = false,
  isSelected = false,
  onSelectTask,
  onTaskClick,
  viewId
}) {
  const { user } = useSelector((state) => state.auth);
  const isOwner = board?.userId === user?.id;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: row._id,
    data: {
      type: 'row',
      groupId,
      row
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative',
    zIndex: isDragging ? 999 : 'auto',
  };

  // Default renderCell function if none provided
  const defaultRenderCell = (cell, row, column) => {
    if (!cell || cell.value === undefined) return '';
    
    const value = cell.value;
    
    // Handle different column types
    switch(column.type) {
      case 'person':
        // Handle person cell which might contain an array of user objects
        if (Array.isArray(value)) {
          if (value.length === 0) {
            return (
              <div className="flex justify-center">
                <div className="w-7 h-7 rounded-full bg-skin-primary flex items-center justify-center">
                  <BsPerson className="text-skin-secondary w-4 h-4" />
                </div>
              </div>
            );
          }
          
          return (
            <div className="flex justify-center">
              <div className="flex -space-x-2">
                {value.slice(0, 3).map((user, index) => (
                  <div 
                    key={index}
                    className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white ring-2 ring-skin-main"
                  >
                    {user.email && user.email[0] ? user.email[0].toUpperCase() : '?'}
                  </div>
                ))}
                {value.length > 3 && (
                  <div className="w-7 h-7 rounded-full bg-skin-primary flex items-center justify-center text-skin-primary ring-2 ring-skin-main">
                    +{value.length - 3}
                  </div>
                )}
              </div>
            </div>
          );
        }
        return '';
        
      case 'status':
        // For status cells with color
        if (typeof value === 'object' && value.color && value.value) {
          return (
            <div 
              className="px-2 py-1 rounded text-center text-sm"
              style={{ 
                backgroundColor: value.color,
                color: '#fff'
              }}
            >
              {value.value}
            </div>
          );
        }
        return String(value || '');
        
      case 'date':
        if (value instanceof Date) {
          return value.toLocaleDateString();
        }
        if (typeof value === 'string' && value) {
          try {
            return new Date(value).toLocaleDateString();
          } catch {
            return value;
          }
        }
        return '';
        
      default:
        // Handle generic object case
        if (typeof value === 'object' && value !== null) {
          if (value.value !== undefined) {
            return String(value.value);
          }
          return JSON.stringify(value);
        }
        
        // Handle primitive values
        return String(value || '');
    }
  };

  // Use provided renderCell or fall back to default
  const cellRenderer = renderCell || defaultRenderCell;

  const handleCheckboxChange = (e) => {
    e.stopPropagation();
    if (onSelectTask) {
      onSelectTask(row, !isSelected);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={isOverlay ? {} : style}
      className={`flex border-b border-[var(--border-color)] hover:bg-skin-hover group ${
        isDragging ? 'shadow-xl rounded' : ''
      } ${isSelected ? 'bg-blue-900/20' : ''}`}
    >
      {/* Drag handle and checkbox */}
      <div className="w-[60px] p-2 border-r border-[var(--border-color)] bg-[var(--color-card-darker)] flex items-center gap-2">
        <div
          {...attributes}
          {...listeners}
          className="w-[30px] flex items-center justify-center cursor-grab active:cursor-grabbing hover:bg-skin-hover rounded p-1"
        >
          <BsGripVertical className="w-4 h-4 text-skin-secondary" />
        </div>
        <input 
          type="checkbox" 
          checked={isSelected}
          onChange={handleCheckboxChange}
          className="rounded accent-blue-500"
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* Row cells */}
      {columns.map((column, index) => {
        const cell = row.cells?.find(
          (cell) => cell.columnId.toString() === column._id.toString()
        );
        if (!cell) return null;

        return (
          <div
            key={column._id}
            className={`border-r border-skin-border ${
              column.type === "item" ? "bg-skin-card z-10 sticky left-0 bg-[var(--color-card-darker)]" : ""
            } p-2 flex items-center justify-between `}
            style={{ 
              width: column.width, 
              minWidth: column.width,
            }}
          >
            <div className="flex-1 h-full min-h-[30px]">
              {cellRenderer(cell, row, column)}
            </div>
            {index === 0 && (
              <div>
                <CommentButton
                  viewId={viewId}
                  groupId={groupId}
                  rowId={row._id}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
