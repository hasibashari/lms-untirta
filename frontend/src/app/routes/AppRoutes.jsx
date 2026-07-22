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
import PageLoader from '../../shared/components/feedback/PageLoader';
import UnauthorizedPage from '../../shared/error/UnauthorizedPage';

// Public pages
import Home from '../../features/landing/pages/HomePage';
import About from '../../features/landing/pages/AboutPage';

// Auth module
import Login from '../../features/auth/pages/LoginAuthPage';
import Register from '../../features/auth/pages/RegisterAuthPage';
import ForgotPassword from '../../features/auth/pages/ForgotPasswordPage';
import ResetPassword from '../../features/auth/pages/ResetPasswordPage';
import VerifyEmail from '../../features/auth/pages/VerifyEmailPage';

// ----- Lazy-loaded pages (feature-based modules) -----

// Dashboard module (eagerly imported for instant initial paint post-login)
import AdminDashboard from '../../features/dashboard/pages/AdminDashboardPage';
import DosenDashboard from '../../features/dashboard/pages/DosenDashboardPage';
import MahasiswaDashboard from '../../features/dashboard/pages/MahasiswaDashboardPage';

// User module
const AdminUsers = lazy(() => import('../../features/user/pages/AdminUserPage'));
const AdminCreateUser = lazy(() => import('../../features/user/pages/AdminUserCreatePage'));
const AdminEditUser = lazy(() => import('../../features/user/pages/AdminUserEditPage'));
const ProfilePage = lazy(() => import('../../features/user/pages/ProfilePage'));

// Course module
const AdminCourses = lazy(() => import('../../features/course/pages/AdminCoursePage'));
const DosenCourseHome = lazy(() => import('../../features/course/pages/DosenCoursePage'));
const DosenStudents = lazy(() => import('../../features/course/pages/DosenCourseMahasiswaPage'));
const MahasiswaCourseHome = lazy(() => import('../../features/course/pages/MahasiswaCoursePage'));
const MahasiswaCourseMaterials = lazy(() => import('../../features/material/pages/MahasiswaMaterialPage'));

// Class module
const AdminClasses = lazy(() => import('../../features/class/pages/AdminClassOfferingPage'));
const DosenMyClasses = lazy(() => import('../../features/class/pages/DosenClassPage'));
const MahasiswaMyClasses = lazy(() => import('../../features/class/pages/MahasiswaClassPage'));
const KartuRencanaStudi = lazy(() => import('../../features/krs/pages/MahasiswaKrsPage'));
const AdminKrsMonitoring = lazy(() => import('../../features/krs/pages/AdminKrsApprovalPage'));
const DosenAdvisory = lazy(() => import('../../features/krs/pages/DosenKrsAdvisoryPage'));
const PrintKrsPage = lazy(() => import('../../features/krs/pages/PrintKrsPage'));

// Advisor Assignment module
const AdvisorAssignment = lazy(() => import('../../features/user/pages/AdminUserAdvisorPage'));

// Transcript module
const MahasiswaStudyResult = lazy(() => import('../../features/transcript/pages/MahasiswaTranscriptPage'));
const PrintKhsPage = lazy(() => import('../../features/transcript/pages/PrintKhsPage'));
const AdminStudentList = lazy(() => import('../../features/transcript/pages/AdminMahasiswaListPage'));
const AdminStudentTranscript = lazy(() => import('../../features/transcript/pages/AdminTranscriptMahasiswaPage'));

// Material module
const DosenMaterials = lazy(() => import('../../features/material/pages/DosenMaterialPage'));
const DosenCreateMaterial = lazy(() => import('../../features/material/pages/DosenMaterialCreatePage'));
const MahasiswaMaterialDetail = lazy(() => import('../../features/material/pages/MahasiswaMaterialDetailPage'));

// Academic module
const AdminAcademic = lazy(() => import('../../features/academic/pages/AdminAcademicPage'));

// Grade module
const DosenGradeList = lazy(() => import('../../features/grade/pages/DosenGradeListPage'));
const DosenGrading = lazy(() => import('../../features/grade/pages/DosenGradingPage'));


// Assignment module
const DosenAssignments = lazy(() => import('../../features/assignment/pages/DosenAssignPage'));
const DosenCreateAssignment = lazy(() => import('../../features/assignment/pages/DosenAssignCreatePage'));
const MahasiswaAssignments = lazy(() => import('../../features/assignment/pages/MahasiswaAssignPage'));
const MahasiswaAssignmentDetail = lazy(() => import('../../features/assignment/pages/MahasiswaAssignDetailPage'));

// Submission module
const DosenSubmissions = lazy(() => import('../../features/submission/page/SubmissionDosenListPage'));
const DosenAllSubmissions = lazy(() => import('../../features/submission/page/SubmissionDosenAllPage'));
const MahasiswaGrades = lazy(() => import('../../features/submission/page/MahasiswaGradesPage'));

// Forum module
const ForumThreadList = lazy(() => import('../../features/forum/pages/ForumThreadListPage'));
const ForumThreadCreate = lazy(() => import('../../features/forum/pages/ForumThreadCreatePage'));
const ForumThreadDetail = lazy(() => import('../../features/forum/pages/ForumThreadDetailPage'));

// Suspense wrapper for lazy-loaded pages
const Lazy = (props) => {
  const C = props.component;
  return (
    <Suspense fallback={<PageLoader />}>
      <C />
    </Suspense>
  );
};


function AppRoutes() {
  return (
    <Routes>
      {/* ── Public ── */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
      </Route>

      {/* ── Auth ── */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
      </Route>

      {/* ── Error pages ── */}
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* ── Profile (All Authenticated Users) ── */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/profile" element={<Lazy component={ProfilePage} />} />
        </Route>
      </Route>

      {/* ── Admin (DashboardLayout) ── */}
      <Route element={<ProtectedRoute />}>
        <Route element={<RoleRoute roles={['ADMIN']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<Lazy component={AdminUsers} />} />
            <Route path="/admin/users/new" element={<Lazy component={AdminCreateUser} />} />
            <Route path="/admin/users/:id/edit" element={<Lazy component={AdminEditUser} />} />
            <Route path="/admin/courses" element={<Lazy component={AdminCourses} />} />
            <Route path="/admin/classes" element={<Lazy component={AdminClasses} />} />
            <Route path="/admin/krs" element={<Lazy component={AdminKrsMonitoring} />} />
            <Route path="/admin/advisor-assignment" element={<Lazy component={AdvisorAssignment} />} />
            <Route path="/admin/academic" element={<Lazy component={AdminAcademic} />} />
            <Route path="/admin/transcript" element={<Lazy component={AdminStudentList} />} />
            <Route path="/admin/transcript/:studentId" element={<Lazy component={AdminStudentTranscript} />} />
          </Route>
        </Route>
      </Route>

      {/* ── Dosen (DashboardLayout) ── */}
      <Route element={<ProtectedRoute />}>
        <Route element={<RoleRoute roles={['DOSEN']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dosen/dashboard" element={<DosenDashboard />} />
            <Route path="/dosen/advisory" element={<Lazy component={DosenAdvisory} />} />
            <Route path="/dosen/classes" element={<Lazy component={DosenMyClasses} />} />
            <Route path="/dosen/submissions" element={<Lazy component={DosenAllSubmissions} />} />
            <Route path="/dosen/grades" element={<Lazy component={DosenGradeList} />} />
            <Route path="/dosen/classes/:classId/grades" element={<Lazy component={DosenGrading} />} />
            <Route path="/dosen/classes/:classId/materials" element={<Lazy component={DosenMaterials} />} />
            <Route path="/dosen/classes/:classId/materials/new" element={<Lazy component={DosenCreateMaterial} />} />
            <Route path="/dosen/classes/:classId/materials/:materialId/edit" element={<Lazy component={DosenCreateMaterial} />} />
            <Route path="/dosen/classes/:classId/students" element={<Lazy component={DosenStudents} />} />
            <Route path="/dosen/classes/:classId/assignments" element={<Lazy component={DosenAssignments} />} />
            <Route path="/dosen/classes/:classId/assignments/new" element={<Lazy component={DosenCreateAssignment} />} />
            <Route path="/dosen/classes/:classId/assignments/:assignmentId/edit" element={<Lazy component={DosenCreateAssignment} />} />
            <Route path="/dosen/classes/:classId/assignments/:assignmentId/submissions" element={<Lazy component={DosenSubmissions} />} />
            <Route path="/dosen/assignments/:assignmentId/submissions" element={<Lazy component={DosenSubmissions} />} />
            <Route path="/dosen/classes/:classId/forum" element={<Lazy component={ForumThreadList} />} />
            <Route path="/dosen/classes/:classId/forum/new" element={<Lazy component={ForumThreadCreate} />} />
            <Route path="/dosen/classes/:classId/forum/:threadId" element={<Lazy component={ForumThreadDetail} />} />
            <Route path="/dosen/classes/:classId/forum/:threadId/edit" element={<Lazy component={ForumThreadCreate} />} />
            <Route path="/dosen/classes/:classId" element={<Lazy component={DosenCourseHome} />} />
          </Route>
        </Route>
      </Route>

      {/* ── Mahasiswa (StudentLayout + LearningLayout) ── */}
      <Route element={<ProtectedRoute />}>
        <Route element={<RoleRoute roles={['MAHASISWA']} />}>
          <Route path="/mahasiswa/krs/print/:semesterId" element={<Lazy component={PrintKrsPage} />} />
          <Route path="/mahasiswa/study-result/print" element={<Lazy component={PrintKhsPage} />} />
          <Route element={<StudentLayout />}>
            <Route path="/mahasiswa/dashboard" element={<MahasiswaDashboard />} />
            <Route path="/mahasiswa/classes" element={<Lazy component={MahasiswaMyClasses} />} />
            <Route path="/mahasiswa/grades" element={<Lazy component={MahasiswaGrades} />} />
            <Route path="/mahasiswa/krs" element={<Lazy component={KartuRencanaStudi} />} />
            <Route path="/mahasiswa/study-result" element={<Lazy component={MahasiswaStudyResult} />} />
            <Route path="/mahasiswa/classes/:classId" element={<Lazy component={MahasiswaCourseHome} />} />
            <Route path="/mahasiswa/classes/:classId/materials" element={<Lazy component={MahasiswaCourseMaterials} />} />
            <Route path="/mahasiswa/classes/:classId/assignments" element={<Lazy component={MahasiswaAssignments} />} />
            <Route path="/mahasiswa/classes/:classId/assignments/:assignmentId" element={<Lazy component={MahasiswaAssignmentDetail} />} />
            <Route path="/mahasiswa/classes/:classId/forum" element={<Lazy component={ForumThreadList} />} />
            <Route path="/mahasiswa/classes/:classId/forum/new" element={<Lazy component={ForumThreadCreate} />} />
            <Route path="/mahasiswa/classes/:classId/forum/:threadId" element={<Lazy component={ForumThreadDetail} />} />
            <Route path="/mahasiswa/classes/:classId/forum/:threadId/edit" element={<Lazy component={ForumThreadCreate} />} />
          </Route>
          <Route element={<LearningLayout />}>
            <Route path="/mahasiswa/classes/:classId/materials/:materialId" element={<Lazy component={MahasiswaMaterialDetail} />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}

export default AppRoutes;
