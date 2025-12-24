import { Route } from 'react-router-dom';

import MahasiswaDashboard from '../pages/mahasiswa/Dashboard';
import MahasiswaCourseHome from '../pages/mahasiswa/CourseHome';
import CourseMaterials from '../pages/mahasiswa/CourseMaterials';
import MaterialDetail from '../pages/mahasiswa/MaterialDetail';
import MahasiswaAssignments from '../pages/mahasiswa/Assignments';
import AssignmentDetail from '../pages/mahasiswa/AssignmentDetail';

export const MahasiswaRoute = (
  <>
    <Route path='/mahasiswa/dashboard' element={<MahasiswaDashboard />} />
    <Route path='/mahasiswa/courses/:courseId' element={<MahasiswaCourseHome />} />
    <Route path='/mahasiswa/courses/:courseId/materials' element={<CourseMaterials />} />
    <Route path='/mahasiswa/courses/:courseId/materials/:materialId' element={<MaterialDetail />} />
    <Route path='/mahasiswa/courses/:courseId/assignments' element={<MahasiswaAssignments />} />
    <Route path='/mahasiswa/courses/:courseId/assignments/:assignmentId' element={<AssignmentDetail />} />
  </>
);