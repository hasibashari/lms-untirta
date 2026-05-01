import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUsers, deleteUser } from '../userService';
import { toast } from 'react-hot-toast';

export const useUsers = (params) => {
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => getUsers(params),
    keepPreviousData: true, // Keep old data while fetching new page
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User berhasil dihapus');
    },
    onError: (error) => {
      toast.error(error.message || 'Gagal menghapus user');
    }
  });
};
