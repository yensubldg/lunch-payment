import { normalizeAndValidateImages } from "~~/server/utils/image-input";

export default defineEventHandler(async (event) => {
  requireAdmin(event);

  const body = await readBody(event);
  const images = normalizeAndValidateImages(body?.images);

  const result = await extractBillsFromImages(images);
  return result;
});
