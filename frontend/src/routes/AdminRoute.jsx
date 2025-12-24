import { Route } from 'react-router-dom';

import AdminDashboard from '../pages/admin/Dashboard';
import AdminUsers from '../pages/admin/Users';
import AdminCreateUser from '../pages/admin/CreateUser';

export const AdminRoute = (
  <>
    <Route path="/admin/dashboard" element={<AdminDashboard />} />
    <Route path="/admin/users" element={<AdminUsers />} />
    <Route path="/admin/users/new" element={<AdminCreateUser />} />
  </>
);


