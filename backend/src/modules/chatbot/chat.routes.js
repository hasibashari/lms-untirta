import { Router } from "express";
import { handleChat } from "./chat.controller.js";
import { authenticateToken } from "../../middlewares/auth.middleware.js";

const router = Router();

/**
 * @swagger
 * /api/chat:
 *   post:
 *     summary: Kirim pesan / pertanyaan ke chatbot AI UntirtaBot (Gemini)
 *     tags: [Chatbot]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [message]
 *             properties:
 *               message:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 1000
 *                 example: "Apakah saya memiliki tugas yang mendekati deadline?"
 *                 description: "Pesan atau pertanyaan dari pengguna"
 *     responses:
 *       200:
 *         description: Respon dari chatbot berhasil didapatkan
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         reply:
 *                           type: string
 *                           example: "Halo Budi, Anda memiliki satu tugas 'Implementasi Swagger' untuk mata kuliah IF-101 yang tenggat waktunya besok."
 *       400:
 *         $ref: '#/components/responses/ValidationFailed'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post("/", authenticateToken, handleChat);

export default router;
