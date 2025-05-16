import React, { useState, useEffect, useRef } from 'react';
import { BsChevronDown, BsPlus, BsThreeDots, BsPencil } from 'react-icons/bs';
import api from '../../../services/api';
import TableGroup from './table/TableGroup';

function TableView({ view, searchParams }) {
  const [groups, setGroups] = useState(view.table.groups);
  const [viewData, setViewData] = useState(view);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get('/users/cellUsers');
        console.log('response', response);
        setUsers(response.data);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    setViewData(view);
    setGroups(view.table.groups);
  }, [view]);

  const onViewUpdate = (data) => {
    setViewData(data);
    setGroups(data.table.groups);
  }

  const handleUpdateGroup = async (updatedGroup) => {
    try {
      setGroups(updatedGroup);
    } catch (error) {
      console.error('Error updating group:', error);
    }
  };

  const handleAddGroup = async () => {
    try {
      const { data: updatedView } = await api.post('/views/createGroup', {
        viewId: viewData._id,
      });
      setGroups(updatedView.table.groups);
    } catch (error) {
      console.error('Error adding group:', error);
    }
  };

  const filterGroups = (groups) => {
    if (!searchParams?.searchText || !searchParams?.selectedColumns?.length) {
      return groups;
    }

    return groups.map(group => ({
      ...group,
      rows: group.rows.filter(row => {
        return row.cells.some(cell => {
          // Only check selected columns
          if (!searchParams.selectedColumns.includes(cell.columnId.toString())) {
            return false;
          }
          if(!cell) {
            return false;
          }
          // Get column type
          const column = view.table.columns.find(col => 
            col._id.toString() === cell.columnId.toString()
          );

          const searchText = searchParams.searchText.toLowerCase();
          // Check cell value based on column type
          switch(column?.type) {
            case 'person':
              return cell.value?.some(user => 
                user.email?.toLowerCase().includes(searchText)
              );
            case 'status':
              return cell.value?.value?.toLowerCase().includes(searchText);
            case 'date':
              return cell.value ? String(cell.value).toLowerCase().includes(searchText) : false;
            default:
              return cell.value ? String(cell.value).toLowerCase().includes(searchText) : false;
          }
        });
      })
    })).filter(group => group.rows.length > 0);
  };

  const filteredGroups = filterGroups(groups);
  // Safety check
  if (!viewData?.table?.groups) {
    return null;
  }

  return (
    <div className="flex-1 overflow-hidden">
      <div className="flex flex-col h-[calc(100vh-250px)]">
        <div className="flex-1 overflow-y-auto">
          <div className="px-6 pt-6">
            {filteredGroups.map(group => {
              return (
                <TableGroup
                  key={group._id}
                  group={group}
                  view={viewData}
                  users={users}
                  onUpdateGroup={handleUpdateGroup}
                  onViewUpdate={onViewUpdate}
                />
              );
            })}
          </div>
           {/* Add Group Button */}
          <div className="px-6 pb-4">
            <button 
              onClick={handleAddGroup}
              className="text-skin-secondary/50 text-sm hover:text-skin-secondary hover:bg-skin-hover px-4 py-2 flex items-center gap-2 border border-skin-border"
            >
              <BsPlus className="w-4 h-4" />
              Add new group
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default TableView; 