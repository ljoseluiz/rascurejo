import crypto from "crypto";
import { prisma } from "./prisma.js";

/**
 * Minimal session implementation using httpOnly cookie.
 * For production, use a store (Redis) and rotate session IDs.
 * 
 * COMPATIBILITY NOTE: In-memory session store added for development mode.
 * This allows /auth/me to return user data when logged in.
 * TODO: Replace with Redis or database-backed sessions in production
 */

// In-memory session store for development (Map<sessionId, userData>)
const sessionStore = new Map();

function hashPassword(password) {
  // Replace with bcrypt in a real deployment
  return crypto.createHash("sha256").update(password).digest("hex");
}

export async function validateUser(username, password) {
  const user = await prisma.users.findUnique({ where: { username } });
  if (!user) return null;
  const candidate = hashPassword(password);
  if (candidate !== user.password_hash) return null;
  return user;
}

export async function createSessionCookie(res, user) {
  // naive session id; prefer signed/opaque token tied to a store
  const sid = crypto.randomBytes(18).toString("hex");
  
  // Store user data in session store (development mode)
  sessionStore.set(sid, {
    id: user.id,
    username: user.username,
    role: user.role,
    createdAt: Date.now(),
  });
  
  res.cookie("session", sid, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 60 * 12, // 12 hours
  });
  return sid;
}

export function clearSessionCookie(res) {
  res.clearCookie("session");
}

export async function getUserFromSession(req) {
  const sid = req.cookies?.session;
  if (!sid) return null;
  
  // Retrieve user from in-memory store
  const userData = sessionStore.get(sid);
  if (!userData) return null;
  
  // Check if session expired (12 hours)
  const maxAge = 1000 * 60 * 60 * 12;
  if (Date.now() - userData.createdAt > maxAge) {
    sessionStore.delete(sid);
    return null;
  }
  
  return userData;
}

// Clear session from store on logout
export function clearSession(sid) {
  if (sid) {
    sessionStore.delete(sid);
  }
}
