import { useQuery } from '@tanstack/react-query';
import { getStudentTranscript } from '../api/transcript.api';

export const useStudentTranscript = (studentId) => {
  return useQuery({
    queryKey: ['student-transcript', studentId],
    queryFn: () => getStudentTranscript(studentId),
    enabled: !!studentId,
    staleTime: 30 * 1000, // 30 seconds
  });
};
