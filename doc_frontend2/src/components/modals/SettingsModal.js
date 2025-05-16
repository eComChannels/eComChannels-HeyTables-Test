import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { FaTimes } from 'react-icons/fa';

const SettingsModal = ({ isOpen, onClose, buttonRef }) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [theme, setTheme] = useState('light');

  const handlePasswordChange = (e) => {
    e.preventDefault();
    // Add password change logic here
    console.log('Password change requested');
  };

  const handleThemeChange = (e) => {
    setTheme(e.target.value);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-skin-primary rounded-lg w-[600px] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-[var(--border-color)]">
          <h2 className="text-xl text-skin-primary font-medium">Settings</h2>
          <button onClick={onClose} className="text-skin-secondary hover:text-skin-primary">
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-6">
            {/* Theme Section */}
            <div>
              <h3 className="text-lg text-skin-primary font-medium mb-4">Theme</h3>
              <div className="space-y-2">
                <label className="flex items-center p-3 rounded-md hover:bg-skin-hover cursor-pointer border border-[var(--border-color)]">
                  <input
                    type="radio"
                    name="theme"
                    value="light"
                    checked={theme === 'light'}
                    onChange={handleThemeChange}
                    className="mr-3"
                  />
                  <span className="text-skin-primary">Light</span>
                </label>
                <label className="flex items-center p-3 rounded-md hover:bg-skin-hover cursor-pointer border border-[var(--border-color)]">
                  <input
                    type="radio"
                    name="theme"
                    value="dark"
                    checked={theme === 'dark'}
                    onChange={handleThemeChange}
                    className="mr-3"
                  />
                  <span className="text-skin-primary">Dark</span>
                </label>
              </div>
            </div>

            {/* Other settings sections */}
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-[#131A35] border border-[#1d2951] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#39D0D8]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-[#131A35] border border-[#1d2951] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#39D0D8]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-[#131A35] border border-[#1d2951] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#39D0D8]"
                />
              </div>
              <button
                type="submit"
                className="w-full px-4 py-2 bg-[#39D0D8] hover:bg-[#39D0D8]/90 text-black font-medium rounded-lg transition-colors duration-200"
              >
                Change Password
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[var(--border-color)] flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 text-white bg-[#0073ea] rounded-md hover:bg-[#0060b9] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal; 