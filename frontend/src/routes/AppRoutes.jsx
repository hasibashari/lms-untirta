import { Routes, Route } from 'react-router-dom';

import AuthLayout from '../layouts/AuthLayout';
import AdminLayout from '../layouts/AdminLayout';
import DosenLayout from '../layouts/DosenLayout';
import MahasiswaLayout from '../layouts/MahasiswaLayout';

import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';

import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';

import AdminDashboard from '../pages/admin/Dashboard';
import DosenDashboard from '../pages/dosen/Dashboard';
import MahasiswaDashboard from '../pages/mahasiswa/Dashboard';
import CourseHome from '../pages/mahasiswa/CourseHome';
import CourseMaterials from '../pages/mahasiswa/CourseMaterials';
import MaterialDetail from '../pages/mahasiswa/MaterialDetail';

import Assignments from '../pages/mahasiswa/Assignments';
import AssignmentDetail from '../pages/mahasiswa/AssignmentDetail';

function AppRoutes() {
  return (
    <Routes>
      {/* Auth */}
      <Route element={<AuthLayout />}>
        <Route path='/login' element={<Login />} />
        <Route path='/register' element={<Register />} />
      </Route>

      {/* Admin */}
      <Route
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['ADMIN']}>
              <AdminLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route path='/admin/dashboard' element={<AdminDashboard />} />
      </Route>

      {/* Dosen */}
      <Route
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['DOSEN']}>
              <DosenLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route path='/dosen/dashboard' element={<DosenDashboard />} />
      </Route>

      {/* Mahasiswa */}
      <Route
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['MAHASISWA']}>
              <MahasiswaLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route path='/mahasiswa/dashboard' element={<MahasiswaDashboard />} />
        <Route path='/mahasiswa/courses/:courseId' element={<CourseHome />} />
        <Route path='/mahasiswa/courses/:courseId/materials' element={<CourseMaterials />} />
        <Route path='/mahasiswa/courses/:courseId/materials/:materialId' element={<MaterialDetail />} />
        <Route path='/mahasiswa/courses/:courseId/assignments' element={<Assignments />} />
        <Route path='/mahasiswa/courses/:courseId/assignments/:assignmentId' element={<AssignmentDetail />} />
      </Route>
    </Routes>
  );
}

export default AppRoutes;
