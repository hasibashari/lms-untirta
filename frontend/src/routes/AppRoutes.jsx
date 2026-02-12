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
import { PageLoader } from '../components/shared';

// Public pages
import Home from '../pages/Home';

// Auth module
import Login from '../modules/auth/pages/Login';
import Register from '../modules/auth/pages/Register';

// ----- Lazy-loaded pages -----

// Admin
const AdminDashboard = lazy(() => import('../pages/admin/Dashboard'));
const AdminUsers = lazy(() => import('../pages/admin/Users'));
const AdminCreateUser = lazy(() => import('../pages/admin/CreateUser'));
const AdminCourses = lazy(() => import('../pages/admin/Courses'));

// Dosen
const DosenDashboard = lazy(() => import('../pages/dosen/Dashboard'));
const DosenMyClasses = lazy(() => import('../pages/dosen/MyClasses'));
const DosenCourseHome = lazy(() => import('../pages/dosen/CourseHome'));
const DosenMaterials = lazy(() => import('../pages/dosen/Materials'));
const DosenCreateMaterial = lazy(() => import('../pages/dosen/CreateMaterial'));
const DosenStudents = lazy(() => import('../pages/dosen/Students'));
const DosenAssignments = lazy(() => import('../pages/dosen/Assignments'));
const DosenCreateAssignment = lazy(() => import('../pages/dosen/CreateAssignment'));
const DosenSubmissions = lazy(() => import('../pages/dosen/Submissions'));
const DosenAllSubmissions = lazy(() => import('../pages/dosen/AllSubmissions'));

// Mahasiswa
const MahasiswaDashboard = lazy(() => import('../pages/mahasiswa/Dashboard'));
const MahasiswaMyClasses = lazy(() => import('../pages/mahasiswa/MyClasses'));
const MahasiswaStudyPlan = lazy(() => import('../pages/mahasiswa/StudyPlan'));
const MahasiswaStudyResult = lazy(() => import('../pages/mahasiswa/StudyResult'));
const MahasiswaCourseHome = lazy(() => import('../pages/mahasiswa/CourseHome'));
const MahasiswaCourseMaterials = lazy(() => import('../pages/mahasiswa/CourseMaterials'));
const MahasiswaMaterialDetail = lazy(() => import('../pages/mahasiswa/MaterialDetail'));
const MahasiswaAssignments = lazy(() => import('../pages/mahasiswa/Assignments'));
const MahasiswaAssignmentDetail = lazy(() => import('../pages/mahasiswa/AssignmentDetail'));

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

