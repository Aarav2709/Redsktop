import express from "express";

// OAuth endpoints are disabled in read-only mode; keep a stub for compatibility.
const router = express.Router();

router.all("*", (_req, res) => {
  res.status(410).json({ error: "Authentication disabled in read-only mode" });
});

export default router;
