import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { supabase } from "@/lib/db";
import { UserRow } from "@/lib/types";

const cookieName = "bolao_session";
const encoder = new TextEncoder();

function secretKey() {
  const secret = process.env.AUTH_SECRET || process.env.ADMIN_PASSWORD || process.env.ADMIN_INITIAL_PASSWORD;
  if (!secret || secret.length < 24) {
    throw new Error("AUTH_SECRET must have at least 24 characters");
  }
  return encoder.encode(secret);
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(user: Pick<UserRow, "id" | "username" | "role">) {
  const token = await new SignJWT({ username: user.username, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("14d")
    .sign(secretKey());

  const cookieStore = await cookies();

  cookieStore.set(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(cookieName);
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(cookieName)?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secretKey());
    return {
      id: payload.sub as string,
      username: payload.username as string,
      role: payload.role as "admin" | "user",
    };
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;

  const { data } = await supabase
    .from("users")
    .select("id, username, role, created_at, password_hash")
    .eq("id", session.id)
    .single();

  return data as UserRow | null;
}

export async function ensureAdminSeeded() {
  const username = process.env.ADMIN_USERNAME;
  const initialPassword = process.env.ADMIN_INITIAL_PASSWORD || process.env.ADMIN_PASSWORD;

  if (!username || !initialPassword) return;

  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (existing) return;

  await supabase.from("users").insert({
    username,
    password_hash: await hashPassword(initialPassword),
    role: "admin",
  });
}
