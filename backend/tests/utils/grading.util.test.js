import { describe, expect, it } from '@jest/globals';
import { calculateAverageGrade, calculateGPA, convertToLetterGrade } from '../../src/utils/grading.util.js';

describe('grading util', () => {
  it('convertToLetterGrade: should handle null/undefined and boundary values', () => {
    expect(convertToLetterGrade(null)).toEqual({ letterGrade: '-', gradePoint: 0 });
    expect(convertToLetterGrade(undefined)).toEqual({ letterGrade: '-', gradePoint: 0 });
    expect(convertToLetterGrade(85)).toEqual({ letterGrade: 'A', gradePoint: 4.0 });
    expect(convertToLetterGrade(80)).toEqual({ letterGrade: 'A-', gradePoint: 3.7 });
    expect(convertToLetterGrade(75)).toEqual({ letterGrade: 'B+', gradePoint: 3.3 });
    expect(convertToLetterGrade(70)).toEqual({ letterGrade: 'B', gradePoint: 3.0 });
    expect(convertToLetterGrade(65)).toEqual({ letterGrade: 'B-', gradePoint: 2.7 });
    expect(convertToLetterGrade(60)).toEqual({ letterGrade: 'C+', gradePoint: 2.3 });
    expect(convertToLetterGrade(55)).toEqual({ letterGrade: 'C', gradePoint: 2.0 });
    expect(convertToLetterGrade(50)).toEqual({ letterGrade: 'D', gradePoint: 1.0 });
    expect(convertToLetterGrade(49.99)).toEqual({ letterGrade: 'E', gradePoint: 0 });
  });

  it('calculateAverageGrade: should only count graded submissions and round to 2 decimals', () => {
    const result = calculateAverageGrade([
      { grade: 80 },
      { grade: null },
      { grade: undefined },
      { grade: 83.335 },
    ]);

    expect(result).toEqual({
      averageScore: 81.67,
      gradedCount: 2,
      totalCount: 4,
    });
  });

  it('calculateAverageGrade: should return null average when nothing is graded', () => {
    const result = calculateAverageGrade([{ grade: null }, { grade: undefined }]);

    expect(result).toEqual({
      averageScore: null,
      gradedCount: 0,
      totalCount: 2,
    });
  });

  it('calculateGPA: should include only completed courses', () => {
    const result = calculateGPA([
      { sks: 3, gradePoint: 4.0, averageScore: 90 },
      { sks: 2, gradePoint: 3.0, averageScore: 70 },
      { sks: 3, gradePoint: 0, averageScore: null },
    ]);

    expect(result).toEqual({
      totalSKS: 5,
      totalPoints: 18,
      ipk: 3.6,
      completedCourses: 2,
    });
  });

  it('calculateGPA: should return zero IPK when no completed courses', () => {
    const result = calculateGPA([{ sks: 3, gradePoint: 4.0, averageScore: null }]);

    expect(result).toEqual({
      totalSKS: 0,
      totalPoints: 0,
      ipk: 0,
      completedCourses: 0,
    });
  });
});
