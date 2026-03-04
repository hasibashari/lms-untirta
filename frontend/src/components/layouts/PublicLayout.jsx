import { Outlet } from 'react-router-dom';
import Navbar from '../navigation/Navbar';
import Footer from '../shared/footer/Footer';

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
