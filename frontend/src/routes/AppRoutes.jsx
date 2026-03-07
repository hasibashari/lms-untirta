import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

// Layouts
import PublicLayout from '../components/layouts/PublicLayout';
import AuthLayout from '../components/layouts/AuthLayout';
import DashboardLayout from '../components/layouts/DashboardLayout';
import StudentLayout from '../components/layouts/StudentLayout';
import LearningLayout from '../components/layouts/LearningLayout';

// Route guards
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';

// Shared components
import PageLoader from '../components/shared/PageLoader';

// Public pages
import Home from '../features/landing/pages/HomePage';

// Auth module
import Login from '../features/auth/pages/LoginAuthPage';
import Register from '../features/auth/pages/RegisterAuthPage';

// ----- Lazy-loaded pages (feature-based modules) -----

// Dashboard module
const AdminDashboard = lazy(() => import('../features/dashboard/pages/AdminDashboardPage'));
const DosenDashboard = lazy(() => import('../features/dashboard/pages/DosenDashboardPage'));
const MahasiswaDashboard = lazy(() => import('../features/dashboard/pages/MahasiswaDashboardPage'));

// User module
const AdminUsers = lazy(() => import('../features/user/pages/AdminUserPage'));
const AdminCreateUser = lazy(() => import('../features/user/pages/AdminUserCreatePage'));

// Course module
const AdminCourses = lazy(() => import('../features/course/pages/AdminCoursePage'));
const DosenCourseHome = lazy(() => import('../features/course/pages/DosenCoursePage'));
const DosenStudents = lazy(() => import('../features/course/pages/DosenCourseMahasiswaPage'));
const MahasiswaCourseHome = lazy(() => import('../features/course/pages/MahasiswaCoursePage'));
const MahasiswaCourseMaterials = lazy(() => import('../features/material/pages/MahasiswaMaterialPage'));

// Class module
const AdminClasses = lazy(() => import('../features/class/pages/AdminClassOfferingPage'));
const DosenMyClasses = lazy(() => import('../features/class/pages/DosenClassPage'));
const MahasiswaMyClasses = lazy(() => import('../features/class/pages/MahasiswaClassPage'));
// KRS module
const MahasiswaStudyPlan = lazy(() => import('../features/krs/pages/MahasiswaKrsPage'));
const AdminKrsMonitoring = lazy(() => import('../features/krs/pages/AdminKrsApprovalPage'));
const DosenAdvisory = lazy(() => import('../features/krs/pages/DosenKrsAdvisoryPage'));

// Advisor Assignment module
const AdvisorAssignment = lazy(() => import('../features/user/pages/AdminUserAdvisorPage'));

// Transcript module
const MahasiswaStudyResult = lazy(() => import('../features/transcript/pages/MahasiswaTranscriptPage'));
const AdminStudentList = lazy(() => import('../features/transcript/pages/AdminMahasiswaListPage'));
const AdminStudentTranscript = lazy(() => import('../features/transcript/pages/AdminTranscriptMahasiswaPage'));

// Material module
const DosenMaterials = lazy(() => import('../features/material/pages/DosenMaterialPage'));
const DosenCreateMaterial = lazy(() => import('../features/material/pages/DosenMaterialCreatePage'));
const MahasiswaMaterialDetail = lazy(() => import('../features/material/pages/MahasiswaMaterialDetailPage'));

// Academic module
const AdminAcademic = lazy(() => import('../features/academic/pages/AdminAcademicPage'));

// Grade module
const DosenGradeList = lazy(() => import('../features/grade/pages/DosenGradeListPage'));
const DosenGrading = lazy(() => import('../features/grade/pages/DosenGradingPage'));
const DosenCourseGrades = lazy(() => import('../features/grade/pages/DosenGradeCoursePage'));

// Assignment module
const DosenAssignments = lazy(() => import('../features/assignment/pages/DosenAssignPage'));
const DosenCreateAssignment = lazy(() => import('../features/assignment/pages/DosenAssignCreatePage'));
const DosenSubmissions = lazy(() => import('../features/assignment/pages/SubmissionDosenListPage'));
const DosenAllSubmissions = lazy(() => import('../features/assignment/pages/SubmissionDosenAllPage'));
const MahasiswaAssignments = lazy(() => import('../features/assignment/pages/MahasiswaAssignPage'));
const MahasiswaAssignmentDetail = lazy(() => import('../features/assignment/pages/MahasiswaAssignDetailPage'));
const MahasiswaGrades = lazy(() => import('../features/assignment/pages/MahasiswaGradesPage'));

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
            <Route path="/dosen/dashboard" element={<Lazy component={DosenDashboard} />} />
            <Route path="/dosen/advisory" element={<Lazy component={DosenAdvisory} />} />
            <Route path="/dosen/classes" element={<Lazy component={DosenMyClasses} />} />
            <Route path="/dosen/submissions" element={<Lazy component={DosenAllSubmissions} />} />
            <Route path="/dosen/grades" element={<Lazy component={DosenGradeList} />} />
            <Route path="/dosen/classes/:classId/grades" element={<Lazy component={DosenGrading} />} />
            <Route path="/dosen/courses/:courseId/grades" element={<Lazy component={DosenCourseGrades} />} />
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
            <Route path="/mahasiswa/grades" element={<Lazy component={MahasiswaGrades} />} />
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
