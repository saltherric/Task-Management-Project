import { Outlet } from 'react-router-dom';
import Navbar from '../navbar/Navbar';
import Sidebar from '../Sidebar';

function MainLayout() {
  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="flex min-h-[calc(100vh-4rem)]">
        <Sidebar />

        <main className="flex-1 p-6 lg:pl-72">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default MainLayout;