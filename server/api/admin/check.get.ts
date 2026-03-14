export default defineEventHandler(async (event) => {
  if (!verifyAdminSession(event)) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }
  return { authenticated: true };
});
