import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { getMyClasses } from '@/features/class/api/class.api';
import DosenGradingPage from './DosenGradingPage';

/**
 * Wrapper that resolves courseId → classId for the current dosen,
 * then renders the DosenGradingPage with the correct classId injected via URL.
 */
const DosenCourseGradesPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [classId, setClassId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const resolve = async () => {
      try {
        // Fetch dosen's classes, then find the one for this course
        const res = await getMyClasses();
        const classes = res.data?.data || res.data || [];
        const match = classes.find(
          (c) => c.courseId === courseId || c.courseId === parseInt(courseId)
        );
        if (match) {
          setClassId(match.id);
        } else {
          setError('Anda tidak mengampu kelas untuk mata kuliah ini');
        }
      } catch (err) {
        setError(err?.message || 'Gagal memuat data kelas');
      } finally {
        setLoading(false);
      }
    };
    resolve();
  }, [courseId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-blue-500 mx-auto mb-3" />
          <p className="text-slate-500">Mencari kelas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft size={16} /> Kembali
        </button>
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <AlertCircle size={32} className="text-red-500 mx-auto mb-3" />
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  // Render the grading page with the resolved classId by navigating
  // We override useParams by passing classId as a prop-like pattern
  // Simplest: just redirect to the class-based route
  if (classId) {
    // Use replace so back button works properly
    navigate(`/dosen/classes/${classId}/grades`, { replace: true });
    return null;
  }

  return null;
};

export default DosenCourseGradesPage;
