/**
 * Forum API — Integration Tests
 */

import { jest, describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import { cleanDatabase } from '../helpers/db.js';
import { createAdmin, createDosen, createMahasiswa } from '../helpers/auth.js';
import prisma from '../../src/config/prisma.js';
import { getApp } from '../helpers/request.js';

const app = getApp();
const COURSE_API = '/api/courses';
const FORUM_API = '/api/forum';

describe('Forum API', () => {
  let adminToken, teacherToken, otherTeacherToken, mhsToken, otherMhsToken;
  let teacherUser, otherTeacherUser, mhsUser, otherMhsUser;
  let course, thread, reply;

  beforeAll(async () => {
    await cleanDatabase();
    
    // Create users
    const admin = await createAdmin();
    const teacher = await createDosen();
    const otherTeacher = await createDosen();
    const mhs = await createMahasiswa();
    const otherMhs = await createMahasiswa();
    
    adminToken = admin.token;
    teacherToken = teacher.token;
    otherTeacherToken = otherTeacher.token;
    mhsToken = mhs.token;
    otherMhsToken = otherMhs.token;
    
    teacherUser = teacher.user;
    otherTeacherUser = otherTeacher.user;
    mhsUser = mhs.user;
    otherMhsUser = otherMhs.user;

    // Create Course
    course = await prisma.course.create({
      data: {
        title: 'Forum Test Course',
        code: 'FORUM101',
        semester: 1,
        sks: 3,
        teacherId: teacherUser.id
      }
    });

    // Enroll mhs into course
    await prisma.enrollment.create({
      data: {
        userId: mhsUser.id,
        courseId: course.id
      }
    });

    // Create a Thread
    thread = await prisma.forumThread.create({
      data: {
        title: 'Welcome to the forum',
        content: 'Let\'s discuss everything here.',
        courseId: course.id,
        authorId: teacherUser.id
      }
    });

    // Create a Reply
    reply = await prisma.forumReply.create({
      data: {
        content: 'Thanks, prof!',
        threadId: thread.id,
        authorId: mhsUser.id
      }
    });
  });

  afterAll(async () => {
    await cleanDatabase();
  });

  describe('Thread Access Control (GET/POST /api/courses/:id/forum)', () => {
    it('should allow teacher of the course to get threads', async () => {
      const res = await request(app)
        .get(`${COURSE_API}/${course.id}/forum`)
        .set('Authorization', `Bearer ${teacherToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBe(1);
    });

    it('should allow enrolled student to get threads', async () => {
      const res = await request(app)
        .get(`${COURSE_API}/${course.id}/forum`)
        .set('Authorization', `Bearer ${mhsToken}`);
      
      expect(res.status).toBe(200);
    });

    it('should deny access to non-enrolled student', async () => {
      const res = await request(app)
        .get(`${COURSE_API}/${course.id}/forum`)
        .set('Authorization', `Bearer ${otherMhsToken}`);
      
      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/belum terdaftar/);
    });

    it('should deny access to other teacher', async () => {
      const res = await request(app)
        .get(`${COURSE_API}/${course.id}/forum`)
        .set('Authorization', `Bearer ${otherTeacherToken}`);
      
      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/bukan mata kuliah Anda/);
    });

    it('should allow enrolled student to create a thread', async () => {
      const res = await request(app)
        .post(`${COURSE_API}/${course.id}/forum`)
        .set('Authorization', `Bearer ${mhsToken}`)
        .send({
          title: 'Student Question',
          content: 'How do I do X?'
        });
      
      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe('Student Question');
    });
  });

  describe('Thread Detail & Moderation (GET/PUT/DELETE /api/forum/threads/:id)', () => {
    it('should get thread detail with replies', async () => {
      const res = await request(app)
        .get(`${FORUM_API}/threads/${thread.id}`)
        .set('Authorization', `Bearer ${mhsToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe(thread.title);
      expect(res.body.data.replies.length).toBeGreaterThanOrEqual(1);
    });

    it('should allow author to update thread', async () => {
      const res = await request(app)
        .put(`${FORUM_API}/threads/${thread.id}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          title: 'Updated Title',
          content: 'Updated Content'
        });
      
      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Updated Title');
    });

    it('should deny update to non-author', async () => {
      const res = await request(app)
        .put(`${FORUM_API}/threads/${thread.id}`)
        .set('Authorization', `Bearer ${mhsToken}`)
        .send({ title: 'Hack' });
      
      expect(res.status).toBe(403);
    });

    it('should allow teacher to pin/unpin thread', async () => {
      const res = await request(app)
        .patch(`${FORUM_API}/threads/${thread.id}/pin`)
        .set('Authorization', `Bearer ${teacherToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.data.isPinned).toBe(true);
    });

    it('should allow admin to delete any thread', async () => {
      // Create a temporary thread to delete
      const tempThread = await prisma.forumThread.create({
        data: { title: 'To Delete', content: '...', courseId: course.id, authorId: mhsUser.id }
      });

      const res = await request(app)
        .delete(`${FORUM_API}/threads/${tempThread.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.status).toBe(200);
    });
  });

  describe('Reply Operations', () => {
    it('should allow creating a reply', async () => {
      const res = await request(app)
        .post(`${FORUM_API}/threads/${thread.id}/replies`)
        .set('Authorization', `Bearer ${mhsToken}`)
        .send({ content: 'Another reply' });
      
      expect(res.status).toBe(201);
      expect(res.body.data.content).toBe('Another reply');
    });

    it('should allow author to edit reply', async () => {
      const res = await request(app)
        .put(`${FORUM_API}/replies/${reply.id}`)
        .set('Authorization', `Bearer ${mhsToken}`)
        .send({ content: 'Edited reply content' });
      
      expect(res.status).toBe(200);
      expect(res.body.data.content).toBe('Edited reply content');
    });

    it('should allow teacher to delete any reply (moderation)', async () => {
      const res = await request(app)
        .delete(`${FORUM_API}/replies/${reply.id}`)
        .set('Authorization', `Bearer ${teacherToken}`);
      
      expect(res.status).toBe(200);
    });
  });

  describe('Error Scenarios', () => {
    it('should return 404 for non-existent course in forum access', async () => {
      const res = await request(app)
        .get(`${COURSE_API}/00000000-0000-0000-0000-000000000000/forum`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });

    it('should return 404 for non-existent thread', async () => {
      const res = await request(app)
        .get(`${FORUM_API}/threads/00000000-0000-0000-0000-000000000000`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.status).toBe(404);
    });

    it('should return 404 for non-existent reply', async () => {
      const res = await request(app)
        .delete(`${FORUM_API}/replies/00000000-0000-0000-0000-000000000000`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.status).toBe(404);
    });

    it('should return 403 when student tries to pin thread', async () => {
      const res = await request(app)
        .patch(`${FORUM_API}/threads/${thread.id}/pin`)
        .set('Authorization', `Bearer ${mhsToken}`);
      expect(res.status).toBe(403);
    });

    it('should return 403 when student tries to delete others thread', async () => {
      const otherThread = await prisma.forumThread.create({
        data: { title: 'Others Thread', content: 'Some content here...', courseId: course.id, authorId: teacherUser.id }
      });
      const res = await request(app)
        .delete(`${FORUM_API}/threads/${otherThread.id}`)
        .set('Authorization', `Bearer ${otherMhsToken}`);
      expect(res.status).toBe(403);
    });

    it('should return 403 when student tries to edit others reply', async () => {
      const tempReply = await prisma.forumReply.create({
        data: { content: 'Original content', threadId: thread.id, authorId: teacherUser.id }
      });
      const res = await request(app)
        .put(`${FORUM_API}/replies/${tempReply.id}`)
        .set('Authorization', `Bearer ${otherMhsToken}`)
        .send({ content: 'I hack you' });
      expect(res.status).toBe(403);
    });

    it('should return 403 when other student tries to delete reply', async () => {
      // Create a specific reply for this test
      const tempReply = await prisma.forumReply.create({
        data: { content: 'To be deleted', threadId: thread.id, authorId: mhsUser.id }
      });
      const res = await request(app)
        .delete(`${FORUM_API}/replies/${tempReply.id}`)
        .set('Authorization', `Bearer ${otherMhsToken}`);
      expect(res.status).toBe(403);
    });

    it('should return 404 when creating reply to non-existent thread', async () => {
      const res = await request(app)
        .post(`${FORUM_API}/threads/00000000-0000-0000-0000-000000000000/replies`)
        .set('Authorization', `Bearer ${mhsToken}`)
        .send({ content: 'Halo' });
      expect(res.status).toBe(404);
    });

    it('should return 404 when updating non-existent thread', async () => {
      const res = await request(app)
        .put(`${FORUM_API}/threads/00000000-0000-0000-0000-000000000000`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'New Valid Title', content: 'New Valid Long Content' });
      expect(res.status).toBe(404);
    });
  });
});
