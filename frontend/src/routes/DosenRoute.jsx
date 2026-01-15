import { lazy, Suspense } from 'react';
import { Route } from 'react-router-dom';
import { PageLoader } from '../components/shared';

// Lazy load semua pages untuk code splitting
const DosenDashboard = lazy(() => import('../pages/dosen/Dashboard'));
const MyClasses = lazy(() => import('../pages/dosen/MyClasses'));
const CourseHome = lazy(() => import('../pages/dosen/CourseHome'));
const Materials = lazy(() => import('../pages/dosen/Materials'));
const CreateMaterial = lazy(() => import('../pages/dosen/CreateMaterial'));
const Students = lazy(() => import('../pages/dosen/Students'));
const Assignments = lazy(() => import('../pages/dosen/Assignments'));
const CreateAssignment = lazy(() => import('../pages/dosen/CreateAssignment'));
const Submissions = lazy(() => import('../pages/dosen/Submissions'));
const AllSubmissions = lazy(() => import('../pages/dosen/AllSubmissions'));

// Wrapper untuk lazy component dengan Suspense
const LazyPage = ({ component: Component }) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);

export const DosenRoute = (
  <>
    <Route path='/dosen/dashboard' element={<LazyPage component={DosenDashboard} />} />
    <Route path='/dosen/classes' element={<LazyPage component={MyClasses} />} />
    <Route path='/dosen/submissions' element={<LazyPage component={AllSubmissions} />} />
    <Route path='/dosen/courses/:courseId' element={<LazyPage component={CourseHome} />} />
    <Route path='/dosen/courses/:courseId/materials' element={<LazyPage component={Materials} />} />
    <Route path='/dosen/courses/:courseId/materials/new' element={<LazyPage component={CreateMaterial} />} />
    <Route path='/dosen/courses/:courseId/materials/:materialId/edit' element={<LazyPage component={CreateMaterial} />} />
    <Route path='/dosen/courses/:courseId/students' element={<LazyPage component={Students} />} />
    <Route path='/dosen/courses/:courseId/assignments' element={<LazyPage component={Assignments} />} />
    <Route path='/dosen/courses/:courseId/assignments/new' element={<LazyPage component={CreateAssignment} />} />
    <Route path='/dosen/courses/:courseId/assignments/:assignmentId/edit' element={<LazyPage component={CreateAssignment} />} />
    <Route
      path='/dosen/courses/:courseId/assignments/:assignmentId/submissions'
      element={<LazyPage component={Submissions} />}
    />
    <Route
      path='/dosen/courses/:courseId/submissions'
      element={<LazyPage component={Submissions} />}
    />
    <Route path='/dosen/assignments/:assignmentId/submissions' element={<LazyPage component={Submissions} />} />
  </>
);