import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { TableGroup } from './TableGroup';
import api from '../../../../services/api';

export function TableGroups({ view, onViewUpdate }) {
  const [activeId, setActiveId] = useState(null);
  const [activeRow, setActiveRow] = useState(null);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  const handleDragStart = (event) => {
    const { active } = event;
    setActiveId(active.id);
    
    // Find the active row and its group
    const group = view.table.groups.find(g => 
      g.rows.some(r => r._id === active.id)
    );
    const row = group?.rows.find(r => r._id === active.id);
    setActiveRow(row);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveRow(null);

    if (!over) return;

    // Find source and target groups
    const sourceGroup = view.table.groups.find(g => 
      g.rows.some(r => r._id === active.id)
    );
    const targetGroup = view.table.groups.find(g => 
      g._id === over.data.current?.groupId
    );

    if (sourceGroup && targetGroup && sourceGroup._id !== targetGroup._id) {
      try {
        const { data: updatedView } = await api.patch("/views/moveRow", {
          viewId: view._id,
          sourceGroupId: sourceGroup._id,
          targetGroupId: targetGroup._id,
          rowId: active.id
        });
        onViewUpdate(updatedView);
      } catch (error) {
        console.error("Error moving row:", error);
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-6">
        {view.table.groups.map((group) => (
          <TableGroup
            key={group._id}
            group={group}
            view={view}
            onViewUpdate={onViewUpdate}
          />
        ))}
      </div>

      <DragOverlay>
        {activeId && activeRow ? (
          <div className="opacity-70 bg-skin-card shadow-xl rounded border border-blue-400">
            <SortableRow
              row={activeRow}
              columns={view.table.columns}
              isOverlay={true}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
