import { useMutation } from '@tanstack/react-query';
import api from '@/shared/api/apiService';

export const useChat = () => {
  return useMutation({
    mutationFn: async ({ message, history }) => {
      const response = await api.post('/chat', { message, history });
      return response;
    },
  });
};
