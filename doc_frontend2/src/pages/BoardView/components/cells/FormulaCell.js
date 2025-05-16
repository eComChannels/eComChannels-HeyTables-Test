import React, { useState, useRef, useEffect } from "react";
import { FiPlus } from "react-icons/fi";
import FormulaBuilder from "../FormulaBuilder";
import api from "../../../../services/api";
import { useSelector } from "react-redux";
import { MdLock } from "react-icons/md";
// Helper function to safely convert values to numbers
const safelyConvertToNumber = (value) => {
  // Handle null/undefined
  if (value === null || value === undefined) {
    return { success: false, value: 0, error: "Value is null or undefined" };
  }

  // If already a number, just return it
  if (typeof value === "number") {
    return { success: true, value };
  }

  // For objects with value property (like in status cells)
  if (typeof value === "object" && value !== null) {
    if (typeof value.value !== "undefined") {
      return safelyConvertToNumber(value.value);
    }
    return {
      success: false,
      value: 0,
      error: "Cannot convert object to number",
    };
  }

  // For string values, try to parse after cleaning
  if (typeof value === "string") {
    // Remove currency symbols, commas, and excess whitespace
    const cleanValue = value.replace(/[$,\s]+/g, "");

    // Empty string case
    if (cleanValue === "") {
      return { success: false, value: 0, error: "Empty string" };
    }

    // Try to parse as number
    const num = parseFloat(cleanValue);
        if (!isNaN(num)) {
      return { success: true, value: num };
    }
  }

  // Default failure case
  return {
    success: false,
    value: 0,
    error: `Cannot convert "${value}" to number`,
  };
};

// Simple client-side formula evaluator
// Follows Microsoft Excel calculation logic
const evaluateFormula = (formula, cellData = {}) => {
  try {
    // If formula is not a string, return empty string
    if (typeof formula !== "string") {
      console.log("Formula is not a string:", formula);
      return "";
    }

    // Process cell references like {ColumnName}
    // First, check if we have arithmetic operations with cell references
    const cellRefRegex = /\{([^}]+)\}/g;
    let hasArithmeticOps = /[\+\-\*\/]/.test(formula);
    console.log("hasArithmeticOps:", hasArithmeticOps);
    console.log("cellRefRegex:", cellRefRegex.test(formula));
    // If the formula contains cell references and arithmetic operations
    if (cellRefRegex.test(formula) && hasArithmeticOps) {
      try {
        // Reset regex state
        cellRefRegex.lastIndex = 0;

        // Replace all cell references with their values
        let processedFormula = formula;
        let match;

        while ((match = cellRefRegex.exec(formula)) !== null) {
          const columnName = match[1];

          // Get cell value from cellData
          let cellValue = cellData[columnName];
          console.log("Cell value:", cellValue);

          // If cellValue is not provided or invalid, return error
          if (cellValue === undefined || cellValue === null) {
            return `#ERROR: Missing value for column "${columnName}"`;
          }

          // Convert to number using our helper function
          const numericResult = safelyConvertToNumber(cellValue);

          if (!numericResult.success) {
            return `#ERROR: Non-numeric value in column "${columnName}": ${numericResult.error}`;
          }

          // Replace the cell reference with the numeric value
          processedFormula = processedFormula.replace(
            match[0],
            numericResult.value
          );
        }

        // Evaluate the arithmetic expression
        try {
          // Use Function constructor to safely evaluate the arithmetic expression
          // This is a controlled environment with only numeric values and operators
          const result = Function(
            `"use strict"; return (${processedFormula})`
          )();

          // Format the result to show exactly 3 decimal places
          return typeof result === "number"
            ? parseFloat(result.toFixed(3)).toString()
            : result;
        } catch (evalError) {
          return `#ERROR: Invalid arithmetic expression: ${evalError.message}`;
        }
      } catch (cellRefError) {
        return `#ERROR: ${cellRefError.message}`;
      }
    }

    return formula;
  } catch (error) {
    console.error("Error evaluating formula:", error);
    return formula || "";
  }
};

const FormulaCell = ({
  value,
  rowId,
  columnId,
  cellId,
  onUpdateCell,
  viewId,
  groupId,
  boardId,
  viewData,
  rowData,
  column,
  board,
}) => {
  console.log("value", value);
  const [isHovering, setIsHovering] = useState(false);
  const [showFormulaBuilder, setShowFormulaBuilder] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [formulaValue, setFormulaValue] = useState(
    // Handle different value formats: 
    // 1. Object with formula/displayValue (new format from backend)
    // 2. Simple string (old format)
    value && typeof value === "object" && value.displayValue
      ? value.displayValue
      : typeof value === "string"
      ? value
      : ""
  );
  const cellRef = useRef(null);
  const popupRef = useRef(null);
  const { user } = useSelector((state) => state.auth);
  const isOwner = board?.userId === user?.id;

  const canEdit = column?.canEdit?.some((u) => u._id === user?.id);
  const canView = column?.canView?.some((u) => u._id === user?.id);
  
  // Handle clicks outside of the popup to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target) &&
          !(cellRef.current && cellRef.current.contains(event.target))) {
        setShowEditPopup(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Update formulaValue when the value prop changes
  useEffect(() => {
    if (value && typeof value === "object" && value.value) {
      // Get the original formula from the value object
      setFormulaValue(value.value);
    } else if (typeof value === "string") {
      // If it's a string, use it directly
      setFormulaValue(value);
    }
  }, [value]);
  
  const handleFormulaChange = (e) => {
    const newValue = e.target.value;
    setFormulaValue(newValue);
    
    // Remove the validation that was preventing parameter editing
    // This allows users to freely edit the formula, including parameters
  };
  
  const handleSaveFormula = async () => {
    try {
      setIsHovering(false);
      // Validate formula
      if (!formulaValue.trim()) {
        alert("Please select a formula function");
        return;
      }

      // Check for cell references (e.g., {Column Name})
      const hasCellReferences = /{([^}]+)}/g.test(formulaValue);

      // Check for arithmetic operations (+, -, *, /)
      const hasArithmeticOperations = /[\+\-\*\/]/.test(formulaValue);

      console.log("Applying formula to current cell:", {
        rowId,
        cellId,
        formulaValue,
      });
      
      // First evaluate the formula to get the current value
      // const evaluatedValue = evaluateFormula(formulaValue);
      console.log("formulaValue:", formulaValue);
      console.log("Formula evaluation result:", evaluatedValue);
      
      // Update both columnId and cellId are the same thing - make sure we're consistent
      const columnIdToUse = cellId;
      
      // Add loading state
      const button = document.querySelector(".apply-formula-button");
      if (button) {
        button.disabled = true;
        button.textContent = "Applying...";
      }

      try {
        // First apply to the current cell
        await onUpdateCell({
          rowId,
          cellId: columnIdToUse,
          value: {
            value: formulaValue,
            displayValue:
              evaluatedValue === undefined || evaluatedValue === null
                ? ""
                : String(evaluatedValue),
          },
        });

        console.log(
          "Formula applied to current cell, now applying to all items"
        );

        // Then apply to all items - this endpoint will clean up duplicates
        // const response = await api.post("/views/applyFormulaToAll", {
        //   viewId,
        //   groupId,
        //   columnId: columnIdToUse,
        //   formula: formulaValue,
        //   applyToAllGroups: true, // Apply to all groups, not just the current one
        // });

        // console.log(
        //   "Formula applied successfully to all items:",
        //   response.data
        // );

        // Force a refresh of the view data in the parent component
        // window.dispatchEvent(
        //   new CustomEvent("formula-applied", {
        //     detail: {
        //       viewId,
        //       updatedData: response.data,
        //       formula: formulaValue,
        //       timestamp: Date.now(), // Add timestamp to ensure uniqueness
        //     },
        //   })
        // );
      
      // Close the popup after successful update
      setShowEditPopup(false);
    } catch (error) {
        // Specific handling for API errors
        console.error("API error applying formula:", error);
        throw error; // Re-throw to be caught by outer catch
      }
    } catch (error) {
      console.error("Error applying formula to all items:", error);
      // Add detailed error information
      const errorMessage =
        error.response?.data?.error || error.message || "Unknown error";
      // Show error to user
      alert(`Failed to apply formula: ${errorMessage}`);
    } finally {
      // Reset button state
      const button = document.querySelector(".apply-formula-button");
      if (button) {
        button.disabled = false;
        button.textContent = "Apply to cell";
      }
    }
  };
  
  const handleInsertFunction = (functionName) => {
    
    // Set the formula value exactly as provided, with parameters if included
    setFormulaValue(functionName);
    
    // Immediately evaluate to see if there are any errors
    const evaluated = evaluateFormula(functionName);
    console.log("Evaluated formula:", evaluated);
    
    // Close the formula builder
    setShowFormulaBuilder(false);
    
    // Show the edit popup to let the user edit the formula
    setShowEditPopup(true);
  };
  
  const handleOpenFormulaBuilder = (e) => {
    // e.stopPropagation();
    
    // Ensure we have the right formula value for editing
    if (value && typeof value === "object" && value.value) {
      // Get the original formula from the value object
      setFormulaValue(value.value);
    } else if (typeof value === "string") {
      // If it's a string, use it directly
      setFormulaValue(value);
    }
    
    // Open edit popup directly
    setShowEditPopup(true);
  };
  
  // Function to get cell data from the row
  const getCellDataMap = () => {
    if (
      !rowData ||
      !rowData.cells ||
      !viewData ||
      !viewData.table ||
      !viewData.table.columns
    ) {
      return {};
    }

    // Create a map of column names to values
    const cellDataMap = {};

    // Create a case-insensitive map for fallback lookup
    const caseInsensitiveMap = {};

    // Map row cell values to column names
    viewData.table.columns.forEach((column) => {
      const cell = rowData.cells.find((c) => c.columnId === column._id);
      const columnType = column.type;

      if (cell) {
        // Handle different types of cell values
        let cellValue =
          columnType === "formula" ? cell?.value?.displayValue : cell.value;
        // Handle object values (e.g., status)
        if (
          cellValue &&
          typeof cellValue === "object" &&
          cellValue.value !== undefined
        ) {
          cellValue = cellValue.value;
        }

        // Store by column name for reference
        if (column.name) {
          cellDataMap[column.name] = cellValue;
          // Also store by column title if different from name
          if (column.title && column.title !== column.name) {
            cellDataMap[column.title] = cellValue;
          }

          // Store lowercase versions for case-insensitive fallback
          caseInsensitiveMap[column.name.toLowerCase()] = cellValue;
          if (column.title) {
            caseInsensitiveMap[column.title.toLowerCase()] = cellValue;
          }
        }

        // Also store by column title if name is not available
        if (!column.name && column.title) {
          cellDataMap[column.title] = cellValue;
          caseInsensitiveMap[column.title.toLowerCase()] = cellValue;
        }
      }
    });

    // Add a proxy for case-insensitive column name access as fallback
    return new Proxy(cellDataMap, {
      get: (target, prop) => {
        // First try exact match
        if (prop in target) {
          return target[prop];
        }

        // Then try case-insensitive match as fallback
        if (
          typeof prop === "string" &&
          prop.toLowerCase() in caseInsensitiveMap
        ) {
          // console.log(`Using case-insensitive match for column: ${prop}`);
          return caseInsensitiveMap[prop.toLowerCase()];
        }

        // If still not found, return undefined (will be handled by formula evaluator)
        return undefined;
      },
    });
  };

  const getEvaluatedValue = (formula, rowId) => {
    const cellDataMap = getCellDataMap(rowId);
    try {
      // Replace cell references with their actual values
      let evaluatedFormula = formula.replace(
        /{([^}]+)}/g,
        (match, columnName) => {
          const value = cellDataMap[columnName];
          if (value === undefined) {
            console.error(
              `Column not found: "${columnName}". Available columns:`,
              Object.keys(cellDataMap).join(", ")
            );
            throw new Error(`Column "${columnName}" not found`);
          }

          // Convert to number if possible for arithmetic operations
          const numericResult = safelyConvertToNumber(value);
          if (numericResult.success) {
            return numericResult.value;
          }

          // Return as string with quotes for non-numeric values
          return typeof value === "string" ? `"${value}"` : String(value);
        }
      );

      try {
        // Use Function constructor to safely evaluate the arithmetic expression
        // This allows basic operations like +, -, *, / but not arbitrary code execution
        const result = new Function(`return ${evaluatedFormula}`)();

        // Ensure we return a string or primitive, not an object
        if (result === null || result === undefined) {
          return "";
        } else if (typeof result === "object") {
          return JSON.stringify(result);
        } else {
          return result;
        }
      } catch (error) {
        console.error("Error evaluating arithmetic expression:", error);
        return "Error: " + error.message;
      }
    } catch (error) {
      console.error("Error in formula evaluation:", error);
      return "Error: " + error.message;
    }
  };

  // Get formula text to show as a tooltip (either raw formula or both formula and result)
  const getTooltipText = () => {
    let result = "";
    
    // Get the raw formula
    if (value && typeof value === "object" && value.value) {
      result = value.value;
    } else if (typeof value === "string") {
      result = value;
    }
    
    // If there's no formula, don't show tooltip
    if (!result) return "";
    
    // If the evaluated result is different from the formula, show both
    const evaluated = getEvaluatedValue(result, rowId);
    if (evaluated && evaluated !== result) {
      result = `${result}\n= ${evaluated}`;
    }
    
    return result;
  };

  const evaluatedValue = getEvaluatedValue(formulaValue, rowId);
  const tooltipText = getTooltipText();
  
  // Force component refresh when the formula is applied
  useEffect(() => {
    const handleFormulaApplied = (event) => {
      // Check if this cell's view is the one that got updated
      if (event.detail.viewId === viewId) {
        console.log("Formula applied event received:", event.detail);
        
        // If we have a new formula from the event, update our local state
        if (event.detail.formula) {
          setFormulaValue(event.detail.formula);
        }
      }
    };
    
    // Listen for formula-applied events
    window.addEventListener("formula-applied", handleFormulaApplied);
    
    return () => {
      window.removeEventListener("formula-applied", handleFormulaApplied);
    };
  }, [viewId]);
  
  // Refresh the component when value changes
  useEffect(() => {
    // Only set the formula value from props during initial render or when receiving a new value from the server
    // Don't update if user is actively editing the formula (when showEditPopup is true)
    if (value && !showEditPopup) {
      if (
        typeof value === "object" &&
        value.value &&
        value.value !== formulaValue
      ) {
        setFormulaValue(value.value);
      } else if (typeof value === "string" && value !== formulaValue) {
        setFormulaValue(value);
      }
    }
  }, [value, formulaValue, showEditPopup]);

  if (!canView && !isOwner) {
    return (
      <div className="flex p-2 items-center justify-center w-full h-full bg-skin-muted">
        <MdLock className="text-skin-muted" size={16} />
      </div>
    );
  }
  
  return (
    <div 
      className="w-full h-full relative"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      ref={cellRef}
    >
      <div className="flex items-center h-full w-full">
        <div 
          className="max-w-full px-2 overflow-hidden cursor-pointer"
          style={{ 
            minWidth: 0,
            flex: 1,
            maxHeight: "100%",
            display: "-webkit-box",
            WebkitLineClamp: "1",
            WebkitBoxOrient: "vertical",
            textOverflow: "ellipsis",
          }}
          onClick={() => {
            if (canEdit || isOwner) {
              handleOpenFormulaBuilder();
            }
          }}
        >
          {evaluatedValue &&
          typeof evaluatedValue === "string" &&
          evaluatedValue.startsWith("Error:") ? (
            <span className="text-red-500">
              {evaluatedValue.split(":")[0] + ": Error"}
            </span>
          ) : evaluatedValue &&
            typeof evaluatedValue === "string" &&
            evaluatedValue.startsWith("#ERROR") ? (
            <span className="text-red-500">Error</span>
          ) : (
            evaluatedValue || (
              <span className="text-skin-secondary opacity-50">Formula</span>
            )
          )}
        </div>
      </div>
      
      {/* Custom tooltip that appears on hover */}
      {isHovering && tooltipText && (
        <div 
          className="absolute z-50 left-0 top-full mt-1 px-3 py-2 rounded shadow-lg text-sm font-mono whitespace-pre-wrap max-w-sm pointer-events-none border"
          style={{
            maxHeight: "200px",
            overflowY: "auto",
            lineHeight: "1.4",
            fontSize: "12px",
            backgroundColor: "var(--color-card)",
            color: "var(--text-primary)",
            borderColor: "var(--border-color)",
          }}
        >
          {evaluatedValue &&
          typeof evaluatedValue === "string" &&
          (evaluatedValue.startsWith("Error:") ||
            evaluatedValue.startsWith("#ERROR")) ? (
            <div>
              <span className="text-red-500 font-bold block mb-1">
                {evaluatedValue}
              </span>
              {evaluatedValue.includes("Column") &&
                evaluatedValue.includes("not found") && (
                  <div className="mt-2 border-t border-gray-200 pt-2">
                    <span className="block text-xs text-skin-secondary mb-1">
                      Available columns:
                    </span>
                    <div className="text-xs text-skin-secondary">
                      {rowData &&
                        viewData?.table?.columns &&
                        viewData.table.columns
                          .map((col) => col.title || col.name)
                          .filter(Boolean)
                          .join(", ")}
                    </div>
        </div>
      )}
            </div>
          ) : (
            tooltipText
          )}
        </div>
      )}
      
      {isHovering && (
        <div className="absolute inset-0 flex items-center justify-center bg-skin-hover/30 z-[60]">
          <button 
            className="flex items-center justify-center bg-skin-hover rounded-full w-7 h-7 text-skin-secondary hover:text-skin-primary" 
            title="Add function"
            onClick={() => {
              if (canEdit || isOwner) {
                handleOpenFormulaBuilder();
              }
            }}
          >
            <FiPlus className="w-4 h-4" />
          </button>
        </div>
      )}
      
      {/* Edit Formula Popup */}
      {showEditPopup && (
        <div 
          className="absolute z-50 top-full right-0 mt-1 border rounded-md shadow-lg p-4"
          style={{
            backgroundColor: "var(--color-card)",
            borderColor: "var(--border-color)",
            color: "var(--text-primary)",
            width: "320px", // Increase the width of the formula editor popup
            transform: "translateX(-40%)", // Shift the popup to the left by 40% of its width
          }}
          ref={popupRef}
        >
          <h3
            className="font-medium mb-2"
            style={{ color: "var(--text-primary)" }}
          >
            Edit Formula
          </h3>
          
          <div className="flex items-center justify-between mb-3">
            <button 
              onClick={() => setShowFormulaBuilder(true)}
              className="flex items-center justify-center p-1 rounded-md border"
              style={{ 
                borderColor: "var(--border-color)",
                color: "var(--text-primary)",
                backgroundColor: "var(--color-card)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--color-hover)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "var(--color-card)";
              }}
              title="Select formula function"
            >
              <FiPlus
                className="w-4 h-4"
                style={{ color: "var(--text-primary)" }}
              />
              <span
                className="ml-1 text-sm"
                style={{ color: "var(--text-primary)" }}
              >
                Select Function
              </span>
            </button>
            <span
              className="text-xs"
              style={{ color: "var(--text-secondary)" }}
            >
              Only one function allowed
            </span>
          </div>
          
          <textarea
            className="w-full h-24 p-2 border rounded-md resize-none mb-3 font-mono"
            style={{
              backgroundColor: "var(--color-input)",
              borderColor: "var(--border-color)",
              color: "var(--text-primary)",
              fontSize: "14px",
            }}
            value={formulaValue}
            onChange={handleFormulaChange}
            placeholder="Select a function"
            spellCheck="false"
            autoFocus
          />
          
          <div className="flex justify-end">
            <button
              onClick={() => {
                // Revert any changes by resetting to the original value
                if (value && typeof value === "object" && value.value) {
                  setFormulaValue(value.value);
                } else if (typeof value === "string") {
                  setFormulaValue(value);
                }
                setShowEditPopup(false);
                setIsHovering(false);
              }}
              className="px-3 py-1 mr-2 border rounded-md"
              style={{
                borderColor: "var(--border-color)",
                backgroundColor: "var(--color-card)",
                color: "var(--text-secondary)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--color-hover)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "var(--color-card)";
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSaveFormula}
              className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-md apply-formula-button"
            >
              Apply to cell
            </button>
          </div>
        </div>
      )}

      {/* Formula Builder */}
      <FormulaBuilder 
        isOpen={showFormulaBuilder} 
        onClose={() => setShowFormulaBuilder(false)} 
        onSelectFunction={handleInsertFunction}
        viewId={viewId}
        groupId={groupId}
        columnId={cellId}
      />
    </div>
  );
};

export default FormulaCell; 
