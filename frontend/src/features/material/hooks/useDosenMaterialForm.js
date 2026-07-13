import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { createMaterial, getMaterialDetail, updateMaterial } from '../api/material.api';

export const useDosenMaterialForm = (classId, materialId) => {
  const navigate = useNavigate();
  const isEditMode = Boolean(materialId);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [order, setOrder] = useState('');
  const [file, setFile] = useState(null);
  const [existingFileUrl, setExistingFileUrl] = useState('');
  const [removeFile, setRemoveFile] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  
  const [activeTab, setActiveTab] = useState('edit');

  useEffect(() => {
    if (isEditMode && materialId) {
      setLoading(true);
      getMaterialDetail(materialId)
        .then(res => {
          const data = res.data;
          setTitle(data.title || '');
          setContent(data.content || '');
          setOrder(data.order?.toString() || '');
          setExistingFileUrl(data.fileUrl || '');
        })
        .catch(err => {
          setError(err?.response?.data?.message || err?.message || 'Gagal memuat data materi');
        })
        .finally(() => setLoading(false));
    }
  }, [isEditMode, materialId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!classId || classId === 'undefined') return;
    if (!title.trim()) {
      setError('Judul materi harus diisi');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = {
        title: title.trim(),
        content: content,
        order: order ? parseInt(order) : undefined,
        file: file,
        removeFile: removeFile,
      };

      if (isEditMode) {
        await updateMaterial(materialId, payload);
        toast.success('Materi berhasil diperbarui');
      } else {
        await createMaterial(classId, payload);
        toast.success('Materi berhasil dibuat');
      }
      navigate(`/dosen/classes/${classId}/materials`);
    } catch (err) {
      console.error('Save material error:', err);
      setError(err?.response?.data?.message || err?.message || 'Gagal menyimpan materi');
      toast.error('Gagal menyimpan materi');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (title.trim() || content.trim() || file) {
      setShowLeaveConfirm(true);
    } else {
      navigate(`/dosen/classes/${classId}/materials`);
    }
  };

  return {
    isEditMode,
    title,
    setTitle,
    content,
    setContent,
    order,
    setOrder,
    file,
    setFile,
    existingFileUrl,
    removeFile,
    setRemoveFile,
    saving,
    error,
    loading,
    showLeaveConfirm,
    setShowLeaveConfirm,
    activeTab,
    setActiveTab,
    handleSubmit,
    handleCancel,
  };
};
