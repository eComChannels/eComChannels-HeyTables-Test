import React, { useState, useEffect, useRef } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';
import api from '../../../services/api';

// Function categories and their functions
const FORMULA_FUNCTIONS = {
  'Arithmetic': [
    { name: 'Addition', description: 'Add values of two cells', syntax: '{Column1} + {Column2}' },
    { name: 'Subtraction', description: 'Subtract one cell value from another', syntax: '{Column1} - {Column2}' },
    { name: 'Multiplication', description: 'Multiply values of two cells', syntax: '{Column1} * {Column2}' },
    { name: 'Division', description: 'Divide one cell value by another', syntax: '{Column1} / {Column2}' },
    { name: 'Combined', description: 'Combine multiple operations', syntax: '({Column1} + {Column2}) * 2' },
  ]
};

const FormulaBuilder = ({ 
  isOpen, 
  onClose, 
  onSelectFunction,
  viewId,
  groupId,
  columnId 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategory, setExpandedCategory] = useState('Arithmetic');
  const [filteredFunctions, setFilteredFunctions] = useState(FORMULA_FUNCTIONS);
  const [selectedFunction, setSelectedFunction] = useState(null);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [availableColumns, setAvailableColumns] = useState([]);
  const inputRef = useRef(null);

  // Focus the search input when the builder opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current.focus();
      }, 50);
    }
  }, [isOpen]);

  // Get available columns when the builder opens
  useEffect(() => {
    if (isOpen && viewId) {
      const fetchColumns = async () => {
        try {
          const response = await api.get(`/views/${viewId}`);
          if (response.data && response.data.table && response.data.table.columns) {
            const columns = response.data.table.columns.map(col => ({
              id: col._id,
              name: col.title || col.name || 'Unnamed Column',
              type: col.type
            }));
            setAvailableColumns(columns);
          }
        } catch (error) {
          console.error('Error fetching columns:', error);
        }
      };
      
      fetchColumns();
    }
  }, [isOpen, viewId]);

  // Filter functions based on search query
  useEffect(() => {
    if (!searchQuery) {
      setFilteredFunctions(FORMULA_FUNCTIONS);
      return;
    }

    const lowerCaseQuery = searchQuery.toLowerCase();
    const filtered = {};

    Object.entries(FORMULA_FUNCTIONS).forEach(([category, functions]) => {
      const matchedFunctions = functions.filter(func => 
        func.name.toLowerCase().includes(lowerCaseQuery) || 
        func.description.toLowerCase().includes(lowerCaseQuery)
      );

      if (matchedFunctions.length > 0) {
        filtered[category] = matchedFunctions;
      }
    });

    setFilteredFunctions(filtered);
  }, [searchQuery]);

  if (!isOpen) return null;

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleCategoryClick = (category) => {
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  const handleSelectFunction = (func) => {
    setSelectedFunction(func);
    if (onSelectFunction) {
      // When selecting a function with parameters, pass the complete syntax
      const functionText = func.syntax || `${func.name}()`;
      
      // Log what's being sent to the FormulaCell
      console.log('Selected function with text:', functionText);
      
      onSelectFunction(functionText);
    }
  };

  const handleApplyToAllItems = async () => {
    if (!selectedFunction || !viewId || !groupId || !columnId) {
      // Can't apply without all required data
      onClose();
      return;
    }

    // Add loading state to the button
    const button = document.querySelector('.set-formula-button');
    if (button) {
      button.disabled = true;
      button.textContent = 'Applying...';
    }

    try {
      // Use the function's exact syntax
      const formulaString = selectedFunction.syntax || `${selectedFunction.name}()`;
      
      console.log('Applying formula to all items:', {
        viewId,
        groupId,
        columnId,
        formula: formulaString
      });
      
      // Call the API to apply the formula to all items in all groups
      const { data: updatedView } = await api.post('/views/applyFormulaToAll', {
        viewId,
        groupId,
        columnId,
        formula: formulaString,
        applyToAllGroups: true // Apply to all groups, not just the current one
      });

      console.log('Formula applied successfully:', updatedView);
      
      // Force a refresh of the view data in the parent component AND the UI
      window.dispatchEvent(new CustomEvent('formula-applied', { 
        detail: { 
          viewId, 
          updatedData: updatedView,
          formula: formulaString,
          timestamp: Date.now() // Add timestamp to ensure each event is unique
        } 
      }));
      
      // Add a small delay before closing to ensure the update is processed
      setTimeout(() => {
      onClose();
      }, 100);
      
    } catch (error) {
      console.error('Error applying formula to all items:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error';
      alert(`Failed to apply formula: ${errorMessage}`);
    } finally {
      // Reset button state
      const button = document.querySelector('.set-formula-button');
      if (button) {
        button.disabled = false;
        button.textContent = 'Set formula';
      }
    }
  };

  // Help Modal component
  const HelpModal = () => {
    if (!showHelpModal) return null;

    return (
      <div className="fixed inset-0 bg-black/30 z-[1001] flex justify-center items-center" onClick={() => setShowHelpModal(false)}>
        <div className="bg-skin-primary border border-[var(--border-color)] rounded-md p-6 max-w-2xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          <h2 className="text-xl font-semibold mb-4">Formula Help</h2>
          
          {/* Available Columns Section */}
          <div className="mb-6">
            <h3 className="font-medium text-lg mb-2">Available Columns</h3>
            <p className="mb-2">You can reference these columns in your formulas using curly braces:</p>
            <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded mb-2 max-h-[150px] overflow-y-auto">
              {availableColumns.length > 0 ? (
                <ul className="list-disc list-inside">
                  {availableColumns.map(col => (
                    <li key={col.id}>
                      <code>{`{${col.name}}`}</code> - <span className="text-sm text-slate-500">{col.type}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-amber-600">No columns available or still loading...</p>
              )}
            </div>
            <p className="text-amber-600 text-sm"><strong>Important:</strong> Column names are case-sensitive in formulas.</p>
          </div>
          
          <div className="mb-6">
            <h3 className="font-medium text-lg mb-2">Arithmetic Operations</h3>
            <p className="mb-2">You can create formulas that perform arithmetic calculations using values from other cells:</p>
            <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded mb-4">
              <code className="block mb-2"><span className="text-green-600">// Addition</span><br />{`{Text} + {Text1}`}</code>
              <code className="block mb-2"><span className="text-green-600">// Subtraction</span><br />{`{Text} - {Text1}`}</code>
              <code className="block mb-2"><span className="text-green-600">// Multiplication</span><br />{`{Text} * {Text1}`}</code>
              <code className="block mb-2"><span className="text-green-600">// Division</span><br />{`{Text} / {Text1}`}</code>
              <code className="block"><span className="text-green-600">// Combined operations</span><br />{`({Text} + {Text1}) * 2`}</code>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="font-medium text-lg mb-2">Cell References</h3>
            <p className="mb-2">Reference other cells by their column name in curly braces:</p>
            <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded mb-2">
              <code>{`{ColumnName}`}</code>
            </div>
            <p className="text-amber-600"><strong>Note:</strong> Column names are case-sensitive. Make sure to match the column name exactly.</p>
          </div>
          
          <div className="mb-6">
            <h3 className="font-medium text-lg mb-2">Examples</h3>
            <div className="space-y-3">
              <div>
                <p className="font-medium">Calculate the sum of two columns:</p>
                <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded">
                  <code>{`{Quantity} + {Price}`}</code>
                </div>
              </div>
              <div>
                <p className="font-medium">Calculate the total with tax:</p>
                <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded">
                  <code>{`{Price} * (1 + {TaxRate})`}</code>
                </div>
              </div>
              <div>
                <p className="font-medium">Calculate the average of three values:</p>
                <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded">
                  <code>{`({Value1} + {Value2} + {Value3}) / 3`}</code>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium text-lg mb-2">Error Handling</h3>
            <p className="mb-2">Formulas will show errors when calculations cannot be performed:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Non-numeric values will cause calculation errors</li>
              <li>Missing column references will show error messages</li>
              <li>Division by zero will result in an error</li>
            </ul>
          </div>
          
          <div className="mt-6 text-right">
            <button 
              onClick={() => setShowHelpModal(false)}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
    <div 
      className="fixed inset-0 bg-black/30 z-[1000] flex justify-center"
      onClick={onClose}
    >
      <div 
          className="border rounded-md shadow-lg w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col my-20 bg-skin-primary"
        onClick={e => e.stopPropagation()}
      >
          <div className="flex justify-between items-center p-4 border-b border-skin-border">
            <h2 className="font-medium text-skin-primary text-lg">Formula Builder</h2>
            <button 
              onClick={onClose}
              className="text-skin-secondary hover:text-skin-primary"
            >
              <FiX className="w-5 h-5" />
            </button>
        </div>
        
          <div className="p-4 border-b border-skin-border">
            <div className="relative mb-2">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-skin-secondary" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
                placeholder="Search functions"
                className="w-full bg-skin-input border border-skin-border rounded-md py-2 pl-10 pr-4 text-skin-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-skin-secondary">Select a function to insert into your formula</span>
              <button
                onClick={() => setShowHelpModal(true)}
                className="text-blue-500 hover:text-blue-600 text-sm font-medium"
              >
                Need help?
              </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {Object.entries(filteredFunctions).length === 0 ? (
            <div className="p-4 text-center" style={{ color: 'var(--text-secondary)' }}>
              No functions found matching your search.
            </div>
          ) : (
            Object.entries(filteredFunctions).map(([category, functions]) => (
              <div key={category} className="mb-2">
                <button
                  className="flex items-center justify-between w-full px-4 py-2 text-left"
                  style={{ color: 'var(--text-primary)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-hover)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                  onClick={() => handleCategoryClick(category)}
                >
                  <span className="font-medium">{category}</span>
                  <svg
                    className={`w-4 h-4 transition-transform duration-200 ${
                      expandedCategory === category ? 'transform rotate-180' : ''
                    }`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                
                {expandedCategory === category && (
                  <div className="pl-4 pr-2 py-1">
                    {functions.map((func) => (
                      <button
                        key={func.name}
                        className={`w-full text-left p-2 rounded my-1 flex flex-col`}
                        style={{ 
                          backgroundColor: selectedFunction?.name === func.name ? 'var(--color-hover)' : 'transparent'
                        }}
                        onMouseEnter={(e) => {
                          if (selectedFunction?.name !== func.name) {
                            e.currentTarget.style.backgroundColor = 'var(--color-hover)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (selectedFunction?.name !== func.name) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }
                        }}
                        onClick={() => handleSelectFunction(func)}
                      >
                        <span className="font-mono text-blue-500">{func.name}</span>
                        <span className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{func.description}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        
        <div className="p-4 border-t flex justify-between items-center" style={{ borderColor: 'var(--border-color)' }}>
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {selectedFunction && (
              <span>Selected: <span className="font-mono text-blue-500">{selectedFunction.name}</span></span>
            )}
          </div>
          <div>
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded-md mr-2"
              style={{ 
                borderColor: 'var(--border-color)', 
                backgroundColor: 'var(--color-card)', 
                color: 'var(--text-primary)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-card)';
              }}
            >
              Cancel
            </button>
            <button
              onClick={viewId && groupId && columnId ? handleApplyToAllItems : onClose}
              className={`px-4 py-2 text-white rounded-md set-formula-button ${
                selectedFunction ? 'bg-blue-500 hover:bg-blue-600' : 'opacity-50 cursor-not-allowed'
              }`}
              disabled={!selectedFunction}
            >
              Set formula
            </button>
          </div>
        </div>
      </div>
    </div>
      <HelpModal />
    </>
  );
};

export default FormulaBuilder; 