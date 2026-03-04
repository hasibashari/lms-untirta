import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAllSemesters,
  createSemester,
  updateSemesterStatus,
  deleteSemester,
  getClosingReadiness,
} from '../academicService';
import toast from 'react-hot-toast';

export const useSemesters = () => {
  return useQuery({
    queryKey: ['semesters'],
    queryFn: () => getAllSemesters(),
    select: (res) => res?.data || [],
  });
};

export const useClosingReadiness = (semesterId) => {
  return useQuery({
    queryKey: ['closingReadiness', semesterId],
    queryFn: () => getClosingReadiness(semesterId),
    select: (res) => res?.data || res,
    enabled: !!semesterId, // Only fetch if ID is present
    retry: false, // Don't retry pre-flight checks unnecessarily
  });
};

export const useCreateSemester = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSemester,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['semesters'] });
      toast.success(`Semester ${variables.semesterType} ${variables.academicYear} berhasil dibuat`);
    },
    onError: (err) => {
      toast.error(err?.message || 'Gagal membuat semester');
    },
  });
};

export const useUpdateSemesterStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => updateSemesterStatus(id, status),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['semesters'] });
      toast.success(`Status semester berhasil diubah ke ${variables.status}`);
    },
    // Component will handle specific errors (like GRADE_COMPLETION_REQUIRED)
  });
};

export const useDeleteSemester = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSemester,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['semesters'] });
      toast.success('Semester berhasil dihapus');
    },
    onError: (err) => {
      toast.error(err?.message || 'Gagal menghapus semester');
    },
  });
};
