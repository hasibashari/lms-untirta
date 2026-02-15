import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

// Layouts
import PublicLayout from '../layouts/PublicLayout';
import AuthLayout from '../layouts/AuthLayout';
import DashboardLayout from '../layouts/DashboardLayout';
import StudentLayout from '../layouts/StudentLayout';
import LearningLayout from '../layouts/LearningLayout';

// Route guards
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';

// Shared components
import PageLoader from '../components/shared/PageLoader';

// Public pages
import Home from '../features/landing/pages/Home';

// Auth module
import Login from '../features/auth/pages/Login';
import Register from '../features/auth/pages/Register';

// ----- Lazy-loaded pages (feature-based modules) -----

// Dashboard module
const AdminDashboard = lazy(() => import('../features/dashboard/pages/AdminDashboard'));
const DosenDashboard = lazy(() => import('../features/dashboard/pages/DosenDashboard'));
const MahasiswaDashboard = lazy(() => import('../features/dashboard/pages/MahasiswaDashboard'));

// User module
const AdminUsers = lazy(() => import('../features/user/pages/AdminUsers'));
const AdminCreateUser = lazy(() => import('../features/user/pages/AdminCreateUser'));

// Course module
const AdminCourses = lazy(() => import('../features/course/pages/AdminCourses'));
const DosenMyClasses = lazy(() => import('../features/course/pages/DosenMyClasses'));
const DosenCourseHome = lazy(() => import('../features/course/pages/DosenCourseHome'));
const DosenStudents = lazy(() => import('../features/course/pages/DosenStudents'));
const MahasiswaMyClasses = lazy(() => import('../features/course/pages/MahasiswaMyClasses'));
const MahasiswaCourseHome = lazy(() => import('../features/course/pages/MahasiswaCourseHome'));
const MahasiswaCourseMaterials = lazy(() => import('../features/course/pages/MahasiswaCourseMaterials'));
const MahasiswaStudyPlan = lazy(() => import('../features/course/pages/MahasiswaStudyPlan'));
const MahasiswaStudyResult = lazy(() => import('../features/course/pages/MahasiswaStudyResult'));

// Material module
const DosenMaterials = lazy(() => import('../features/material/pages/DosenMaterials'));
const DosenCreateMaterial = lazy(() => import('../features/material/pages/DosenCreateMaterial'));
const MahasiswaMaterialDetail = lazy(() => import('../features/material/pages/MahasiswaMaterialDetail'));

// Assignment module
const DosenAssignments = lazy(() => import('../features/assignment/pages/DosenAssignments'));
const DosenCreateAssignment = lazy(() => import('../features/assignment/pages/DosenCreateAssignment'));
const DosenSubmissions = lazy(() => import('../features/assignment/pages/DosenSubmissions'));
const DosenAllSubmissions = lazy(() => import('../features/assignment/pages/DosenAllSubmissions'));
const MahasiswaAssignments = lazy(() => import('../features/assignment/pages/MahasiswaAssignments'));
const MahasiswaAssignmentDetail = lazy(() => import('../features/assignment/pages/MahasiswaAssignmentDetail'));

// Suspense wrapper for lazy-loaded pages
const Lazy = ({ component: Component }) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);

function AppRoutes() {
  return (
    <Routes>
      {/* ── Public ── */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
      </Route>

      {/* ── Auth ── */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* ── Admin (DashboardLayout) ── */}
      <Route element={<ProtectedRoute />}>
        <Route element={<RoleRoute roles={['ADMIN']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/admin/dashboard" element={<Lazy component={AdminDashboard} />} />
            <Route path="/admin/users" element={<Lazy component={AdminUsers} />} />
            <Route path="/admin/users/new" element={<Lazy component={AdminCreateUser} />} />
            <Route path="/admin/courses" element={<Lazy component={AdminCourses} />} />
          </Route>
        </Route>
      </Route>

      {/* ── Dosen (DashboardLayout) ── */}
      <Route element={<ProtectedRoute />}>
        <Route element={<RoleRoute roles={['DOSEN']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dosen/dashboard" element={<Lazy component={DosenDashboard} />} />
            <Route path="/dosen/classes" element={<Lazy component={DosenMyClasses} />} />
            <Route path="/dosen/submissions" element={<Lazy component={DosenAllSubmissions} />} />
            <Route path="/dosen/courses/:courseId" element={<Lazy component={DosenCourseHome} />} />
            <Route path="/dosen/courses/:courseId/materials" element={<Lazy component={DosenMaterials} />} />
            <Route path="/dosen/courses/:courseId/materials/new" element={<Lazy component={DosenCreateMaterial} />} />
            <Route path="/dosen/courses/:courseId/materials/:materialId/edit" element={<Lazy component={DosenCreateMaterial} />} />
            <Route path="/dosen/courses/:courseId/students" element={<Lazy component={DosenStudents} />} />
            <Route path="/dosen/courses/:courseId/assignments" element={<Lazy component={DosenAssignments} />} />
            <Route path="/dosen/courses/:courseId/assignments/new" element={<Lazy component={DosenCreateAssignment} />} />
            <Route path="/dosen/courses/:courseId/assignments/:assignmentId/edit" element={<Lazy component={DosenCreateAssignment} />} />
            <Route path="/dosen/courses/:courseId/assignments/:assignmentId/submissions" element={<Lazy component={DosenSubmissions} />} />
            <Route path="/dosen/courses/:courseId/submissions" element={<Lazy component={DosenSubmissions} />} />
            <Route path="/dosen/assignments/:assignmentId/submissions" element={<Lazy component={DosenSubmissions} />} />
          </Route>
        </Route>
      </Route>

      {/* ── Mahasiswa (StudentLayout + LearningLayout) ── */}
      <Route element={<ProtectedRoute />}>
        <Route element={<RoleRoute roles={['MAHASISWA']} />}>
          <Route element={<StudentLayout />}>
            <Route path="/mahasiswa/dashboard" element={<Lazy component={MahasiswaDashboard} />} />
            <Route path="/mahasiswa/classes" element={<Lazy component={MahasiswaMyClasses} />} />
            <Route path="/mahasiswa/study-plan" element={<Lazy component={MahasiswaStudyPlan} />} />
            <Route path="/mahasiswa/study-result" element={<Lazy component={MahasiswaStudyResult} />} />
            <Route path="/mahasiswa/courses/:courseId" element={<Lazy component={MahasiswaCourseHome} />} />
            <Route path="/mahasiswa/courses/:courseId/materials" element={<Lazy component={MahasiswaCourseMaterials} />} />
            <Route path="/mahasiswa/courses/:courseId/assignments" element={<Lazy component={MahasiswaAssignments} />} />
            <Route path="/mahasiswa/courses/:courseId/assignments/:assignmentId" element={<Lazy component={MahasiswaAssignmentDetail} />} />
          </Route>
          <Route element={<LearningLayout />}>
            <Route path="/mahasiswa/courses/:courseId/materials/:materialId" element={<Lazy component={MahasiswaMaterialDetail} />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}

export default AppRoutes;

