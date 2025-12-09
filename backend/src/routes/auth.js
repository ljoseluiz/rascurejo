import express from "express";
import { validateUser, createSessionCookie, clearSessionCookie, getUserFromSession } from "../lib/auth.js";

const router = express.Router();

// POST /auth/login
router.post("/login", async (req, res, next) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      const err = new Error("username and password are required");
      err.status = 400;
      err.code = "BAD_REQUEST";
      throw err;
    }
    const user = await validateUser(username, password);
    if (!user) {
      const err = new Error("Invalid credentials");
      err.status = 401;
      err.code = "INVALID_CREDENTIALS";
      throw err;
    }
    await createSessionCookie(res, user);
    const csrfToken = req.csrf.issue();
    res.json({
      user: { id: user.id, username: user.username, role: user.role },
      csrfToken,
    });
  } catch (err) {
    next(err);
  }
});

// GET /auth/csrf
router.get("/csrf", async (req, res, next) => {
  try {
    const csrfToken = req.csrf.issue();
    res.json({ csrfToken });
  } catch (err) {
    next(err);
  }
});

// GET /auth/me
router.get("/me", async (req, res, next) => {
  try {
    // In a real impl, resolve user from session store
    const user = await getUserFromSession(req);
    if (!user) {
      return res.json({ user: null });
    }
    res.json({ user: { id: user.id, username: user.username, role: user.role } });
  } catch (err) {
    next(err);
  }
});

// POST /auth/logout
router.post("/logout", async (req, res, next) => {
  try {
    clearSessionCookie(res);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;