import express from "express";

// Write actions are disabled in read-only mode; keep endpoints dormant.
const router = express.Router();

router.all("*", (_req, res) => {
  res.status(410).json({ error: "Actions disabled in read-only mode" });
});

export default router;
