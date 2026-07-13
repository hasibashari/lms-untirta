import { useState, useEffect } from 'react';
import { getMyClasses, getTeacherDashboardStats } from '../../class/api/class.api';
import { getRecentSubmissions } from '../../submission/submissionService';

export const useDosenDashboardData = () => {
  const [classes, setClasses] = useState([]);
  const [stats, setStats] = useState(null);
  const [recentSubmissions, setRecentSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      getMyClasses(),
      getTeacherDashboardStats(),
      getRecentSubmissions(5),
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
