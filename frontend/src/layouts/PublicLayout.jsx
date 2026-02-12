import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/navigation';
import { Footer } from '../components/footer';

const PublicLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white font-sans text-gray-900">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default PublicLayout;
