const express = require('express');
const viewController = require('../controllers/viewController');
const auth = require('../middleware/auth');
const View = require('../models/View');
const mongoose = require('mongoose');
const { evaluateFormula, processViewFormulas } = require('../utils/formulaEvaluator');
const Board = require('../models/Board');

const router = express.Router();

router.get('/:boardId', auth, viewController.getViews);
router.post('/', auth, viewController.createView);
router.put('/updateView', auth, viewController.updateView);
router.delete('/deleteView', auth, viewController.deleteView);
router.post('/duplicate', auth, viewController.duplicateView);

// Group operations
router.patch('/renameGroup', auth, viewController.renameGroup);
router.post('/duplicateGroup', auth, viewController.duplicateGroup);
router.post('/deleteGroup', auth, viewController.deleteGroup);
router.post('/createGroup', auth, viewController.createGroup);

// Add item to group
router.post('/addItem', auth, viewController.addItemToGroup);

// Add this new route for deleting items
router.post('/deleteRawItem', auth, viewController.deleteRawItem);

router.post('/addColumn', auth, viewController.addColumn);

// Add this line with the other routes
router.post('/deleteColumn', auth, viewController.deleteColumn);

// Add this line with other routes
router.patch('/updateCell', auth, viewController.updateCell);

router.put('/updateCellPermissions', auth, viewController.updateCellPermissions);

router.put('/updateCellViewPermissions', auth, viewController.updateCellViewPermissions);

// Add this line with other routes
router.put('/renameColumn', auth, viewController.renameColumn);

router.patch('/updateBoardStatus', auth, viewController.updateBoardStatus);

router.patch('/moveRow', auth, async (req, res) => {
  try {
    const { viewId, sourceGroupId, targetGroupId, rowId } = req.body;

    // Find the view
    const view = await View.findById(viewId);
    if (!view) {
      return res.status(404).json({ message: 'View not found' });
    }

    // Find source and target groups
    const sourceGroup = view.table.groups.find(g => g._id.toString() === sourceGroupId);
    const targetGroup = view.table.groups.find(g => g._id.toString() === targetGroupId);

    if (!sourceGroup || !targetGroup) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Find the row index in the source group
    const rowIndex = sourceGroup.rows.findIndex(r => r._id.toString() === rowId);
    if (rowIndex === -1) {
      return res.status(404).json({ message: 'Row not found' });
    }

    // Remove the row from the source group
    const [movedRow] = sourceGroup.rows.splice(rowIndex, 1);
    
    // Add row to target group
    targetGroup.rows.push(movedRow);

    // Save the changes
    await view.save();
    
    res.json(view);
  } catch (error) {
    console.error('Error moving row:', error);
    res.status(500).json({ message: 'Error moving row', error: error.message });
  }
});

// Add routes for task actions
router.post('/duplicateRow', async (req, res) => {
  try {
    const { viewId, groupId, rowId } = req.body;

    // Find the view
    const view = await View.findById(viewId);
    if (!view) {
      return res.status(404).json({ message: 'View not found' });
    }

    // Find the group
    const group = view.table.groups.find(g => g._id.toString() === groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Find the row to duplicate
    const rowIndex = group.rows.findIndex(r => r._id.toString() === rowId);
    if (rowIndex === -1) {
      return res.status(404).json({ message: 'Row not found' });
    }

    // Create a duplicate of the row with a new ID
    const originalRow = group.rows[rowIndex];
    const duplicatedRow = {
      ...JSON.parse(JSON.stringify(originalRow)),
      _id: new mongoose.Types.ObjectId()
    };

    // Add the duplicated row right after the original
    group.rows.splice(rowIndex + 1, 0, duplicatedRow);

    // Save the changes
    await view.save();
    
    res.json(view);
  } catch (error) {
    console.error('Error duplicating row:', error);
    res.status(500).json({ message: 'Error duplicating row', error: error.message });
  }
});

router.post('/archiveRow', async (req, res) => {
  try {
    const { viewId, groupId, rowId } = req.body;

    // Find the view
    const view = await View.findById(viewId);
    if (!view) {
      return res.status(404).json({ message: 'View not found' });
    }

    // Find the group
    const group = view.table.groups.find(g => g._id.toString() === groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Find the row to archive
    const rowIndex = group.rows.findIndex(r => r._id.toString() === rowId);
    if (rowIndex === -1) {
      return res.status(404).json({ message: 'Row not found' });
    }

    // If the view doesn't have an archives array, create one
    if (!view.archives) {
      view.archives = [];
    }

    // Move the row from the group to the archives
    const [archivedRow] = group.rows.splice(rowIndex, 1);
    view.archives.push({
      ...archivedRow,
      archivedAt: new Date(),
      originalGroup: groupId
    });

    // Save the changes
    await view.save();
    
    res.json(view);
  } catch (error) {
    console.error('Error archiving row:', error);
    res.status(500).json({ message: 'Error archiving row', error: error.message });
  }
});

// Apply formula to all items in a view (across all groups or a specific group)
router.post('/applyFormulaToAll', auth, async (req, res) => {
  try {
    const { viewId, groupId, columnId, formula, applyToAllGroups = false } = req.body;
    console.log('Applying formula to items:', { viewId, groupId, columnId, formula, applyToAllGroups });

    // Find the view with one query
    const view = await View.findById(viewId);
    if (!view) {
      return res.status(404).json({ message: 'View not found' });
    }

    // Determine which groups to process
    let groupsToProcess = [];
    
    if (applyToAllGroups) {
      // Apply to all groups in the view
      groupsToProcess = view.table.groups;
      console.log(`Applying formula to all ${groupsToProcess.length} groups in the view`);
    } else if (groupId) {
      // Apply to a specific group
      const targetGroup = view.table.groups.find(g => g._id.toString() === groupId);
      if (!targetGroup) {
        return res.status(404).json({ message: 'Group not found' });
      }
      groupsToProcess = [targetGroup];
      console.log(`Applying formula to 1 specific group: ${targetGroup.title}`);
    } else {
      return res.status(400).json({ message: 'Either groupId or applyToAllGroups must be provided' });
    }

    // Statistics for tracking changes
    let totalRowsProcessed = 0;
    let totalCellsAdded = 0;
    let totalCellsUpdated = 0;
    let totalCellsRemoved = 0;

    // Check if formula contains cell references
    const hasCellReferences = /\{([^}]+)\}/g.test(formula);
    const hasArithmeticOps = /[\+\-\*\/]/.test(formula);
    
    console.log(`Formula contains cell references: ${hasCellReferences}, arithmetic operators: ${hasArithmeticOps}`);

    // Process each group
    for (const group of groupsToProcess) {
      console.log(`Processing group: ${group.title} with ${group.rows?.length || 0} rows`);
      
      // Skip if no rows
      if (!group.rows || group.rows.length === 0) {
        console.log(`Group has no rows, skipping`);
        continue;
      }

      // Process rows in this group
      for (const row of group.rows) {
        // Ensure cells array exists
        if (!row.cells) {
          row.cells = [];
        }

        // First, let's remove any duplicate cells (cells with same columnId)
        // This handles the case where we have multiple cells for the same column
        const uniqueCellsByColumnId = {};
        const duplicateCells = [];
        
        for (const cell of row.cells) {
          if (!cell.columnId) continue;
          
          const columnIdStr = cell.columnId.toString();
          
          if (uniqueCellsByColumnId[columnIdStr]) {
            duplicateCells.push(cell);
          } else {
            uniqueCellsByColumnId[columnIdStr] = cell;
          }
        }
        
        if (duplicateCells.length > 0) {
          // Remove duplicates
          row.cells = row.cells.filter(cell => !duplicateCells.includes(cell));
          totalCellsRemoved += duplicateCells.length;
        }

        // Create a map of column names to cell values for this row if needed for arithmetic
        let cellDataMap = {};
        if (hasCellReferences) {
          view.table.columns.forEach(column => {
            const cell = row.cells.find(c => 
              c.columnId && c.columnId.toString() === column._id.toString()
            );
            
            if (cell) {
              let cellValue = cell.value;
              
              // Handle object values (e.g., status)
              if (cellValue && typeof cellValue === 'object' && cellValue.value !== undefined) {
                cellValue = cellValue.value;
              }
              
              // Store by column name for reference
              cellDataMap[column.name] = cellValue;
            }
          });
        }

        // Evaluate the formula for each row individually (with its own cell data)
        const evaluatedValue = hasCellReferences 
          ? evaluateFormula(formula, cellDataMap)
          : evaluateFormula(formula);
          
        console.log(`Formula "${formula}" for row ${row._id} evaluated to "${evaluatedValue}"`);

        // Now handle the target column
        const cellIndex = row.cells.findIndex(cell => 
          cell.columnId && cell.columnId.toString() === columnId
        );

        if (cellIndex >= 0) {
          // Update existing cell - store both the formula and its result
          // Save as an object with value (original formula) and displayValue (evaluated result)
          row.cells[cellIndex].value = {
            value: formula,
            displayValue: evaluatedValue
          };
          totalCellsUpdated++;
        } else {
          // Create new cell - store both the formula and its result
          row.cells.push({
            _id: new mongoose.Types.ObjectId(),
            columnId: columnId,
            value: {
              value: formula,
              displayValue: evaluatedValue
            }
          });
          totalCellsAdded++;
        }
        
        totalRowsProcessed++;
      }
    }

    // Process and update all formula cells in the view for consistency
    const processedView = processViewFormulas(view);

    // Save the view with all updates in one operation
    await processedView.save();

    console.log(`Updated ${totalRowsProcessed} rows across ${groupsToProcess.length} groups`);
    console.log(`Stats: ${totalCellsUpdated} updated, ${totalCellsAdded} added, ${totalCellsRemoved} removed`);
    console.log('Formula applied successfully');
    
    res.json(processedView);
  } catch (error) {
    console.error('Error applying formula to items:', error);
    res.status(500).json({ 
      message: 'Error applying formula to items', 
      error: error.message,
      stack: error.stack 
    });
  }
});

// Utility route to clean up duplicate cells
router.post('/cleanupDuplicateCells', auth, async (req, res) => {
  try {
    console.log('Starting cleanup of duplicate cells');
    const { viewId } = req.body;
    
    let filter = {};
    if (viewId) {
      // Clean up cells for a specific view
      filter = { _id: viewId };
    }
    
    // Find all views (or specific view)
    const views = await View.find(filter);
    
    let totalViewsProcessed = 0;
    let totalGroupsProcessed = 0;
    let totalRowsProcessed = 0;
    let totalDuplicatesRemoved = 0;
    
    for (const view of views) {
      totalViewsProcessed++;
      console.log(`Processing view: ${view._id}`);
      
      if (!view.table || !view.table.groups || !view.table.groups.length) {
        console.log(`View ${view._id} has no groups`);
        continue;
      }
      
      let viewWasModified = false;
      
      // Process each group
      for (const group of view.table.groups) {
        totalGroupsProcessed++;
        console.log(`Processing group: ${group._id} with ${group.rows?.length || 0} rows`);
        
        if (!group.rows || !group.rows.length) {
          continue;
        }
        
        // Process each row
        for (const row of group.rows) {
          totalRowsProcessed++;
          
          if (!row.cells || !row.cells.length) {
            continue;
          }
          
          // Find duplicate cells (cells with the same columnId)
          const processedColumnIds = new Set();
          const uniqueCells = [];
          const duplicates = [];
          
          for (const cell of row.cells) {
            if (!cell.columnId) continue;
            
            const columnIdStr = cell.columnId.toString();
            
            if (processedColumnIds.has(columnIdStr)) {
              // This is a duplicate
              duplicates.push(cell);
            } else {
              // First occurrence
              processedColumnIds.add(columnIdStr);
              uniqueCells.push(cell);
            }
          }
          
          // If duplicates found, replace cells with uniqueCells
          if (duplicates.length > 0) {
            totalDuplicatesRemoved += duplicates.length;
            row.cells = uniqueCells;
            viewWasModified = true;
            console.log(`Removed ${duplicates.length} duplicate cells from row ${row._id}`);
          }
        }
      }
      
      // Save the view if modified
      if (viewWasModified) {
        await view.save();
        console.log(`Saved view ${view._id} after removing duplicates`);
      }
    }
    
    const summary = {
      totalViewsProcessed,
      totalGroupsProcessed, 
      totalRowsProcessed,
      totalDuplicatesRemoved
    };
    
    console.log('Cleanup completed:', summary);
    res.json({ 
      message: 'Cleanup completed successfully', 
      summary 
    });
  } catch (error) {
    console.error('Error cleaning up duplicate cells:', error);
    res.status(500).json({ 
      message: 'Error cleaning up duplicate cells', 
      error: error.message 
    });
  }
});

// Move row (item) to another board
router.post('/moveRowToBoard', auth, async (req, res) => {
  try {
    const { 
      sourceViewId, 
      sourceGroupId, 
      rowId, 
      targetBoardId 
    } = req.body;

    // Find source view
    const sourceView = await View.findById(sourceViewId);
    if (!sourceView) {
      return res.status(404).json({ message: 'Source view not found' });
    }

    // Find target board
    const targetBoard = await Board.findById(targetBoardId);
    if (!targetBoard) {
      return res.status(404).json({ message: 'Target board not found' });
    }

    // Find the default view of the target board (or any view - assuming the first one)
    const targetView = await View.findOne({ 
      board: targetBoardId, 
      isDefault: true 
    });
    
    if (!targetView) {
      return res.status(404).json({ message: 'Target view not found' });
    }

    // Find source group
    const sourceGroup = sourceView.table.groups.find(g => g._id.toString() === sourceGroupId);
    if (!sourceGroup) {
      return res.status(404).json({ message: 'Source group not found' });
    }

    // Find the row to move
    const rowIndex = sourceGroup.rows.findIndex(r => r._id.toString() === rowId);
    if (rowIndex === -1) {
      return res.status(404).json({ message: 'Row not found' });
    }

    // Get the row
    const [movedRow] = sourceGroup.rows.splice(rowIndex, 1);

    // Create a new row for the target view with cells that match the column structure
    const newRow = {
      _id: new mongoose.Types.ObjectId(), // Generate new ID for the row
      cells: targetView.table.columns.map(targetColumn => {
        // Try to find a matching column in the source view by type and title
        const matchingSourceColumn = sourceView.table.columns.find(
          col => col.type === targetColumn.type && col.title === targetColumn.title
        );

        // Find the cell from the moved row that corresponds to the matching column
        const matchingCell = matchingSourceColumn 
          ? movedRow.cells.find(cell => cell.columnId.toString() === matchingSourceColumn._id.toString())
          : null;

        // Use the value from the matching cell, or provide a default value
        return {
          columnId: targetColumn._id,
          value: matchingCell ? matchingCell.value : targetColumn.type === 'item' ? movedRow.cells[0].value : ''
        };
      })
    };

    // Add the new row to the first group of the target view
    if (targetView.table.groups.length > 0) {
      targetView.table.groups[0].rows.push(newRow);
    }

    // Save both views
    await Promise.all([sourceView.save(), targetView.save()]);

    // Return the updated source view
    res.json(sourceView);
  } catch (error) {
    console.error('Error moving row to board:', error);
    res.status(500).json({ message: 'Error moving row to board', error: error.message });
  }
});

module.exports = router; 