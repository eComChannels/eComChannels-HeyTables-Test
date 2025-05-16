/**
 * Formula evaluator utility
 * Handles the evaluation of custom formulas for cells
 * Follows Microsoft Excel calculation logic
 */

/**
 * Evaluates a formula and returns the result following Excel calculation logic
 * @param {string} formula - The formula to evaluate (e.g. "TODAY()", "DAYS(date1, date2)")
 * @param {Object} cellData - Optional map of column names to cell values for cell references
 * @returns {string} - The evaluated result as a string
 */
function evaluateFormula(formula, cellData = {}) {
  try {
    console.log(`Evaluating formula: ${formula}`);
    
    // If formula is not a string, return empty string
    if (typeof formula !== 'string') {
      console.log('Formula is not a string:', formula);
      return '';
    }
    
    // Process cell references like {ColumnName}
    // First, check if we have arithmetic operations with cell references
    const cellRefRegex = /\{([^}]+)\}/g;
    let hasArithmeticOps = /[\+\-\*\/]/.test(formula);
    
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
          
          // If cellValue is not provided or invalid, return error
          if (cellValue === undefined || cellValue === null) {
            return `#ERROR: Missing value for column "${columnName}"`;
          }
          
          // Convert to number if possible
          const numericValue = parseFloat(cellValue);
          if (isNaN(numericValue)) {
            return `#ERROR: Non-numeric value in column "${columnName}"`;
          }
          
          // Replace the cell reference with the numeric value
          processedFormula = processedFormula.replace(match[0], numericValue);
        }
        
        // Evaluate the arithmetic expression
        try {
          // Use Function constructor to safely evaluate the arithmetic expression
          // This is a controlled environment with only numeric values and operators
          const result = Function(`"use strict"; return (${processedFormula})`)();
          
          // Format the result to avoid excessive decimals
          return typeof result === 'number' ? result.toString() : result;
        } catch (evalError) {
          return `#ERROR: Invalid arithmetic expression: ${evalError.message}`;
        }
      } catch (cellRefError) {
        return `#ERROR: ${cellRefError.message}`;
      }
    }
    
    // TODAY() - Returns the current date (Excel: Returns the serial number of the current date)
    if (formula === 'TODAY()') {
      const today = new Date();
      return today.toLocaleDateString('en-US'); // MM/DD/YYYY format like Excel
    }
    
    // DATE(year, month, day) - Returns a date value (Excel: Returns the serial number of a particular date)
    if (formula.startsWith('DATE(') && formula.endsWith(')')) {
      try {
        const paramsStr = formula.substring(5, formula.length - 1);
        
        if (!paramsStr.trim()) {
          return "#ERROR: DATE() requires parameters (year, month, day)";
        }
        
        const params = paramsStr.split(',').map(p => parseInt(p.trim(), 10));
        
        if (params.length !== 3 || params.some(isNaN)) {
          return "#ERROR: Invalid parameters for DATE(year, month, day)";
        }
        
        const [year, month, day] = params;
        
        // Excel allows month values outside 1-12 range and adjusts the year accordingly
        let adjustedYear = year;
        let adjustedMonth = month - 1; // JS months are 0-based
        
        // Handle month overflow/underflow like Excel does
        if (month > 12) {
          adjustedYear += Math.floor((month - 1) / 12);
          adjustedMonth = (month - 1) % 12;
        } else if (month < 1) {
          const yearsToSubtract = Math.floor((Math.abs(month) + 12) / 12);
          adjustedYear -= yearsToSubtract;
          adjustedMonth = 12 - (Math.abs(month) % 12);
          if (adjustedMonth === 12) adjustedMonth = 0;
        }
        
        // Excel also handles day values outside the month's range
        const date = new Date(adjustedYear, adjustedMonth, day);
        
        if (isNaN(date.getTime())) {
          return "#ERROR: Invalid date";
        }
        
        return date.toLocaleDateString('en-US');
      } catch (error) {
        console.error('Error in DATE function:', error);
        return "#ERROR: " + error.message;
      }
    }
    
    // DAYS(end_date, start_date) - Calculate days between dates (Excel: Returns the number of days between two dates)
    if (formula.startsWith('DAYS(') && formula.endsWith(')')) {
      try {
        const paramsStr = formula.substring(5, formula.length - 1);
        
        if (!paramsStr.trim()) {
          console.log('DAYS function has empty parameters');
          return "#ERROR: DAYS() requires parameters (end_date, start_date)";
        }
        
        const params = paramsStr.split(',').map(p => p.trim());
        console.log('DAYS params:', params);
        
        if (params.length !== 2) {
          console.log('DAYS function has incorrect number of parameters:', params.length);
          return "#ERROR: DAYS() requires two parameters: end_date, start_date";
        }
        
        // Check if either parameter is empty
        if (!params[0] || !params[1]) {
          console.log('DAYS function has empty parameter values');
          return "#ERROR: DAYS() requires non-empty date values";
        }
        
        // Check if parameters are numbers (like Excel direct number inputs)
        const num1 = parseFloat(params[0]);
        const num2 = parseFloat(params[1]);
        
        if (!isNaN(num1) && !isNaN(num2)) {
          // If both params are numbers, just return their difference like Excel does
          return (num1 - num2).toString();
        }
        
        // Parse dates - try multiple formats
        let endDate, startDate;
        
        // Try to parse dates in multiple formats (MM/DD/YYYY, YYYY-MM-DD, etc.)
        try {
          // First try direct Date parsing
          endDate = new Date(params[0]);
          startDate = new Date(params[1]);
          
          // Check if dates are valid
          if (isNaN(endDate.getTime()) || isNaN(startDate.getTime())) {
            // If one of the dates is not valid, try different formats
            
            // Try MM/DD/YYYY format
            const dateParts1 = params[0].split('/');
            const dateParts2 = params[1].split('/');
            
            if (dateParts1.length === 3 && dateParts2.length === 3) {
              endDate = new Date(parseInt(dateParts1[2]), parseInt(dateParts1[0])-1, parseInt(dateParts1[1]));
              startDate = new Date(parseInt(dateParts2[2]), parseInt(dateParts2[0])-1, parseInt(dateParts2[1]));
            }
            
            // If still not valid, try YYYY-MM-DD format
            if (isNaN(endDate.getTime()) || isNaN(startDate.getTime())) {
              const dateParts1 = params[0].split('-');
              const dateParts2 = params[1].split('-');
              
              if (dateParts1.length === 3 && dateParts2.length === 3) {
                endDate = new Date(parseInt(dateParts1[0]), parseInt(dateParts1[1])-1, parseInt(dateParts1[2]));
                startDate = new Date(parseInt(dateParts2[0]), parseInt(dateParts2[1])-1, parseInt(dateParts2[2]));
              }
            }
          }
        } catch (err) {
          console.error('Error parsing dates:', err);
          return "#ERROR: Invalid date format";
        }
        
        // Check if dates are valid after all parsing attempts
        if (isNaN(endDate.getTime()) || isNaN(startDate.getTime())) {
          console.log('Invalid dates after parsing:', { endDate, startDate });
          return "#ERROR: Invalid date format";
        }
        
        // Calculate days difference - like Excel's DAYS function
        // Excel DAYS returns the number of days between start_date and end_date
        const differenceInTime = endDate.getTime() - startDate.getTime();
        const differenceInDays = Math.floor(differenceInTime / (1000 * 3600 * 24));
        
        return differenceInDays.toString();
      } catch (error) {
        console.error('Error in DAYS function:', error);
        return "#ERROR: " + error.message;
      }
    }
    
    // Special case for empty DAYS()
    if (formula === 'DAYS()') {
      return "#ERROR: DAYS() requires parameters (end_date, start_date)";
    }
    
    // YEAR(date) - Extract year from a date (Excel: Returns the year component of a date)
    if (formula.startsWith('YEAR(') && formula.endsWith(')')) {
      try {
        const paramsStr = formula.substring(5, formula.length - 1);
        
        if (!paramsStr.trim()) {
          return "#ERROR: YEAR() requires a date parameter";
        }
        
        // Try to parse the date
        let dateValue;
        
        // Check if parameter is a number
        const num = parseFloat(paramsStr);
        if (!isNaN(num)) {
          // Excel treats numbers as serial dates
          // For simplicity in demo, we'll return the current year
          const currentYear = new Date().getFullYear();
          return currentYear.toString();
        }
        
        // Try to parse as a date string
        dateValue = new Date(paramsStr);
        
        if (isNaN(dateValue.getTime())) {
          // Try MM/DD/YYYY format
          const dateParts = paramsStr.split('/');
          if (dateParts.length === 3) {
            dateValue = new Date(parseInt(dateParts[2]), parseInt(dateParts[0])-1, parseInt(dateParts[1]));
          }
          
          // If still not valid, try YYYY-MM-DD format
          if (isNaN(dateValue.getTime())) {
            const dateParts = paramsStr.split('-');
            if (dateParts.length === 3) {
              dateValue = new Date(parseInt(dateParts[0]), parseInt(dateParts[1])-1, parseInt(dateParts[2]));
            }
          }
        }
        
        if (isNaN(dateValue.getTime())) {
          return "#ERROR: Invalid date in YEAR()";
        }
        
        return dateValue.getFullYear().toString();
      } catch (error) {
        return "#ERROR: " + error.message;
      }
    }
    
    // WORKDAYS(start_date, days, [holidays]) - Calculate workdays (Excel: WORKDAY function)
    if (formula.startsWith('WORKDAYS(') && formula.endsWith(')')) {
      try {
        const paramsStr = formula.substring(9, formula.length - 1);
        
        if (!paramsStr.trim()) {
          return "#ERROR: WORKDAYS() requires parameters (start_date, days)";
        }
        
        const params = paramsStr.split(',').map(p => p.trim());
        
        if (params.length < 2) {
          return "#ERROR: WORKDAYS() requires at least start_date and days parameters";
        }
        
        // Try to parse the start date
        let startDate;
        try {
          startDate = new Date(params[0]);
          if (isNaN(startDate.getTime())) {
            // Try MM/DD/YYYY format
            const dateParts = params[0].split('/');
            if (dateParts.length === 3) {
              startDate = new Date(parseInt(dateParts[2]), parseInt(dateParts[0])-1, parseInt(dateParts[1]));
            }
            
            // If still not valid, try YYYY-MM-DD format
            if (isNaN(startDate.getTime())) {
              const dateParts = params[0].split('-');
              if (dateParts.length === 3) {
                startDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1])-1, parseInt(dateParts[2]));
              }
            }
          }
        } catch (err) {
          return "#ERROR: Invalid start date in WORKDAYS()";
        }
        
        if (isNaN(startDate.getTime())) {
          return "#ERROR: Invalid start date in WORKDAYS()";
        }
        
        // Parse the number of days
        const days = parseInt(params[1], 10);
        if (isNaN(days)) {
          return "#ERROR: Invalid days parameter in WORKDAYS()";
        }
        
        // For demo purposes, we'll approximate the calculation
        // Excel's WORKDAY adds the specified number of working days to start_date
        const workingDays = Math.abs(days); // Ignore negative for simplicity in demo
        const weekdays = workingDays + Math.floor(workingDays / 5) * 2; // Add weekends
        const resultDate = new Date(startDate);
        resultDate.setDate(startDate.getDate() + (days >= 0 ? weekdays : -weekdays));
        
        return resultDate.toLocaleDateString('en-US');
      } catch (error) {
        return "#ERROR: " + error.message;
      }
    }
    
    // FORMAT_DATE(date, format) - Format a date (Similar to Excel's TEXT function with dates)
    if (formula.startsWith('FORMAT_DATE(') && formula.endsWith(')')) {
      try {
        const paramsStr = formula.substring(12, formula.length - 1);
        
        // Split parameters handling quoted strings
        const params = [];
        let currentParam = '';
        let inQuotes = false;
        
        for (let i = 0; i < paramsStr.length; i++) {
          const char = paramsStr[i];
          
          if (char === '"' && (i === 0 || paramsStr[i - 1] !== '\\')) {
            inQuotes = !inQuotes;
            continue;
          }
          
          if (char === ',' && !inQuotes) {
            params.push(currentParam.trim());
            currentParam = '';
            continue;
          }
          
          currentParam += char;
        }
        params.push(currentParam.trim());
        
        // Remove quotes from parameters
        const cleanParams = params.map(p => p.replace(/^"(.*)"$/, '$1'));
        
        let dateValue;
        
        if (cleanParams.length === 0) {
          // If no parameters, use current date
          dateValue = new Date();
        } else {
          const dateStr = cleanParams[0];
          
          // Try to parse the date string
          if (dateStr.includes(',')) {
            // Handle comma-separated format (YYYY,M,D)
            const [year, month, day] = dateStr.split(',').map(p => parseInt(p.trim()));
            dateValue = new Date(year, month - 1, day);
          } else if (dateStr.includes('/')) {
            // Handle MM/DD/YYYY format
            const [month, day, year] = dateStr.split('/').map(p => parseInt(p.trim()));
            dateValue = new Date(year, month - 1, day);
          } else if (dateStr.includes('-')) {
            // Handle YYYY-MM-DD format
            const [year, month, day] = dateStr.split('-').map(p => parseInt(p.trim()));
            dateValue = new Date(year, month - 1, day);
          } else {
            // Try direct date parsing
            dateValue = new Date(dateStr);
          }
          
          if (isNaN(dateValue.getTime())) {
            return "#ERROR: Invalid date in FORMAT_DATE()";
          }
        }
        
        // Get format string
        const format = cleanParams.length > 1 ? cleanParams[1] : "long";
        
        // Handle custom format strings
        if (format.includes('YYYY') || format.includes('MM') || format.includes('DD')) {
          let result = format;
          
          // Replace format tokens with actual values
          result = result.replace(/YYYY/g, dateValue.getFullYear());
          // Add padding for MM and DD
          result = result.replace(/MM/g, String(dateValue.getMonth() + 1).padStart(2, '0'));
          result = result.replace(/DD/g, String(dateValue.getDate()).padStart(2, '0'));
          
          return result;
        }
        
        // Handle predefined formats
        switch (format.toLowerCase()) {
          case 'short':
            return dateValue.toLocaleDateString('en-US', { 
              month: 'numeric', 
              day: 'numeric', 
              year: 'numeric' 
            });
          case 'medium':
            return dateValue.toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric' 
            });
          case 'long':
          default:
            return dateValue.toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            });
        }
      } catch (error) {
        return "#ERROR: " + error.message;
      }
    }
    
    // Math functions
    
    // SUM(number1, [number2], ...) - Sum of numbers (Excel: Returns the sum of its arguments)
    if (formula.startsWith('SUM(') && formula.endsWith(')')) {
      try {
        const paramsStr = formula.substring(4, formula.length - 1);
        
        if (!paramsStr.trim()) {
          return "0"; // Excel returns 0 for SUM() with no arguments
        }
        
        const params = paramsStr.split(',').map(p => {
          const num = parseFloat(p.trim());
          return isNaN(num) ? 0 : num; // Excel treats non-numbers as 0
        });
        
        const sum = params.reduce((total, num) => total + num, 0);
        return sum.toString();
      } catch (error) {
        return "#ERROR: " + error.message;
      }
    }
    
    // AVERAGE(number1, [number2], ...) - Average of numbers (Excel: Returns the average of its arguments)
    if (formula.startsWith('AVERAGE(') && formula.endsWith(')')) {
      try {
        const paramsStr = formula.substring(8, formula.length - 1);
        
        if (!paramsStr.trim()) {
          return "#ERROR: AVERAGE() requires at least one number"; // Excel returns #DIV/0! for empty AVERAGE()
        }
        
        // Get valid numbers (Excel ignores text values in AVERAGE)
        const params = paramsStr.split(',')
          .map(p => parseFloat(p.trim()))
          .filter(n => !isNaN(n));
        
        if (params.length === 0) {
          return "#ERROR: No valid numbers to average"; // Excel returns #DIV/0! if no valid numbers
        }
        
        const sum = params.reduce((total, num) => total + num, 0);
        const avg = sum / params.length;
        
        // Format number like Excel (show decimal places only if needed)
        return avg % 1 === 0 ? avg.toFixed(0) : avg.toString();
      } catch (error) {
        return "#ERROR: " + error.message;
      }
    }
    
    // COUNT(value1, [value2], ...) - Count of values (Excel: Counts the number of cells that contain numbers)
    if (formula.startsWith('COUNT(') && formula.endsWith(')')) {
      try {
        const paramsStr = formula.substring(6, formula.length - 1);
        
        if (!paramsStr.trim()) {
          return "0"; // Excel returns 0 for COUNT() with no arguments
        }
        
        // Count only numeric values like Excel does
        const params = paramsStr.split(',');
        const numericCount = params.filter(p => {
          const trimmed = p.trim();
          return trimmed !== '' && !isNaN(parseFloat(trimmed));
        }).length;
        
        return numericCount.toString();
      } catch (error) {
        return "#ERROR: " + error.message;
      }
    }
    
    // MAX(number1, [number2], ...) - Maximum value (Excel: Returns the largest value in a set of values)
    if (formula.startsWith('MAX(') && formula.endsWith(')')) {
      try {
        const paramsStr = formula.substring(4, formula.length - 1);
        
        if (!paramsStr.trim()) {
          return "0"; // Excel returns 0 for MAX() with no arguments
        }
        
        // Get valid numbers (Excel ignores text values in MAX)
        const params = paramsStr.split(',')
          .map(p => parseFloat(p.trim()))
          .filter(n => !isNaN(n));
        
        if (params.length === 0) {
          return "0"; // Excel returns 0 if no valid numbers
        }
        
        const max = Math.max(...params);
        return max.toString();
      } catch (error) {
        return "#ERROR: " + error.message;
      }
    }
    
    // MIN(number1, [number2], ...) - Minimum value (Excel: Returns the smallest value in a set of values)
    if (formula.startsWith('MIN(') && formula.endsWith(')')) {
      try {
        const paramsStr = formula.substring(4, formula.length - 1);
        
        if (!paramsStr.trim()) {
          return "0"; // Excel returns 0 for MIN() with no arguments
        }
        
        // Get valid numbers (Excel ignores text values in MIN)
        const params = paramsStr.split(',')
          .map(p => parseFloat(p.trim()))
          .filter(n => !isNaN(n));
        
        if (params.length === 0) {
          return "0"; // Excel returns 0 if no valid numbers
        }
        
        const min = Math.min(...params);
        return min.toString();
      } catch (error) {
        return "#ERROR: " + error.message;
      }
    }
    
    // Text functions
    
    // CONCATENATE(text1, [text2], ...) - Join text items (Excel: Joins several text items into one text item)
    if (formula.startsWith('CONCATENATE(') && formula.endsWith(')')) {
      try {
        const paramsStr = formula.substring(12, formula.length - 1);
        
        if (!paramsStr.trim()) {
          return ""; // Excel returns empty string for CONCATENATE() with no arguments
        }
        
        // Excel converts numbers to strings in CONCATENATE
        const params = paramsStr.split(',').map(p => p.trim());
        return params.join('');
      } catch (error) {
        return "#ERROR: " + error.message;
      }
    }
    
    // FIND(find_text, within_text, [start_num]) - Find text within text (Excel: FIND function)
    if (formula.startsWith('FIND(') && formula.endsWith(')')) {
      try {
        const paramsStr = formula.substring(5, formula.length - 1);
        const params = paramsStr.split(',').map(p => p.trim());
        
        if (params.length < 2) {
          return "#ERROR: FIND() requires at least find_text and within_text"; // Excel returns #VALUE!
        }
        
        const findText = params[0];
        const withinText = params[1];
        
        // Excel's FIND is case-sensitive
        // Optional third parameter specifies start position (defaults to 1 in Excel)
        const startPos = params.length > 2 ? Math.max(0, parseInt(params[2], 10) - 1) : 0;
        
        if (params.length > 2 && isNaN(startPos)) {
          return "#ERROR: Invalid start position in FIND()"; // Excel returns #VALUE!
        }
        
        const position = withinText.indexOf(findText, startPos);
        
        if (position === -1) { // Not found
          return "#ERROR: Text not found"; // Excel returns #VALUE!
        }
        
        // Excel uses 1-based indexing
        return (position + 1).toString();
      } catch (error) {
        return "#ERROR: " + error.message;
      }
    }
    
    // LEFT(text, [num_chars]) - Get leftmost characters (Excel: LEFT function)
    if (formula.startsWith('LEFT(') && formula.endsWith(')')) {
      try {
        const paramsStr = formula.substring(5, formula.length - 1);
        const params = paramsStr.split(',').map(p => p.trim());
        
        if (params.length === 0) {
          return "#ERROR: LEFT() requires text parameter"; // Excel returns #VALUE!
        }
        
        const text = params[0];
        // In Excel, num_chars defaults to 1 if omitted
        const numChars = params.length > 1 ? parseInt(params[1], 10) : 1;
        
        if (isNaN(numChars)) {
          return "#ERROR: num_chars must be a number"; // Excel returns #VALUE!
        }
        
        // Excel returns empty string if numChars is negative
        if (numChars < 0) return "";
        
        return text.substring(0, numChars);
      } catch (error) {
        return "#ERROR: " + error.message;
      }
    }
    
    // RIGHT(text, [num_chars]) - Get rightmost characters (Excel: RIGHT function)
    if (formula.startsWith('RIGHT(') && formula.endsWith(')')) {
      try {
        const paramsStr = formula.substring(6, formula.length - 1);
        const params = paramsStr.split(',').map(p => p.trim());
        
        if (params.length === 0) {
          return "#ERROR: RIGHT() requires text parameter"; // Excel returns #VALUE!
        }
        
        const text = params[0];
        // In Excel, num_chars defaults to 1 if omitted
        const numChars = params.length > 1 ? parseInt(params[1], 10) : 1;
        
        if (isNaN(numChars)) {
          return "#ERROR: num_chars must be a number"; // Excel returns #VALUE!
        }
        
        // Excel returns empty string if numChars is negative
        if (numChars < 0) return "";
        
        return text.substring(Math.max(0, text.length - numChars));
      } catch (error) {
        return "#ERROR: " + error.message;
      }
    }
    
    // Logical functions
    
    // IF(logical_test, value_if_true, value_if_false) - Conditional logic (Excel: IF function)
    if (formula.startsWith('IF(') && formula.endsWith(')')) {
      try {
        const paramsStr = formula.substring(3, formula.length - 1);
        const params = paramsStr.split(',').map(p => p.trim());
        
        if (params.length !== 3) {
          return "#ERROR: IF() requires logical_test, value_if_true, value_if_false"; // Excel returns #VALUE!
        }
        
        // Simplified logical test evaluation - only handles basic cases
        // In Excel, logical_test is TRUE if non-zero and non-empty
        const condition = params[0].toUpperCase();
        
        // Check for TRUE/FALSE literals
        if (condition === 'TRUE') {
          return params[1]; // Return value_if_true
        } else if (condition === 'FALSE') {
          return params[2]; // Return value_if_false
        }
        
        // Check for numeric or empty values
        const numValue = parseFloat(condition);
        if (!isNaN(numValue)) {
          return numValue !== 0 ? params[1] : params[2];
        }
        
        // For demo, treat non-empty strings as TRUE (Excel is more complex)
        return condition !== '' ? params[1] : params[2];
      } catch (error) {
        return "#ERROR: " + error.message;
      }
    }
    
    // AND(logical1, [logical2], ...) - Check if all conditions are TRUE (Excel: AND function)
    if (formula.startsWith('AND(') && formula.endsWith(')')) {
      try {
        const paramsStr = formula.substring(4, formula.length - 1);
        
        if (!paramsStr.trim()) {
          return "#ERROR: AND() requires at least one condition"; // Excel returns #VALUE!
        }
        
        const params = paramsStr.split(',').map(p => p.trim());
        
        // Excel's AND evaluates each argument as TRUE/FALSE
        const result = params.every(param => {
          // Handle TRUE/FALSE literals
          if (param.toUpperCase() === 'TRUE') return true;
          if (param.toUpperCase() === 'FALSE') return false;
          
          // Handle numeric values (0 is FALSE, any other number is TRUE)
          const numValue = parseFloat(param);
          if (!isNaN(numValue)) return numValue !== 0;
          
          // Non-empty strings are TRUE in Excel
          return param !== '';
        });
        
        return result ? "TRUE" : "FALSE";
      } catch (error) {
        return "#ERROR: " + error.message;
      }
    }
    
    // OR(logical1, [logical2], ...) - Check if any condition is TRUE (Excel: OR function)
    if (formula.startsWith('OR(') && formula.endsWith(')')) {
      try {
        const paramsStr = formula.substring(3, formula.length - 1);
        
        if (!paramsStr.trim()) {
          return "#ERROR: OR() requires at least one condition"; // Excel returns #VALUE!
        }
        
        const params = paramsStr.split(',').map(p => p.trim());
        
        // Excel's OR evaluates each argument as TRUE/FALSE
        const result = params.some(param => {
          // Handle TRUE/FALSE literals
          if (param.toUpperCase() === 'TRUE') return true;
          if (param.toUpperCase() === 'FALSE') return false;
          
          // Handle numeric values (0 is FALSE, any other number is TRUE)
          const numValue = parseFloat(param);
          if (!isNaN(numValue)) return numValue !== 0;
          
          // Non-empty strings are TRUE in Excel
          return param !== '';
        });
        
        return result ? "TRUE" : "FALSE";
      } catch (error) {
        return "#ERROR: " + error.message;
      }
    }
    
    // NOT(logical) - Reverse logical value (Excel: NOT function)
    if (formula.startsWith('NOT(') && formula.endsWith(')')) {
      try {
        const paramsStr = formula.substring(4, formula.length - 1);
        
        if (!paramsStr.trim()) {
          return "#ERROR: NOT() requires a logical parameter"; // Excel returns #VALUE!
        }
        
        const param = paramsStr.trim();
        
        // Handle TRUE/FALSE literals like Excel
        if (param.toUpperCase() === 'TRUE') {
          return "FALSE";
        } else if (param.toUpperCase() === 'FALSE') {
          return "TRUE";
        }
        
        // Handle numeric values like Excel (0 is FALSE, any other number is TRUE)
        const numValue = parseFloat(param);
        if (!isNaN(numValue)) {
          return numValue === 0 ? "TRUE" : "FALSE";
        }
        
        // In Excel, non-empty strings are TRUE, empty strings are FALSE
        return param === '' ? "TRUE" : "FALSE";
      } catch (error) {
        return "#ERROR: " + error.message;
      }
    }
    
    // Fallback for other cases
    return formula;
  } catch (error) {
    console.error(`Error evaluating formula "${formula}":`, error);
    return formula || ''; // Return original formula on error, or empty string if formula is falsy
  }
}

/**
 * Processes all cells in a view to ensure formulas are evaluated consistently
 * @param {Object} view - The view object with table and groups
 * @returns {Object} - The updated view with evaluated formulas
 */
function processViewFormulas(view) {
  if (!view || !view.table || !view.table.groups) {
    return view;
  }

  try {
    console.log('Processing formulas in view:', view._id);
    
    // Find all formula columns
    const formulaColumns = view.table.columns.filter(col => col.type === 'formula');
    if (formulaColumns.length === 0) {
      console.log('No formula columns found in view');
      return view;
    }
    
    console.log(`Found ${formulaColumns.length} formula columns`);
    
    // Process each group
    view.table.groups.forEach(group => {
      if (!group.rows) return;
      
      // Process each row
      group.rows.forEach(row => {
        if (!row.cells) return;
        
        // Create a map of column names to cell values for this row
        const cellDataMap = {};
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
        
        // Process formula cells
        formulaColumns.forEach(column => {
          const cell = row.cells.find(c => 
            c.columnId && c.columnId.toString() === column._id.toString()
          );
          
          if (cell && typeof cell.value === 'string') {
            // Re-evaluate the formula with cell data
            const evaluatedValue = evaluateFormula(cell.value, cellDataMap);
            if (evaluatedValue !== cell.value) {
              console.log(`Updated formula cell: ${cell.value} -> ${evaluatedValue}`);
              cell.displayValue = evaluatedValue; 
            }
          }
        });
      });
    });
    
    return view;
  } catch (error) {
    console.error('Error processing view formulas:', error);
    return view;
  }
}

module.exports = {
  evaluateFormula,
  processViewFormulas
}; 