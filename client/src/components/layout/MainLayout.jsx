import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../navbar/Navbar';
import Sidebar from '../sidebar/Sidebar';

function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Navbar onMenuClick={() => setSidebarOpen(prev => !prev)} />

      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 overflow-hidden lg:ml-72 w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default MainLayout;