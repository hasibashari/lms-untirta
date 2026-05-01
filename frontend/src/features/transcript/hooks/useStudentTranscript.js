import { useQuery } from '@tanstack/react-query';
import { getStudentTranscript } from '../transcriptService';

export const useStudentTranscript = (studentId) => {
  return useQuery({
    queryKey: ['student-transcript', studentId],
    queryFn: () => getStudentTranscript(studentId),
    enabled: !!studentId,
    staleTime: 10 * 60 * 1000, // 10 minutes (transcripts change rarely)
  });
};
