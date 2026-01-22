import { lazy, Suspense } from 'react';
import { Route } from 'react-router-dom';
import { PageLoader } from '../components/shared';

// Lazy load semua pages untuk code splitting
const AdminDashboard = lazy(() => import('../pages/admin/Dashboard'));
const AdminUsers = lazy(() => import('../pages/admin/Users'));
const AdminCreateUser = lazy(() => import('../pages/admin/CreateUser'));
const AdminCourses = lazy(() => import('../pages/admin/Courses'));

// Wrapper untuk lazy component dengan Suspense
const LazyPage = ({ component: Component }) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);

/**
 * Route untuk role Admin
 * 
 * Struktur:
 * - /admin/dashboard - Dashboard admin
 * - /admin/users - Kelola users
 * - /admin/users/new - Tambah user baru
 * - /admin/courses - Kelola kelas (baru)
 */
export const AdminRoute = (
  <>
    <Route path="/admin/dashboard" element={<LazyPage component={AdminDashboard} />} />
    <Route path="/admin/users" element={<LazyPage component={AdminUsers} />} />
    <Route path="/admin/users/new" element={<LazyPage component={AdminCreateUser} />} />
    <Route path="/admin/courses" element={<LazyPage component={AdminCourses} />} />
  </>
);


