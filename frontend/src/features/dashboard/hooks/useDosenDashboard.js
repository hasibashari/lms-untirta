import { useState, useEffect } from 'react';
import { getMyClasses, getTeacherDashboardStats } from '../../class/api/class.api';
import { getRecentSubmissions } from '../../submission/api/submission.api';

export const useDosenDashboardData = () => {
  const [classes, setClasses] = useState([]);
  const [stats, setStats] = useState(null);
  const [recentSubmissions, setRecentSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const academicSemesterId = localStorage.getItem('selectedDosenAcademicSemesterId');
    const params = academicSemesterId && academicSemesterId !== 'all' ? { academicSemesterId } : {};

    Promise.all([
      getMyClasses(params),
      getTeacherDashboardStats(params),
      getRecentSubmissions({ limit: 5, ...params }),
    ])
      .then(([classesRes, statsRes, submissionsRes]) => {
        setClasses(classesRes.data);
        setStats(statsRes.data);
        setRecentSubmissions(submissionsRes.data);
      })
      .catch(err => setError(err?.message || 'Gagal memuat data'))
      .finally(() => setLoading(false));
  }, []);

  return {
    classes,
    stats,
    recentSubmissions,
    loading,
    error,
  };
};
