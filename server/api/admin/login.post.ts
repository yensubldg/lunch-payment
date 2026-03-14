export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const body = await readBody(event);

  const { username, password } = body || {};

  if (username !== config.adminUsername || password !== config.adminPassword) {
    throw createError({
      statusCode: 401,
      statusMessage: "Invalid credentials",
    });
  }

  const token = setAdminSession(event);
  return { success: true, token };
});
