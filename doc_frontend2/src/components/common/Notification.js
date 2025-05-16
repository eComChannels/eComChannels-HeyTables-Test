import React from 'react';
import { FaCheckCircle, FaExclamationCircle, FaTimes } from 'react-icons/fa';

const Notification = ({ type = 'error', message, onClose }) => {
  const bgColor = type === 'success' ? 'bg-[#00CA72]' : 'bg-[#FF4C4C]';
  const Icon = type === 'success' ? FaCheckCircle : FaExclamationCircle;

  return (
    <div className={`fixed top-4 right-4 ${bgColor} text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-3 z-50`}>
      <Icon className="text-xl" />
      <span className="text-sm font-medium">{message}</span>
      <button 
        onClick={onClose}
        className="text-white hover:text-gray-200 transition-colors"
      >
        <FaTimes />
      </button>
    </div>
  );
};

export default Notification; 