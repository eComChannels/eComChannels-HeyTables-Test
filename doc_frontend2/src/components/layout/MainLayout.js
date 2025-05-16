import React, { useState } from 'react';
import Header from './Header';
import LeftMenu from './LeftMenu';

const MainLayout = ({ children }) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="flex min-h-screen bg-[#13141C]">
      <LeftMenu isOpen={isOpen} onToggle={() => setIsOpen(!isOpen)} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isOpen ? 'ml-72' : 'ml-20'}`}>
        <Header />
        <div className="flex-1 p-8 bg-[#13141C] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,87,255,0.1),rgba(255,255,255,0))]">
          {children}
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
