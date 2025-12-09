import crypto from "crypto";
import { prisma } from "./prisma.js";

/**
 * Minimal session implementation using httpOnly cookie.
 * For production, use a store (Redis) and rotate session IDs.
 */

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
  // In production, persist session <sid, userId, expiry> in a store
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
  // For demo purposes sid is not persisted. Assume user id in header? Not safe.
  // Here we’ll just return null unless future enhancement binds sid to store.
  return null;
}