import { Routes, Route } from 'react-router-dom';

// Layouts
import AuthLayout from '../layouts/AuthLayout';
import AdminLayout from '../layouts/AdminLayout';
import DosenLayout from '../layouts/DosenLayout';
import MahasiswaLayout from '../layouts/MahasiswaLayout';
import HomeLayout from '../layouts/HomeLayout';

// Guards
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';
import AdminGuard from '../guard/AdminGuard';
import DosenGuard from '../guard/DosenGuard';
import MahasiswaGuard from '../guard/MahasiswaGuard';

// Pages
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import Home from '../pages/Home';

// Route
import { AdminRoute } from './AdminRoute';
import { DosenRoute } from './DosenRoute';
import { MahasiswaRoute } from './MahasiswaRoute';

function AppRoutes() {
  return (
    <Routes>

      {/* Home */}
      <Route element={<HomeLayout />}>
        <Route path='/' element={<Home />} />
      </Route>

      {/* Auth */}
      <Route element={<AuthLayout />}>
        <Route path='/login' element={<Login />} />
        <Route path='/register' element={<Register />} />
      </Route>

      {/* Admin Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AdminGuard />}>
          <Route element={<AdminLayout />}>
            {AdminRoute}
          </Route>
        </Route>
      </Route>

      {/* Dosen Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DosenGuard />}>
          <Route element={<DosenLayout />}>
            {DosenRoute}
          </Route>
        </Route>
      </Route>

      {/* Mahasiswa Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MahasiswaGuard />}>
          {MahasiswaRoute}
        </Route>
      </Route>
    </Routes>
  );
}

export default AppRoutes;

