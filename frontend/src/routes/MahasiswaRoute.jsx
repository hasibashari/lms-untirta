import { lazy, Suspense } from 'react';
import { Route } from 'react-router-dom';
import { PageLoader } from '../components/shared';

import MahasiswaLayout from '../layouts/MahasiswaLayout';
import LearningLayout from '../layouts/LearningLayout';

// Lazy load semua pages untuk code splitting
const MahasiswaDashboard = lazy(() => import('../pages/mahasiswa/Dashboard'));
const MyClasses = lazy(() => import('../pages/mahasiswa/MyClasses'));

const KRS = lazy(() => import('../pages/mahasiswa/KRS'));
const HasilStudi = lazy(() => import('../pages/mahasiswa/HasilStudi'));
const MahasiswaCourseHome = lazy(() => import('../pages/mahasiswa/CourseHome'));
const CourseMaterials = lazy(() => import('../pages/mahasiswa/CourseMaterials'));
const MaterialDetail = lazy(() => import('../pages/mahasiswa/MaterialDetail'));
const MahasiswaAssignments = lazy(() => import('../pages/mahasiswa/Assignments'));
const AssignmentDetail = lazy(() => import('../pages/mahasiswa/AssignmentDetail'));

// Wrapper untuk lazy component dengan Suspense
const LazyPage = ({ component: Component }) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);

/**
 * Route untuk role Mahasiswa
 * 
 * Struktur:
 * - /mahasiswa/dashboard - Dashboard (overview/ringkasan)
 * - /mahasiswa/classes - Kelas Saya (daftar lengkap)

 * - /mahasiswa/krs - KRS (Kartu Rencana Studi)
 * - /mahasiswa/hasil-studi - Hasil Studi (transkrip nilai per semester)
 * - /mahasiswa/courses/:courseId - Detail kelas
 * - /mahasiswa/courses/:courseId/materials - Daftar materi
 * - /mahasiswa/courses/:courseId/materials/:materialId - Detail materi (learning mode)
 * - /mahasiswa/courses/:courseId/assignments - Daftar tugas
 * - /mahasiswa/courses/:courseId/assignments/:assignmentId - Detail tugas
 */
export const MahasiswaRoute = (
  <>
    {/* Routes dengan MahasiswaLayout (sidebar utama) */}
    <Route element={<MahasiswaLayout />}>
      <Route path='/mahasiswa/dashboard' element={<LazyPage component={MahasiswaDashboard} />} />
      <Route path='/mahasiswa/classes' element={<LazyPage component={MyClasses} />} />

      <Route path='/mahasiswa/krs' element={<LazyPage component={KRS} />} />
      <Route path='/mahasiswa/hasil-studi' element={<LazyPage component={HasilStudi} />} />
      <Route path='/mahasiswa/courses/:courseId' element={<LazyPage component={MahasiswaCourseHome} />} />
      <Route path='/mahasiswa/courses/:courseId/materials' element={<LazyPage component={CourseMaterials} />} />
      <Route path='/mahasiswa/courses/:courseId/assignments' element={<LazyPage component={MahasiswaAssignments} />} />
      <Route path='/mahasiswa/courses/:courseId/assignments/:assignmentId' element={<LazyPage component={AssignmentDetail} />} />
    </Route>

    {/* Routes dengan LearningLayout (fokus baca materi) */}
    <Route element={<LearningLayout />}>
      <Route path='/mahasiswa/courses/:courseId/materials/:materialId' element={<LazyPage component={MaterialDetail} />} />
    </Route>
  </>
);