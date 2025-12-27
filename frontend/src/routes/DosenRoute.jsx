import { Route } from 'react-router-dom';

import DosenDashboard from '../pages/dosen/Dashboard';
import MyClasses from '../pages/dosen/MyClasses';
import CourseHome from '../pages/dosen/CourseHome';
import Materials from '../pages/dosen/Materials';
import CreateMaterial from '../pages/dosen/CreateMaterial';
import Students from '../pages/dosen/Students';
import Assignments from '../pages/dosen/Assignments';
import CreateAssignment from '../pages/dosen/CreateAssignment';
import Submissions from '../pages/dosen/Submissions';
import AllSubmissions from '../pages/dosen/AllSubmissions';


export const DosenRoute = (
  <>
    <Route path='/dosen/dashboard' element={<DosenDashboard />} />
    <Route path='/dosen/classes' element={<MyClasses />} />
    <Route path='/dosen/submissions' element={<AllSubmissions />} />
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
  </>
);