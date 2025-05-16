const View = require('../models/View');
const Board = require('../models/Board');
const { v4: uuidv4 } = require('uuid');
const { DEFAULT_GROUPS, DEFAULT_COLUMNS, DEFAULT_VALUES } = require('../constants/defaults');

const mongoose = require('mongoose');

// Helper function to handle status operations
const handleStatusInCells = async (cells, columns, boardId) => {
  try {
    const board = await Board.findById(boardId);
    const defaultStatus = board.statuses[0];

    return cells.map(cell => {
      const column = columns.find(col => col.id === cell.columnId);
      return {
        ...cell,
        value: column.type === 'status' ? defaultStatus : cell.value
      };
    });
  } catch (error) {
    console.error('Error in handleStatusInCells:', error);
    throw error;
  }
};

exports.getViews = async (req, res) => {
  try {
    const views = await View.find({ board: req.params.boardId });
    res.status(200).json(views);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createView = async (req, res) => {
  try {
    const { name, type, boardId, isDefault } = req.body;

    // Create default columns for the view
    const defaultColumns = DEFAULT_COLUMNS.map(col => ({
      _id: new mongoose.Types.ObjectId(),
      type: col.type,
      title: col.title,
      width: col.width,
      statuses: col.statuses || []
    }));

    // Create a default group with a sample row
    const defaultGroup = {
      _id: new mongoose.Types.ObjectId(),
      title: 'New Group',
      rows: [{
        _id: new mongoose.Types.ObjectId(),
        cells: defaultColumns.map(col => ({
          _id: new mongoose.Types.ObjectId(),
          columnId: col._id,
          value: DEFAULT_VALUES[col.type](col.type === 'item' ? 'New Item' : '')
        }))
      }]
    };

    // Create the view with the table structure
    const view = new View({
      name,
      type,
      board: boardId,
      isDefault: isDefault || false,
      table: {
        columns: defaultColumns,
        groups: [defaultGroup]
      }
    });

    const savedView = await view.save();
    const allViews = await View.find({ board: boardId });
    
    res.status(201).json({
      newView: savedView,
      views: allViews
    });
  } catch (error) {
    console.error('Error in createView:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.updateView = async (req, res) => {
  try {
    const view = await View.findById(req.body.viewId);
    if (!view) {
      return res.status(404).json({ error: "View not found" });
    }
    
    if (view.name === 'Main Table' && req.body.name) {
      return res.status(400).json({ error: "Cannot rename Main Table" });
    }

    const updatedView = await View.findByIdAndUpdate(
      req.body.viewId,
      { $set: req.body },
      { new: true }
    );
    res.status(200).json(updatedView);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.duplicateView = async (req, res) => {
  try {
    const view = await View.findById(req.body.viewId);
    if (!view) {
      return res.status(404).json({ error: "View not found" });
    }

    // Modify groups to include the default status
    const groupsWithStatus = await Promise.all(view.groups.map(async group => ({
      ...group,
      items: [],
      rows: await Promise.all(group.rows.map(async row => ({
        ...row,
        cells: await handleStatusInCells(row.cells, group.columns, view.board)
      })))
    })));

    const newView = new View({
      ...view.toObject(),
      _id: undefined,
      name: `${view.name} copy`,
      isDefault: false,
      groups: groupsWithStatus
    });

    const savedView = await newView.save();
    const allViews = await View.find({ board: view.board });
    
    res.status(201).json({
      newView: savedView,
      views: allViews
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteView = async (req, res) => {
  try {
    const view = await View.findById(req.body.viewId);
    if (!view) {
      return res.status(404).json({ error: "View not found" });
    }
    
    if (view.name === 'Main Table') {
      return res.status(400).json({ error: "Cannot delete Main Table" });
    }

    await Board.findByIdAndUpdate(view.board, {
      $pull: { views: req.body.viewId }
    });

    await View.findByIdAndDelete(req.body.viewId);
    res.status(200).json({ message: "View has been deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Rename group
exports.renameGroup = async (req, res) => {
  try {
    const { viewId, groupId, name } = req.body;
    
    const view = await View.findById(viewId);
    if (!view) return res.status(404).json({ message: 'View not found' });

    const group = view.table.groups.id(groupId);  // Using .id() to find subdocument by _id
    if (!group) return res.status(404).json({ message: 'Group not found' });

    group.title = name;  // Make sure we're updating 'title' not 'name'
    await view.save();
    
    res.json(view);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Duplicate group
exports.duplicateGroup = async (req, res) => {
  try {
    const { viewId, groupId } = req.body;
    
    const view = await View.findById(viewId);
    if (!view) return res.status(404).json({ message: 'View not found' });

    const sourceGroup = view.table.groups.id(groupId);
    if (!sourceGroup) return res.status(404).json({ message: 'Group not found' });

    // Create a deep copy of the group
    const duplicatedGroup = {
      ...sourceGroup.toObject(),
      _id: new mongoose.Types.ObjectId(),  // Generate new _id
      title: `${sourceGroup.title} (copy)`,
      rows: sourceGroup.rows.map(row => ({
        ...row,
        _id: new mongoose.Types.ObjectId(),  // New _id for each row
        cells: row.cells.map(cell => ({
          ...cell,
          _id: new mongoose.Types.ObjectId()  // New _id for each cell
        }))
      }))
    };

    // Add the duplicated group to view.table.groups
    view.table.groups.push(duplicatedGroup);
    await view.save();
    
    res.json(view);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete group
exports.deleteGroup = async (req, res) => {
  try {
    const { viewId, groupId } = req.body;
    
    const view = await View.findById(viewId);
    if (!view) return res.status(404).json({ message: 'View not found' });

    // Find and remove the group
    view.table.groups.pull(groupId);
    await view.save();
    
    res.json(view);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createGroup = async (req, res) => {
  try {
    const { viewId } = req.body;

    const view = await View.findById(viewId);
    if (!view) return res.status(404).json({ message: 'View not found' });

    // Create new group with the table schema structure
    const newGroup = {
      _id: new mongoose.Types.ObjectId(),
      title: 'new Group',
      rows: []  // Initialize empty rows array
    };

    // Add to table.groups instead of groups
    view.table.groups.push(newGroup);
    await view.save();

    res.json(view);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Add item to group
 * @route POST /api/views/:viewId/groups/:groupId/items
 * @access Private
 */
exports.addItemToGroup = async (req, res) => {
  try {
    const { viewId, groupId, title } = req.body;

    const view = await View.findById(viewId);
    if (!view) {
      return res.status(404).json({ message: 'View not found' });
    }

    const group = view.table.groups.id(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const newRow = {
      cells: view.table.columns.map(column => ({
        columnId: column._id,
        value: DEFAULT_VALUES[column.type](title)  // Get default value based on column type
      }))
    };

    group.rows.push(newRow);
    const updatedView = await view.save();
    res.json(updatedView);

  } catch (error) {
    console.error('Error in addItemToGroup:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deleteRawItem = async (req, res) => {
  try {
    const { viewId, groupId, itemId } = req.body;
    const view = await View.findById(viewId);
    if (!view) return res.status(404).json({ message: 'View not found' });

    const group = view.table.groups.id(groupId);  // Changed from view.groups to view.table.groups
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const itemIndex = group.rows.findIndex(row => row._id.toString() === itemId);  // Changed from item.id to row._id
    if (itemIndex === -1) return res.status(404).json({ message: 'Item not found' });

    group.rows.splice(itemIndex, 1);
    await view.save();
    res.json(view);  // Return the updated view
  } catch (error) {
    console.log('error in deleteRawItem', error);
    res.status(500).json({ message: error.message });
  }
};

exports.addColumn = async (req, res) => {
  try {
    const { viewId, columnType, title } = req.body;
    
    const view = await View.findById(viewId);
    if (!view) return res.status(404).json({ message: 'View not found' });

    const columnId = new mongoose.Types.ObjectId();
    
    // Get column data from DEFAULT_COLUMNS
    const defaultColumn = DEFAULT_COLUMNS.find(col => col.type === columnType);

    // Get default value for this column type
    let defaultValue = '';
    switch (columnType) {
      case 'item':
        defaultValue = 'New item';
        break;
      case 'status':
        defaultValue = '';
        break;
      case 'date':
        defaultValue = new Date().toISOString();
        break;
      case 'person':
        defaultValue = [];
        break;
      default:
        defaultValue = '';
    }

    // Generate column title with auto-incrementing number
    let newTitle = title || defaultColumn.title;
    
    // Find all existing columns with similar names
    const baseTitle = newTitle.replace(/\d+$/, ''); // Remove trailing digits
    const existingTitles = view.table.columns
      .map(col => col.title)
      .filter(colTitle => colTitle === baseTitle || colTitle.startsWith(baseTitle) && /\d+$/.test(colTitle));
    
    if (existingTitles.length > 0) {
      // Extract existing numbers and find the highest one
      const existingNumbers = existingTitles
        .map(colTitle => {
          const match = colTitle.match(/(\d+)$/);
          return match ? parseInt(match[1], 10) : 0;
        })
        .filter(num => !isNaN(num));
      
      // Get the highest number and increment it
      const highestNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0;
      newTitle = `${baseTitle}${highestNumber + 1}`;
    }

    // Add column to view.table.columns
    view.table.columns.push({
      _id: columnId,
      ...defaultColumn,
      title: newTitle
    });

    // Add cells to all groups' rows
    view.table.groups.forEach(group => {
      group.rows.forEach(row => {
        row.cells.push({
          columnId: columnId,
          value: defaultValue
        });
      });
    });

    await view.save();
    res.json(view);
  } catch (error) {
    console.error('Error adding column:', error);
    res.status(500).json({ message: error.message });
  }
};

// Add this function to the existing viewController.js
exports.deleteColumn = async (req, res) => {
  try {
    const { viewId, columnId } = req.body;

    const view = await View.findById(viewId);
    if (!view) {
      return res.status(404).json({ message: 'View not found' });
    }

    // Remove column from table.columns
    view.table.columns = view.table.columns.filter(col => 
      col._id.toString() !== columnId
    );

    // Remove cells with this columnId from all groups' rows
    view.table.groups.forEach(group => {
      group.rows.forEach(row => {
        row.cells = row.cells.filter(cell => 
          cell.columnId.toString() !== columnId
        );
      });
    });

    const updatedView = await view.save();
    res.json(updatedView);

  } catch (error) {
    console.error('Error deleting column:', error);
    res.status(500).json({ message: 'Error deleting column' });
  }
};

exports.updateCellPermissions = async (req, res) => {
  try {
    const { viewId, columnId, value } = req.body;

    const view = await View.findById(viewId);
    if (!view) {
      return res.status(404).json({ message: 'View not found' });
    }

    const column = view.table.columns.find(col => col._id.toString() === columnId);
    if (!column) {  
      return res.status(404).json({ message: 'Column not found' });
    }

    column.canEdit = value;

    const updatedView = await view.save();
    res.json(updatedView);
  } catch (error) {
    console.error('Error updating cell permissions:', error);
    res.status(500).json({ message: 'Failed to update cell permissions' });
  }
};

exports.updateCellViewPermissions = async (req, res) => {
  try {
    const { viewId, columnId, value } = req.body;

    const view = await View.findById(viewId);
    if (!view) {
      return res.status(404).json({ message: 'View not found' });
    }

    const column = view.table.columns.find(col => col._id.toString() === columnId);
    if (!column) {
      return res.status(404).json({ message: 'Column not found' });
    }

    column.canView = value;

    const updatedView = await view.save();
    res.json(updatedView);
  } catch (error) {
    console.error('Error updating cell view permissions:', error);
    res.status(500).json({ message: 'Failed to update cell view permissions' });
  }
};

exports.updateCell = async (req, res) => {
  try {
    const { viewId, groupId, rowId, cellId, value } = req.body;

    const view = await View.findById(viewId);
    if (!view) {
      return res.status(404).json({ message: 'View not found' });
    }

    // Log the update details
    console.log('Updating cell:', { 
      viewId, 
      groupId, 
      rowId, 
      cellId, 
      value: typeof value === 'object' ? JSON.stringify(value) : value
    });

    // Get the column for this cell to check permissions
    const cell = view.table.groups
      .find(g => g._id.toString() === groupId)
      ?.rows.find(r => r._id.toString() === rowId)
      ?.cells.find(c => c._id.toString() === cellId);

    if (!cell) {
      return res.status(404).json({ message: 'Cell not found' });
    }

    // Find the column for this cell
    const column = view.table.columns.find(col => col._id.toString() === cell.columnId.toString());
    if (!column) {
      return res.status(404).json({ message: 'Column not found' });
    }

    // Get the board to check if user is the creator
    const board = await Board.findById(view.board);
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // If column is view-only and user is not the board creator, deny the update
    if (column.isViewOnly && board.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({ 
        message: 'This column is view-only. Only the board creator can edit it.' 
      });
    }

    // Update the cell value
    view.table.groups = view.table.groups.map(group => {
      if (group._id.toString() === groupId) {
        return {
          ...group,
          rows: group.rows.map(row => {
            if (row._id.toString() === rowId) {
              return {
                ...row,
                cells: row.cells.map(cell => 
                  cell._id.toString() === cellId ? { ...cell, value } : cell
                )
              };
            }
            return row;
          })
        };
      }
      return group;
    });

    const updatedView = await view.save();
    res.json(updatedView);

  } catch (error) {
    console.error('Error updating cell:', error);
    res.status(500).json({ message: 'Failed to update cell' });
  }
};

exports.renameColumn = async (req, res) => {
  try {
    const { viewId, columnId, title } = req.body;

    const view = await View.findById(viewId);
    if (!view) {
      return res.status(404).json({ message: 'View not found' });
    }

    // Update column title directly in view.table.columns
    view.table.columns = view.table.columns.map(column => 
      column._id.toString() === columnId ? { ...column, title } : column
    );

    // Save and return updated view
    const updatedView = await view.save();
    res.json(updatedView);

  } catch (error) {
    console.error('Error renaming column:', error);
    res.status(500).json({ message: 'Error renaming column' });
  }
};

exports.updateBoardStatus = async (req, res) => {
  try {
    const { boardId, viewId, statuses, columnId } = req.body;

    // Find and update the view
    const view = await View.findById(viewId);
    if (!view) {
      return res.status(404).json({ message: 'View not found' });
    }

    // Update the statuses in the view's table columns
    view.table.columns = view.table.columns.map(col => {
      if (col._id.toString() === columnId) {
        return { ...col, statuses };
      }
      return col;
    });

    // Save the updated view
    const updatedView = await view.save();

    // Also update the board's status settings
    const board = await Board.findById(boardId);
    if (board) {
      board.statusSettings = statuses;
      await board.save();
    }

    res.json(updatedView);
  } catch (error) {
    console.error('Error updating board statuses:', error);
    res.status(500).json({ message: 'Server error' });
  }
};