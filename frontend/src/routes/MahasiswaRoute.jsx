import { Route } from 'react-router-dom';

import MahasiswaLayout from '../layouts/MahasiswaLayout';
import LearningLayout from '../layouts/LearningLayout';
import MahasiswaDashboard from '../pages/mahasiswa/Dashboard';
import MyClasses from '../pages/mahasiswa/MyClasses';
import MyGrades from '../pages/mahasiswa/MyGrades';
import MahasiswaCourseHome from '../pages/mahasiswa/CourseHome';
import CourseMaterials from '../pages/mahasiswa/CourseMaterials';
import MaterialDetail from '../pages/mahasiswa/MaterialDetail';
import MahasiswaAssignments from '../pages/mahasiswa/Assignments';
import AssignmentDetail from '../pages/mahasiswa/AssignmentDetail';

/**
 * Route untuk role Mahasiswa
 * 
 * Struktur:
 * - /mahasiswa/dashboard - Dashboard (overview/ringkasan)
 * - /mahasiswa/classes - Kelas Saya (daftar lengkap)
 * - /mahasiswa/grades - Nilai Saya (nilai terpusat dari semua kelas)
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
      <Route path='/mahasiswa/dashboard' element={<MahasiswaDashboard />} />
      <Route path='/mahasiswa/classes' element={<MyClasses />} />
      <Route path='/mahasiswa/grades' element={<MyGrades />} />
      <Route path='/mahasiswa/courses/:courseId' element={<MahasiswaCourseHome />} />
      <Route path='/mahasiswa/courses/:courseId/materials' element={<CourseMaterials />} />
      <Route path='/mahasiswa/courses/:courseId/assignments' element={<MahasiswaAssignments />} />
      <Route path='/mahasiswa/courses/:courseId/assignments/:assignmentId' element={<AssignmentDetail />} />
    </Route>

    {/* Routes dengan LearningLayout (fokus baca materi) */}
    <Route element={<LearningLayout />}>
      <Route path='/mahasiswa/courses/:courseId/materials/:materialId' element={<MaterialDetail />} />
    </Route>
  </>
);