import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createAssignment, getAssignmentDetail, updateAssignment } from '../api/assignment.api';

export const useAssignCreate = () => {
  const { classId, assignmentId } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(assignmentId);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('edit');

  useEffect(() => {
    if (isEditMode && assignmentId) {
      setFetchLoading(true);
      getAssignmentDetail(assignmentId)
        .then(res => {
          const data = res.data;
          setTitle(data.title || '');
          setDescription(data.description || '');
          if (data.dueDate) {
            const date = new Date(data.dueDate);
            setDueDate(date.toISOString().slice(0, 16));
          }
        })
        .catch(err => {
          setError(err?.response?.data?.message || err?.message || 'Gagal memuat data tugas');
        })
        .finally(() => setFetchLoading(false));
    }
  }, [isEditMode, assignmentId]);

  const getMinDateTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    return now.toISOString().slice(0, 16);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!classId || classId === 'undefined') return;

    if (!title.trim()) {
      setError('Judul tugas tidak boleh kosong');
      return;
    }

    if (!dueDate) {
      setError('Deadline harus diisi');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        dueDate,
      };

      if (isEditMode) {
        await updateAssignment(assignmentId, payload);
      } else {
        await createAssignment(classId, payload);
      }

      navigate(`/dosen/classes/${classId}/assignments`);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Gagal menyimpan tugas');
    } finally {
      setLoading(false);
    }
  };

  return {
    classId,
    isEditMode,
    title,
    setTitle,
    description,
    setDescription,
    dueDate,
    setDueDate,
    loading,
    fetchLoading,
    error,
    setError,
    activeTab,
    setActiveTab,
    getMinDateTime,
    handleSubmit,
    navigate,
  };
};
