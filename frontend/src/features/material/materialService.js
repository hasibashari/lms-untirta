import api from '../../services/apiService';

// ========== Material CRUD ==========

export const getMaterials = async (classId) => {
  return api.get(`/materials/class/${classId}`);
};

export const getMaterialDetail = async (materialId) => {
  return api.get(`/materials/${materialId}`);
};

export const createMaterial = async (classId, payload) => {
  return api.post(`/materials/class/${classId}`, payload);
};

export const updateMaterial = async (materialId, payload) => {
  return api.put(`/materials/${materialId}`, payload);
};

export const deleteMaterial = async (materialId) => {
  return api.delete(`/materials/${materialId}`);
};
