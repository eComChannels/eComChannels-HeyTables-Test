import React from 'react';

const Input = ({
  label,
  error,
  className = '',
  ...props
}) => {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        className={`
          appearance-none
          block
          w-full
          px-3
          py-2
          border
          border-gray-300
          rounded-md
          shadow-sm
          placeholder-gray-400
          focus:outline-none
          focus:ring-blue-500
          focus:border-blue-500
          sm:text-sm
          ${error ? 'border-red-500' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}
    </div>
  );
};

export default Input;
