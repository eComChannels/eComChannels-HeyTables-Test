import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  DndContext,
  closestCenter,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import axios from "../../services/api";
import BoardHeader from "./components/BoardHeader";
import BoardToolbar from "./components/BoardToolbar";
import ViewTabs from "./components/ViewTabs";
import TableGroup from "./components/table/TableGroup";
import { SortableRow } from "./components/table/SortableRow";
import { BsGripVertical, BsPlus } from "react-icons/bs";
// import TableView from './components/TableView';
function BoardView() {
  const { url } = useParams();
  const navigate = useNavigate();
  const [board, setBoard] = useState(null);
  const [views, setViews] = useState([]);
  const [activeView, setActiveView] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [activeRow, setActiveRow] = useState(null);
  const [activeRowColumns, setActiveRowColumns] = useState(null);
  const [searchParams, setSearchParams] = useState({
    searchText: "",
    selectedColumns: [],
  });
  const [users, setUsers] = useState([]);
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

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get("/users/cellUsers");
        setUsers(response.data);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    fetchUsers();
  }, []);

  const handleViewsChange = ({
    views: newViews,
    activeView: newActiveView,
  }) => {
    setViews(newViews);
    setActiveView(newActiveView);
  };

  const handleBoardUpdate = (updatedBoard) => {
    setBoard(updatedBoard);
  };

  const handleSearch = (params) => {
    setSearchParams(params);
  };

  // Filter groups and rows based on search parameters
  const filterGroups = (groups) => {
    if (!searchParams?.searchText || !searchParams?.selectedColumns?.length || !activeView?.table?.columns) {
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
          const column = activeView.table.columns.find(col => 
            col._id.toString() === cell.columnId.toString()
          );

          const searchText = searchParams.searchText.toLowerCase();
          // Check cell value based on column type
          switch(column?.type) {
            case 'person':
              return Array.isArray(cell.value) && cell.value.some(user => 
                user?.email?.toLowerCase().includes(searchText)
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

  const handleDragStart = (event) => {
    const { active } = event;
    if (!activeView?.table?.groups) return;

    setActiveId(active.id);

    // Find the active row and its group
    for (const group of activeView.table.groups) {
      const row = group.rows.find((r) => r._id === active.id);
      if (row) {
        setActiveRow(row);
        setActiveRowColumns(activeView.table.columns);
        break;
      }
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveRow(null);
    setActiveRowColumns(null);

    if (!over || !activeView?.table?.groups) return;

    // Find source group and target group
    let sourceGroup = null;
    let sourceGroupIndex = -1;
    let targetGroup = null;

    for (let i = 0; i < activeView.table.groups.length; i++) {
      const group = activeView.table.groups[i];

      // Check if this group contains the dragged row
      if (group.rows.some((r) => r._id === active.id)) {
        sourceGroup = group;
        sourceGroupIndex = i;
      }

      // Check if this is the target group
      if (group._id === over.data.current?.groupId) {
        targetGroup = group;
      }
    }

    // If we found both source and target groups and they're different
    if (sourceGroup && targetGroup && sourceGroup._id !== targetGroup._id) {
      try {
        // Optimistic update
        const updatedView = JSON.parse(JSON.stringify(activeView));

        // Find the row in the source group
        const rowIndex = sourceGroup.rows.findIndex((r) => r._id === active.id);
        if (rowIndex === -1) return;

        // Remove the row from the source group
        const [movedRow] = updatedView.table.groups[
          sourceGroupIndex
        ].rows.splice(rowIndex, 1);

        // Find the target group in the updated view
        const targetIndex = updatedView.table.groups.findIndex(
          (g) => g._id === targetGroup._id
        );
        if (targetIndex === -1) return;

        // Add the row to the target group
        updatedView.table.groups[targetIndex].rows.push(movedRow);

        // Update the local state first (optimistic update)
        setActiveView(updatedView);

        // Then update on the server
        const response = await axios.patch("/views/moveRow", {
          viewId: activeView._id,
          sourceGroupId: sourceGroup._id,
          targetGroupId: targetGroup._id,
          rowId: active.id,
        });

        // Update with server response
        const newViews = views.map((v) =>
          v._id === response.data._id ? response.data : v
        );
        setViews(newViews);
        setActiveView(response.data);
      } catch (error) {
        console.error("Error moving row:", error);
        // Revert to original state on error
        const { data: originalView } = await axios.get(
          `/views/${activeView._id}`
        );
        setActiveView(originalView);
      }
    }
  };

  const handleAddGroup = async () => {
    try {
      const { data: updatedView } = await axios.post("/views/createGroup", {
        viewId: activeView._id,
      });

      // Update state with the new view data
      const newViews = views.map((v) =>
        v._id === updatedView._id ? updatedView : v
      );
      setViews(newViews);
      setActiveView(updatedView);
    } catch (error) {
      console.error("Error adding group:", error);
    }
  };

  // Listen for formula changes
  useEffect(() => {
    const handleFormulaApplied = (event) => {
      const { viewId, updatedData, timestamp } = event.detail;

      console.log("Formula applied event received:", {
        viewId,
        updatedData,
        timestamp,
      });

      if (!updatedData) {
        console.warn("No updated data received in formula-applied event");
        return;
      }

      // Validate the updated data has the expected structure to prevent rendering errors
      if (!updatedData.table || !Array.isArray(updatedData.table.groups)) {
        console.warn("Invalid updatedData structure in formula-applied event");
        return;
      }

      // Use functional updates to ensure we're working with the latest state
      setViews(prevViews => {
        // Only update if there's an actual change
        const viewIndex = prevViews.findIndex(v => v._id === viewId);
        if (viewIndex === -1) return prevViews; // View not found
        
        // Create a new array with the updated view
        return [
          ...prevViews.slice(0, viewIndex),
          updatedData,
          ...prevViews.slice(viewIndex + 1)
        ];
      });

      // Update active view if it's the one that changed
      setActiveView(prevActiveView => {
        if (prevActiveView && prevActiveView._id === viewId) {
          return updatedData;
        }
        return prevActiveView;
      });
    };

    // Add event listener
    window.addEventListener("formula-applied", handleFormulaApplied);

    // Clean up
    return () => {
      window.removeEventListener("formula-applied", handleFormulaApplied);
    };
  }, []); // No dependencies to prevent unnecessary re-renders

  useEffect(() => {
    const fetchBoardData = async () => {
      try {
        // Reset views and activeView when URL changes
        setViews([]);
        setActiveView(null);
        
        const response = await axios.get(`/boards/${url}`);
        if (!response.data) {
          navigate("/");
          return;
        }
        setBoard(response.data);
      } catch (error) {
        console.error("Error fetching board:", error);
        navigate("/");
      }
    };

    fetchBoardData();
  }, [url, navigate]);

  if (!board)
    return (
      <div className="flex-1 bg-skin-main flex items-center justify-center">
        <div className="text-skin-secondary">Loading...</div>
      </div>
    );

  return (
    <div className="flex-1 flex flex-col h-full bg-skin-base ml-2">
      {/* <div className="flex-1 bg-skin-base min-h-screen"></div> */}
      <BoardHeader
        board={board}
        views={views}
        activeView={activeView}
        onViewsChange={handleViewsChange}
        onBoardUpdate={handleBoardUpdate}
      />
      {activeView && (
        <BoardToolbar
          view={activeView}
          onSearch={handleSearch}
          onViewUpdate={(updatedView) => {
            const newViews = views.map((v) =>
              v._id === updatedView._id ? updatedView : v
            );
            setViews(newViews);
            setActiveView(updatedView);
          }}
        />
      )}
      <ViewTabs
        views={views}
        activeView={activeView}
        onViewsChange={handleViewsChange}
        boardId={board._id}
      />
      
      {/* Show empty state with create view button when no views exist */}
      {views.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-10">
          <div className="text-skin-secondary text-lg mb-4">This board doesn't have any views yet</div>
          <button
            onClick={async () => {
              try {
                const response = await axios.post('/views', {
                  name: 'Main Table',
                  type: 'table',
                  boardId: board._id,
                  isDefault: true
                });
                setViews(response.data.views);
                setActiveView(response.data.newView);
              } catch (error) {
                console.error('Error creating view:', error);
              }
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Create Table View
          </button>
        </div>
      ) : (
        activeView?.type === "table" && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex-1 overflow-y-auto">
              {/* Use filtered groups for rendering */}
              {activeView.table.groups && 
                filterGroups(activeView.table.groups).map((group) => (
                  <TableGroup
                    key={group._id}
                    board={board}
                    group={group}
                    view={activeView}
                    users={users}
                    onViewUpdate={(updatedView) => {
                      const newViews = views.map((v) =>
                        v._id === updatedView._id ? updatedView : v
                      );
                      setViews(newViews);
                      setActiveView(updatedView);
                    }}
                  />
                ))}

              {/* Show message when no groups exist but view exists */}
              {(!activeView.table.groups || activeView.table.groups.length === 0) && (
                <div className="flex flex-col items-center justify-center p-10">
                  <div className="text-skin-secondary text-lg mb-4">This view doesn't have any groups yet</div>
                </div>
              )}

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

            <DragOverlay>
              {activeId && activeRow && activeRowColumns && (
                <div className="opacity-70 bg-skin-card shadow-xl rounded border border-blue-400">
                  <SortableRow
                    row={activeRow}
                    groupId={null}
                    columns={activeRowColumns}
                    isOverlay={true}
                    renderCell={(cell, row, column) => {
                      if (!cell || cell.value === undefined) return '';
                      
                      const value = cell.value;
                      
                      // Handle different column types
                      switch(column.type) {
                        case 'person':
                          // For person cells (arrays of users), just show a count
                          if (Array.isArray(value)) {
                            return value.length > 0 ? `${value.length} assigned` : '';
                          }
                          return '';
                          
                        case 'status':
                          // For status cells, show just the value (not styled)
                          if (typeof value === 'object' && value.value) {
                            return value.value;
                          }
                          return String(value || '');
                          
                        case 'date':
                          // For date cells, format as string
                          if (value) {
                            return typeof value === 'string' ? value : String(value);
                          }
                          return '';
                          
                        default:
                          // For all other types, convert to string safely
                          if (typeof value === 'object' && value !== null) {
                            return String(value.value || '') || JSON.stringify(value);
                          }
                          return String(value || '');
                      }
                    }}
                  />
                </div>
              )}
            </DragOverlay>
          </DndContext>
        )
      )}
    </div>
  );
}

export default BoardView;
