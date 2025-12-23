import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  getSubmissions,
  gradeSubmission,
  getAssignments,
} from '../../services/dosen.service';
import SubmissionItem from '../../components/SubmissionItem';
import BackButton from '../../components/navigation/BackButton';
import Breadcrumb from '../../components/navigation/Breadcrumb';

export default function Submissions() {
  const { courseId, assignmentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [assignments, setAssignments] = useState([]);

  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Mode A: course-level submissions page -> show assignment picker/list
    if (courseId && !assignmentId) {
      setLoading(true);
      setError(null);
      getAssignments(courseId)
        .then(res => setAssignments(res.data))
        .catch(err => setError(err))
        .finally(() => setLoading(false));
      return;
    }

    // Mode B: assignment submissions
    if (!assignmentId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    getSubmissions(assignmentId)
      .then(res => setSubmissions(res.data))
      .catch(err => setError(err))
      .finally(() => setLoading(false));
  }, [assignmentId, courseId]);

  const handleGrade = async (submissionId, grade, feedback) => {
    try {
      const res = await gradeSubmission(submissionId, {
        grade,
        feedback,
      });

      // Update local state (UX cepat, tanpa refetch)
      setSubmissions(prev =>
        prev.map(s =>
          s.id === submissionId
            ? { ...s, ...res.data }
            : s
        )
      );
    } catch (err) {
      alert('Gagal menyimpan nilai');
    }
  };

  const tabClass = ({ isActive }) =>
    `text-sm px-3 py-2 rounded ${isActive ? 'bg-white shadow font-semibold' : 'hover:bg-white/60'
    }`;

  const isSubmissionTabActive = location.pathname.includes('/submissions');
  const submissionTabClass = `text-sm px-3 py-2 rounded ${isSubmissionTabActive
      ? 'bg-white shadow font-semibold'
      : 'hover:bg-white/60'
    }`;

  const errorMessage = err =>
    err?.response?.data?.message || err?.message || 'Terjadi kesalahan.';

  if (loading) return <p className='text-gray-600'>Memuat submission...</p>;
  if (error) return <p className='text-red-600'>{errorMessage(error)}</p>;

  return (
    <div className='space-y-4'>
      <div className='space-y-2'>
        <BackButton fallback={courseId ? `/dosen/courses/${courseId}` : '/dosen/dashboard'} />
        <Breadcrumb
          items={[
            { label: 'Dashboard', to: '/dosen/dashboard' },
            ...(courseId
              ? [{ label: 'Kelas', to: `/dosen/courses/${courseId}` }]
              : []),
            ...(assignmentId
              ? [{ label: 'Tugas', to: courseId ? `/dosen/courses/${courseId}/assignments` : '/dosen/dashboard' }]
              : []),
            { label: 'Submission' },
          ]}
        />
      </div>

      {courseId && (
        <div className='bg-gray-50 rounded p-2 flex gap-2 flex-wrap'>
          <NavLink to={`/dosen/courses/${courseId}/materials`} className={tabClass}>
            Materi
          </NavLink>
          <NavLink to={`/dosen/courses/${courseId}/students`} className={tabClass}>
            Mahasiswa
          </NavLink>
          <NavLink to={`/dosen/courses/${courseId}/assignments`} className={tabClass}>
            Tugas
          </NavLink>
          <NavLink
            to={`/dosen/courses/${courseId}/submissions`}
            className={() => submissionTabClass}
          >
            Submission
          </NavLink>
        </div>
      )}

      <div>
        <h1 className='text-xl font-bold'>Submission</h1>
        <p className='text-sm text-gray-600'>Review dan nilai pengumpulan mahasiswa.</p>
      </div>

      {/* Course-level view: pick an assignment */}
      {courseId && !assignmentId && (
        <div className='space-y-3'>
          {assignments.length === 0 ? (
            <div className='bg-white p-4 rounded shadow'>
              <p className='text-gray-600'>Belum ada tugas di kelas ini.</p>
              <button
                onClick={() => navigate(`/dosen/courses/${courseId}/assignments/new`)}
                className='text-blue-600 hover:underline text-sm mt-2'
              >
                Buat tugas dulu →
              </button>
            </div>
          ) : (
            <div className='space-y-2'>
              {assignments.map(task => (
                <div
                  key={task.id}
                  className='bg-white p-4 rounded shadow flex items-center justify-between gap-4'
                >
                  <div>
                    <p className='font-semibold'>{task.title}</p>
                    <p className='text-sm text-gray-600'>
                      Deadline: {new Date(task.dueDate).toLocaleString('id-ID')}
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      navigate(`/dosen/courses/${courseId}/assignments/${task.id}/submissions`)
                    }
                    className='text-blue-600 hover:underline text-sm'
                  >
                    Lihat Submission →
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Assignment view */}
      {assignmentId && submissions.length === 0 && (
        <div className='bg-white p-4 rounded shadow'>
          <p className='text-gray-600'>Belum ada mahasiswa yang mengumpulkan tugas.</p>
          {courseId && (
            <button
              onClick={() => navigate(`/dosen/courses/${courseId}/assignments`)}
              className='text-blue-600 hover:underline text-sm mt-2'
            >
              Kembali ke daftar tugas →
            </button>
          )}
        </div>
      )}

      {assignmentId && submissions.map(sub => (
        <SubmissionItem
          key={sub.id}
          submission={sub}
          onGrade={handleGrade}
        />
      ))}

      {!courseId && !assignmentId && (
        <div className='bg-white p-4 rounded shadow'>
          <p className='text-gray-600'>Pilih kelas terlebih dahulu.</p>
          <button
            onClick={() => navigate('/dosen/dashboard')}
            className='text-blue-600 hover:underline text-sm mt-2'
          >
            Kembali ke Dashboard →
          </button>
        </div>
      )}
    </div>
  );
}
