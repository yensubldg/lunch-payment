export default defineEventHandler(async (event) => {
  deleteCookie(event, "admin_session_token", {
    path: "/",
  });
  return { success: true };
});
