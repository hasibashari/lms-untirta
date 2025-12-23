import { Routes, Route } from 'react-router-dom';

import AuthLayout from '../layouts/AuthLayout';
import AdminLayout from '../layouts/AdminLayout';
import DosenLayout from '../layouts/DosenLayout';
import MahasiswaLayout from '../layouts/MahasiswaLayout';

import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';
import AdminRoute from './AdminRoute';
import DosenRoute from './DosenRoute';
import MahasiswaRoute from './MahasiswaRoute';

import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import AdminDashboard from '../pages/admin/Dashboard';

// Dosen Pages
import DosenDashboard from '../pages/dosen/Dashboard';
import CourseHome from '../pages/dosen/CourseHome';
import Materials from '../pages/dosen/Materials';
import CreateMaterial from '../pages/dosen/CreateMaterial';
import Students from '../pages/dosen/Students';
import Assignments from '../pages/dosen/Assignments';
import CreateAssignment from '../pages/dosen/CreateAssignment';
import Submissions from '../pages/dosen/Submissions';

// Mahasiswa Pages
import MahasiswaDashboard from '../pages/mahasiswa/Dashboard';
import MahasiswaCourseHome from '../pages/mahasiswa/CourseHome';
import CourseMaterials from '../pages/mahasiswa/CourseMaterials';
import MaterialDetail from '../pages/mahasiswa/MaterialDetail';
import MahasiswaAssignments from '../pages/mahasiswa/Assignments';
import AssignmentDetail from '../pages/mahasiswa/AssignmentDetail';

function AppRoutes() {
  return (
    <Routes>
      {/* Auth */}
      <Route element={<AuthLayout />}>
        <Route path='/login' element={<Login />} />
        <Route path='/register' element={<Register />} />
      </Route>

      {/* Admin Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<RoleRoute allowedRoles={['ADMIN']} />}>
          <Route element={<AdminLayout />}>
            <Route path='/admin/dashboard' element={<AdminDashboard />} />
          </Route>
        </Route>
      </Route>

      {/* Dosen Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<RoleRoute allowedRoles={['DOSEN']} />}>
          <Route element={<DosenLayout />}>
            <Route path='/dosen/dashboard' element={<DosenDashboard />} />
            <Route path='/dosen/courses/:courseId' element={<CourseHome />} />
            <Route path='/dosen/courses/:courseId/materials' element={<Materials />} />
            <Route path='/dosen/courses/:courseId/materials/new' element={<CreateMaterial />} />
            <Route path='/dosen/courses/:courseId/students' element={<Students />} />
            <Route path='/dosen/courses/:courseId/assignments' element={<Assignments />} />
            <Route path='/dosen/courses/:courseId/assignments/new' element={<CreateAssignment />} />
            <Route
              path='/dosen/courses/:courseId/assignments/:assignmentId/submissions'
              element={<Submissions />}
            />
            <Route
              path='/dosen/courses/:courseId/submissions'
              element={<Submissions />}
            />
            <Route path='/dosen/assignments/:assignmentId/submissions' element={<Submissions />} />
          </Route>
        </Route>
      </Route>

      {/* Mahasiswa Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<RoleRoute allowedRoles={['MAHASISWA']} />}>
          <Route element={<MahasiswaLayout />}>
            <Route path='/mahasiswa/dashboard' element={<MahasiswaDashboard />} />
            <Route path='/mahasiswa/courses/:courseId' element={<MahasiswaCourseHome />} />
            <Route path='/mahasiswa/courses/:courseId/materials' element={<CourseMaterials />} />
            <Route path='/mahasiswa/courses/:courseId/materials/:materialId' element={<MaterialDetail />} />
            <Route path='/mahasiswa/courses/:courseId/assignments' element={<MahasiswaAssignments />} />
            <Route path='/mahasiswa/courses/:courseId/assignments/:assignmentId' element={<AssignmentDetail />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}

export default AppRoutes;

