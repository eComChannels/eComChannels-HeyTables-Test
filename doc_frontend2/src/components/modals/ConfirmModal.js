import React from 'react';
import { createPortal } from 'react-dom';
import { FaTimes, FaExclamationTriangle, FaInfoCircle, FaExclamationCircle } from 'react-icons/fa';

function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger' // or 'warning', 'info'
}) {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          container: 'text-red-500 bg-red-500/10 border border-red-500/20',
          icon: <FaExclamationTriangle className="w-8 h-8" />,
          button: 'bg-red-500 hover:bg-red-600 active:bg-red-700 focus:ring-red-500'
        };
      case 'warning':
        return {
          container: 'text-yellow-500 bg-yellow-500/10 border border-yellow-500/20',
          icon: <FaExclamationCircle className="w-8 h-8" />,
          button: 'bg-yellow-500 hover:bg-yellow-600 active:bg-yellow-700 focus:ring-yellow-500'
        };
      case 'info':
        return {
          container: 'text-blue-500 bg-blue-500/10 border border-blue-500/20',
          icon: <FaInfoCircle className="w-8 h-8" />,
          button: 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700 focus:ring-blue-500'
        };
      default:
        return {
          container: 'text-red-500 bg-red-500/10 border border-red-500/20',
          icon: <FaExclamationTriangle className="w-8 h-8" />,
          button: 'bg-red-500 hover:bg-red-600 active:bg-red-700 focus:ring-red-500'
        };
    }
  };

  const styles = getTypeStyles();

  const modalContent = (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center animate-fadeIn">
      <div 
        className="bg-skin-primary rounded-xl w-[440px] max-w-[90vw] shadow-xl transform transition-all animate-modalSlideIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-[var(--border-color)]">
          <h2 className="text-xl text-skin-primary font-semibold tracking-tight">{title}</h2>
          <button 
            onClick={onClose}
            className="text-skin-secondary hover:text-skin-primary transition-colors p-1 hover:bg-skin-hover rounded-lg"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className={`flex items-start p-5 rounded-xl ${styles.container}`}>
            <div className="shrink-0 mr-4">
              {styles.icon}
            </div>
            <p className="text-skin-primary text-[15px] leading-relaxed">{message}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-5 border-t border-[var(--border-color)] bg-skin-main rounded-b-xl">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-skin-secondary hover:text-skin-primary hover:bg-skin-hover rounded-lg transition-all duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-[var(--border-color)] focus:ring-offset-1"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-5 py-2.5 text-white rounded-lg transition-all duration-200 font-medium
              focus:outline-none focus:ring-2 focus:ring-offset-1 ${styles.button}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

export default ConfirmModal; 