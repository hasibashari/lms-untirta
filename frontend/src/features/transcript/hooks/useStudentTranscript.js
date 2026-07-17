import { useQuery } from '@tanstack/react-query';
import { getMyTranscript } from '../api/transcript.api';



export const useMyTranscript = () => {
  return useQuery({
    queryKey: ['my-transcript'],
    queryFn: () => getMyTranscript(),
    staleTime: 30 * 1000,
  });
};
