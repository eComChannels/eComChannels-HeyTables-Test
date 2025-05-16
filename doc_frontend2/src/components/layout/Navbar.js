import React, { useState, useRef, useEffect } from 'react';
import { 
  FaSearch, 
  FaBell, 
  FaQuestionCircle, 
  FaRegEnvelope,
  FaSignOutAlt,
  FaMoon,
  FaSun
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';

function Navbar() {
  const { logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="h-[50px] bg-skin-primary border-b border-[var(--border-color)] flex items-center justify-between px-4">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3">
          <div className="flex items-center">
            <div className="w-7 h-7 rounded bg-gradient-to-r from-[#00ca72] to-[#00a65d] flex items-center justify-center text-white font-bold text-lg mr-2">
              W
            </div>
            <div className="text-skin-primary font-bold text-lg">WORK FLOW</div>
            <div className="text-skin-secondary text-lg">.dev</div>
          </div>
        </div>
      </div>
      <div className="flex items-center">
        <div className="flex items-center space-x-2">
          <button 
            onClick={toggleTheme} 
            className="text-skin-secondary hover:text-skin-primary p-2 rounded hover:bg-skin-hover transition-colors"
          >
            {isDark ? <FaSun className="text-lg" /> : <FaMoon className="text-lg" />}
          </button>
          <button className="text-skin-secondary hover:text-skin-primary p-2 rounded hover:bg-skin-hover transition-colors">
            <FaSearch className="text-lg" />
          </button>
          <button className="text-skin-secondary hover:text-skin-primary p-2 rounded hover:bg-skin-hover transition-colors">
            <FaQuestionCircle className="text-lg" />
          </button>
          <button className="text-skin-secondary hover:text-skin-primary p-2 rounded hover:bg-skin-hover transition-colors relative">
            <FaRegEnvelope className="text-lg" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-[var(--blue-primary)] rounded-full"></span>
          </button>
          <button className="text-skin-secondary hover:text-skin-primary p-2 rounded hover:bg-skin-hover transition-colors">
            <FaBell className="text-lg" />
          </button>
          <Menu as="div" className="relative">
            <Menu.Button className="w-8 h-8 rounded-full bg-[#FF3B57] flex items-center justify-center text-white text-sm font-medium cursor-pointer hover:opacity-90 transition-colors ml-2">
              D
            </Menu.Button>

            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 mt-2 w-48 bg-skin-primary rounded-lg shadow-lg py-1 border border-[var(--border-color)] focus:outline-none z-[9999]">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={logout}
                      className={`${
                        active ? 'bg-skin-hover' : ''
                      } w-full px-4 py-2 text-left text-skin-secondary flex items-center`}
                    >
                      <FaSignOutAlt className="mr-2" />
                      Logout
                    </button>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>
    </nav>
  );
}

export default Navbar; 