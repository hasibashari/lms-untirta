import { useState, useEffect } from 'react';

/**
 * A shared hook to fetch and manage the list of academic semesters.
 * 
 * @param {Function} fetcher - The API function to call (e.g. getAllSemesters or getStudentSemesters)
 * @returns {Object} { semesters, loading, error }
 */
export const useSemesters = (fetcher) => {
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadSemesters = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetcher();
        if (!isMounted) return;

        // Handle various common API response structures
        const data = res?.data?.data || res?.data || res || [];
        setSemesters(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!isMounted) return;
        console.error('Error fetching semesters:', err);
        setSemesters([]);
        setError(err?.message || 'Gagal memuat daftar semester');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadSemesters();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { semesters, loading, error };
};
