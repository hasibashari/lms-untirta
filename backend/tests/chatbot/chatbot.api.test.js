/**
 * Chatbot API — Integration Tests
 *
 * Tests the Chatbot module interaction with Gemini and Database Context.
 * We mock Gemini API to avoid costs and external dependency issues.
 */

import { jest, describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import { cleanDatabase } from '../helpers/db.js';
import { createAdmin, createDosen, createMahasiswa } from '../helpers/auth.js';
import prisma from '../../src/config/prisma.js';

// 1. Mock Gemini service BEFORE importing app
jest.unstable_mockModule('../../src/modules/chatbot/gemini.service.js', () => ({
  generateChatResponse: jest.fn(),
}));

// 2. Dynamic imports
const { generateChatResponse } = await import('../../src/modules/chatbot/gemini.service.js');
const { getApp } = await import('../helpers/request.js');

const app = getApp();
const API = '/api/chat';

describe('Chatbot API', () => {
  let adminToken, dosenToken, mhsToken, mhsUser, dosenUser;

  beforeAll(async () => {
    await cleanDatabase();
    
    // Create users
    const admin = await createAdmin();
    const dosen = await createDosen();
    const mhs = await createMahasiswa();
    
    adminToken = admin.token;
    dosenToken = dosen.token;
    mhsToken = mhs.token;
    
    mhsUser = mhs.user;
    dosenUser = dosen.user;

    // Seed some data for context
    const course = await prisma.course.create({
      data: {
        title: 'Algoritma Pemrograman',
        code: 'CS101',
        description: 'Belajar dasar pemrograman',
        semester: 1,
        sks: 3,
        teacherId: dosenUser.id
      }
    });

    const semester = await prisma.academicSemester.create({
      data: {
        academicYear: '2025/2026',
        semesterType: 'GANJIL',
        status: 'OPEN'
      }
    });

    const cls = await prisma.class.create({
      data: {
        courseId: course.id,
        lecturerId: dosenUser.id,
        academicSemesterId: semester.id,
        section: 'A',
        room: 'Lab Komputer 1',
        schedule: 'Senin, 08:00 - 10:30'
      }
    });

    await prisma.krsEnrollment.create({
      data: {
        studentId: mhsUser.id,
        classId: cls.id,
        status: 'APPROVED'
      }
    });

    await prisma.material.create({
      data: {
        courseId: course.id,
        title: 'Pengenalan Python',
        content: 'Python adalah bahasa pemrograman populer...',
        order: 1,
        isPublished: true
      }
    });

    const assignment = await prisma.assignment.create({
      data: {
        courseId: course.id,
        title: 'Tugas 1: Hello World',
        dueDate: new Date(Date.now() + 86400000), // Tomorrow
      }
    });

    await prisma.submission.create({
      data: {
        assignmentId: assignment.id,
        studentId: mhsUser.id,
        note: 'print("Hello World")',
      }
    });
  });

  afterAll(async () => {
    await cleanDatabase();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Auth & Validation', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await request(app)
        .post(API)
        .send({ message: 'Halo' });
      
      expect(res.status).toBe(401);
    });

    it('should return 400 when message is empty', async () => {
      const res = await request(app)
        .post(API)
        .set('Authorization', `Bearer ${mhsToken}`)
        .send({ message: '' });
      
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Validasi gagal');
    });

    it('should return 400 when message is too long', async () => {
      const longMessage = 'a'.repeat(1001);
      const res = await request(app)
        .post(API)
        .set('Authorization', `Bearer ${mhsToken}`)
        .send({ message: longMessage });
      
      expect(res.status).toBe(400);
    });
  });

  describe('Chat Functionality', () => {
    it('should successfully process student chat with context', async () => {
      const mockReply = 'Halo! Kamu terdaftar di kelas Algoritma Pemrograman.';
      generateChatResponse.mockResolvedValue(mockReply);

      const res = await request(app)
        .post(API)
        .set('Authorization', `Bearer ${mhsToken}`)
        .send({ message: 'Apa kelas saya?' });

      expect(res.status).toBe(200);
      expect(res.body.data.reply).toBe(mockReply);
      expect(generateChatResponse).toHaveBeenCalledWith(expect.stringContaining('Algoritma Pemrograman'));
      expect(generateChatResponse).toHaveBeenCalledWith(expect.stringContaining(mhsUser.name));
    });

    it('should successfully process lecturer chat with context', async () => {
      const mockReply = 'Halo Dosen! Anda mengajar kelas Algoritma Pemrograman.';
      generateChatResponse.mockResolvedValue(mockReply);

      const res = await request(app)
        .post(API)
        .set('Authorization', `Bearer ${dosenToken}`)
        .send({ message: 'Apa jadwal mengajar saya?' });

      expect(res.status).toBe(200);
      expect(res.body.data.reply).toBe(mockReply);
      expect(generateChatResponse).toHaveBeenCalledWith(expect.stringContaining('KelasYangDiajarDosen'));
      expect(generateChatResponse).toHaveBeenCalledWith(expect.stringContaining(dosenUser.name));
    });

    it('should include course catalog when asked', async () => {
      generateChatResponse.mockResolvedValue('Berikut daftar mata kuliah...');

      await request(app)
        .post(API)
        .set('Authorization', `Bearer ${mhsToken}`)
        .send({ message: 'Daftar mata kuliah apa saja?' });

      expect(generateChatResponse).toHaveBeenCalledWith(expect.stringContaining('KatalogLMS'));
      expect(generateChatResponse).toHaveBeenCalledWith(expect.stringContaining('CS101'));
    });
  });

  describe('Error Handling', () => {
    it('should return 500 when Gemini service fails', async () => {
      generateChatResponse.mockRejectedValue(new Error('Gemini API Error'));

      const res = await request(app)
        .post(API)
        .set('Authorization', `Bearer ${mhsToken}`)
        .send({ message: 'Halo' });

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Gemini API Error');
    });

    it('should return 200 for admin (guest context) if Gemini succeeds', async () => {
      generateChatResponse.mockResolvedValue('Halo Admin!');

      const res = await request(app)
        .post(API)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ message: 'Halo' });

      expect(res.status).toBe(200);
      expect(res.body.data.reply).toBe('Halo Admin!');
    });
  });
});
