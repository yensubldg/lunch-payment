export default defineEventHandler(async (event) => {
  requireAdmin(event);

  const body = await readBody(event);
  const { images } = body || {};

  if (!images || !Array.isArray(images) || images.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "Images array required",
    });
  }

  const result = await extractBillsFromImages(images);
  return result;
});
