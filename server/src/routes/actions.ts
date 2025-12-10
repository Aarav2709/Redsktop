import express from "express";
import { extractToken, verifyToken } from "../lib/auth.js";

const router = express.Router();

const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const token = extractToken(req.header("authorization"));
  const session = token ? verifyToken(token) : null;
  if (!session) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  (req as express.Request & { user?: { username: string } }).user = { username: session.username };
  next();
};

router.post("/vote", requireAuth, (req, res) => {
  const { id, direction } = req.body as { id?: string; direction?: "up" | "down" };
  if (!id || !direction) {
    res.status(400).json({ error: "Missing id or direction" });
    return;
  }
  res.json({ status: "ok", action: "vote", id, direction });
});

router.post("/save", requireAuth, (req, res) => {
  const { id } = req.body as { id?: string };
  if (!id) {
    res.status(400).json({ error: "Missing id" });
    return;
  }
  res.json({ status: "ok", action: "save", id });
});

export default router;
