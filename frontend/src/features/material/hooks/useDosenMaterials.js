import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { getMaterials, getMaterialDetail, deleteMaterial } from '../api/material.api';

export const useDosenMaterials = (classId) => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  
  const [previewMaterial, setPreviewMaterial] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(null);
  
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchMaterials = useCallback(async () => {
    if (!classId || classId === 'undefined') return;

    setLoading(true);
    try {
      const res = await getMaterials(classId);
      setMaterials(res.data || []);
    } catch (err) {
      setError(err?.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  const openPreview = async (materialId) => {
    setPreviewLoading(true);
    setPreviewError(null);
    setPreviewMaterial(null);

    try {
      const res = await getMaterialDetail(materialId);
      setPreviewMaterial(res.data);
    } catch (err) {
      setPreviewError(err?.message || err || 'Gagal memuat preview materi');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteMaterial(deleteConfirm.id);
      setMaterials((prev) => prev.filter((m) => m.id !== deleteConfirm.id));
      toast.success('Materi berhasil dihapus');
    } catch (err) {
      toast.error(err?.message || err || 'Gagal menghapus materi');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const filteredMaterials = materials.filter(mat =>
    mat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return {
    materials,
    filteredMaterials,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    previewMaterial,
    setPreviewMaterial,
    previewLoading,
    previewError,
    deleteConfirm,
    setDeleteConfirm,
    openPreview,
    handleDelete,
    fetchMaterials,
    setPreviewError,
    setPreviewLoading,
  };
};
