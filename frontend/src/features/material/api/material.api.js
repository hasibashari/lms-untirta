import api from '@/shared/api/apiService';

// ========== Material CRUD ==========

export const getMaterials = async (classId) => {
  return api.get(`/materials/class/${classId}`);
};

export const getMaterialDetail = async (materialId) => {
  return api.get(`/materials/${materialId}`);
};

export const createMaterial = async (classId, payload) => {
  if (payload.file) {
    const formData = new FormData();
    formData.append('title', payload.title);
    if (payload.content) formData.append('content', payload.content);
    if (payload.order !== undefined) formData.append('order', payload.order);
    formData.append('file', payload.file);
    return api.post(`/materials/class/${classId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
  return api.post(`/materials/class/${classId}`, payload);
};

export const updateMaterial = async (materialId, payload) => {
  if (payload.file || payload.removeFile) {
    const formData = new FormData();
    if (payload.title) formData.append('title', payload.title);
    if (payload.content !== undefined) formData.append('content', payload.content);
    if (payload.order !== undefined) formData.append('order', payload.order);
    if (payload.removeFile) formData.append('removeFile', 'true');
    if (payload.file) formData.append('file', payload.file);
    return api.put(`/materials/${materialId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
  return api.put(`/materials/${materialId}`, payload);
};

export const deleteMaterial = async (materialId) => {
  return api.delete(`/materials/${materialId}`);
};
