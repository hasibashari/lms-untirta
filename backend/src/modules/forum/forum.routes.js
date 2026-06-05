import express from 'express';
import { authenticateToken } from '../../middlewares/auth.middleware.js';
import { authorizeRole } from '../../middlewares/authorize.middleware.js';
import validate from '../../middlewares/validate.middleware.js';
import {
  getThreads,
  createThread,
  getThreadById,
  updateThread,
  deleteThread,
  togglePinThread,
  createReply,
  updateReply,
  deleteReply,
} from './forum.controller.js';
import {
  updateThreadSchema,
  createReplySchema,
  updateReplySchema,
  createThreadSchema,
} from './forum.validation.js';

// Router untuk thread-level endpoints
// Dipasang di: /api/forum
export const forumRouter = express.Router();

/**
 * @swagger
 * /api/forum/class/{classId}:
 *   get:
 *     summary: Mendapatkan semua thread diskusi dalam kelas
 *     tags: [Forum]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID Kelas (UUID)
 *     responses:
 *       200:
 *         description: Daftar thread diskusi berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           title:
 *                             type: string
 *                           content:
 *                             type: string
 *                           isPinned:
 *                             type: boolean
 *                           classId:
 *                             type: string
 *                             format: uuid
 *                           authorId:
 *                             type: string
 *                             format: uuid
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           author:
 *                             type: object
 *                             properties:
 *                               name:
 *                                 type: string
 *                               role:
 *                                 type: string
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *
 *   post:
 *     summary: Membuat thread diskusi baru dalam kelas
 *     tags: [Forum]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID Kelas (UUID)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, content]
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 3
 *                 example: "Diskusi tentang Tugas 1"
 *               content:
 *                 type: string
 *                 minLength: 10
 *                 example: "Bagian manakah dari materi Swagger yang belum dipahami?"
 *     responses:
 *       201:
 *         description: Thread diskusi berhasil dibuat
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         $ref: '#/components/responses/ValidationFailed'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
forumRouter.get('/class/:classId', authenticateToken, authorizeRole('DOSEN', 'MAHASISWA'), getThreads);
forumRouter.post('/class/:classId', authenticateToken, authorizeRole('DOSEN', 'MAHASISWA'), validate(createThreadSchema), createThread);

/**
 * @swagger
 * /api/forum/threads/{threadId}:
 *   get:
 *     summary: Mendapatkan detail thread diskusi beserta komentar/balasannya
 *     tags: [Forum]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: threadId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID Thread Diskusi (UUID)
 *     responses:
 *       200:
 *         description: Detail thread berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         title:
 *                           type: string
 *                         content:
 *                           type: string
 *                         isPinned:
 *                           type: boolean
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                         author:
 *                           type: object
 *                         replies:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                                 format: uuid
 *                               content:
 *                                 type: string
 *                               createdAt:
 *                                 type: string
 *                                 format: date-time
 *                               author:
 *                                 type: object
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *
 *   put:
 *     summary: Mengubah thread diskusi
 *     tags: [Forum]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: threadId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID Thread Diskusi (UUID)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 3
 *                 example: "Diskusi tentang Tugas 1 (Updated)"
 *               content:
 *                 type: string
 *                 minLength: 10
 *                 example: "Bagian manakah dari materi Swagger yang belum dipahami? Diupdate..."
 *     responses:
 *       200:
 *         description: Thread berhasil diubah
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         $ref: '#/components/responses/ValidationFailed'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *
 *   delete:
 *     summary: Menghapus thread diskusi
 *     tags: [Forum]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: threadId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID Thread Diskusi (UUID)
 *     responses:
 *       200:
 *         description: Thread berhasil dihapus
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
forumRouter.get('/threads/:threadId', authenticateToken, authorizeRole('DOSEN', 'MAHASISWA'), getThreadById);
forumRouter.put('/threads/:threadId', authenticateToken, authorizeRole('DOSEN', 'MAHASISWA'), validate(updateThreadSchema), updateThread);
forumRouter.delete('/threads/:threadId', authenticateToken, authorizeRole('DOSEN', 'MAHASISWA'), deleteThread);

/**
 * @swagger
 * /api/forum/threads/{threadId}/pin:
 *   patch:
 *     summary: Menyematkan (pin) atau melepaskan (unpin) thread diskusi
 *     tags: [Forum]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: threadId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID Thread Diskusi (UUID)
 *     responses:
 *       200:
 *         description: Status pin berhasil diubah
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
forumRouter.patch('/threads/:threadId/pin', authenticateToken, authorizeRole('DOSEN', 'MAHASISWA'), togglePinThread);

/**
 * @swagger
 * /api/forum/threads/{threadId}/replies:
 *   post:
 *     summary: Membuat komentar / balasan baru pada thread diskusi
 *     tags: [Forum]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: threadId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID Thread Diskusi (UUID)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content:
 *                 type: string
 *                 minLength: 1
 *                 example: "Saya kurang paham bagian mounting SSL Nginx."
 *               parentId:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *                 description: "ID balasan parent (opsional, jika membalas komentar lain)"
 *     responses:
 *       201:
 *         description: Balasan berhasil dibuat
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         $ref: '#/components/responses/ValidationFailed'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
forumRouter.post('/threads/:threadId/replies', authenticateToken, authorizeRole('DOSEN', 'MAHASISWA'), validate(createReplySchema), createReply);

/**
 * @swagger
 * /api/forum/replies/{replyId}:
 *   put:
 *     summary: Mengubah komentar / balasan diskusi
 *     tags: [Forum]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: replyId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID Balasan (UUID)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content:
 *                 type: string
 *                 minLength: 1
 *                 example: "Jawaban diperbarui: silakan cek volume docker."
 *     responses:
 *       200:
 *         description: Balasan berhasil diubah
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         $ref: '#/components/responses/ValidationFailed'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *
 *   delete:
 *     summary: Menghapus komentar / balasan diskusi
 *     tags: [Forum]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: replyId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID Balasan (UUID)
 *     responses:
 *       200:
 *         description: Balasan berhasil dihapus
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
forumRouter.put('/replies/:replyId', authenticateToken, authorizeRole('DOSEN', 'MAHASISWA'), validate(updateReplySchema), updateReply);
forumRouter.delete('/replies/:replyId', authenticateToken, authorizeRole('DOSEN', 'MAHASISWA'), deleteReply);


