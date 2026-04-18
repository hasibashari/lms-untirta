import { Router } from "express";
import { handleChat } from "./chat.controller.js";
import { authenticateToken } from "../../middlewares/auth.middleware.js";

const router = Router();

// Endpoint /api/v1/chat (di-mount /api/chat di app.js nanti)
router.post("/", authenticateToken, handleChat);

export default router;
