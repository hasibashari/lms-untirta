import api from '../../services/apiService';

// ========== Material CRUD ==========

export const getMaterials = async (courseId) => {
  return api.get(`/courses/${courseId}/materials`);
};

export const getMaterialDetail = async (materialId) => {
  return api.get(`/materials/${materialId}`);
};

export const createMaterial = async (courseId, payload) => {
  return api.post(`/courses/${courseId}/materials`, payload);
};

export const updateMaterial = async (materialId, payload) => {
  return api.put(`/materials/${materialId}`, payload);
};

export const deleteMaterial = async (materialId) => {
  return api.delete(`/materials/${materialId}`);
};
