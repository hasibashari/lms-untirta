import { useMutation } from '@tanstack/react-query';
import api from '@/shared/api/apiService';

export const useChat = () => {
  return useMutation({
    mutationFn: async (message) => {
      const response = await api.post('/chat', { message });
      return response;
    },
  });
};
