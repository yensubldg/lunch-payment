import { H3Event } from "h3";

const ADMIN_TOKEN_KEY = "admin_session_token";
// Simple token - in production use JWT
const VALID_TOKEN = "lunch-payment-admin-session-2024";

export function setAdminSession(event: H3Event): string {
  setCookie(event, ADMIN_TOKEN_KEY, VALID_TOKEN, {
    httpOnly: true,
    secure: false,
    maxAge: 60 * 60 * 24, // 24 hours
    path: "/",
  });
  return VALID_TOKEN;
}

export function verifyAdminSession(event: H3Event): boolean {
  const token = getCookie(event, ADMIN_TOKEN_KEY);
  return token === VALID_TOKEN;
}

export function requireAdmin(event: H3Event): void {
  if (!verifyAdminSession(event)) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }
}
