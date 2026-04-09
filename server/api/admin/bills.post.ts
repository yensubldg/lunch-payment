import { nanoid } from "nanoid";
import { bills, billItems } from "~~/server/db/schema/sqlite";
import { normalizeAndValidateImages } from "~~/server/utils/image-input";

export default defineEventHandler(async (event) => {
  requireAdmin(event);

  const body = await readBody(event);
  const { images: rawImages, manualItems } = body || {};

  const images = Array.isArray(rawImages) && rawImages.length > 0
    ? normalizeAndValidateImages(rawImages)
    : [];

  let extractedData;

  if (manualItems) {
    // Allow manual entry / editing
    extractedData = manualItems;
  } else if (images.length > 0) {
    // Use GenAI to extract bill data from image
    extractedData = await extractBillsFromImages(images);
  } else {
    throw createError({
      statusCode: 400,
      statusMessage: "Images or manual items required",
    });
  }

  const db = useDrizzle();
  const billId = nanoid(10);

  // Store only the first image to avoid large payloads in API responses.
  const firstImage = images[0];
  const imageDataString = firstImage
    ? `data:${firstImage.mimeType};base64,${firstImage.base64}`
    : null;

  // Insert bill
  await db.insert(bills).values({
    id: billId,
    title: extractedData.title || "Cơm trưa",
    imageData: imageDataString,
    totalAmount: extractedData.totalAmount || 0,
  });

  // Insert bill items
  if (extractedData.items && extractedData.items.length > 0) {
    await db.insert(billItems).values(
      extractedData.items.map((item: { name: string; amount: number }) => ({
        billId,
        name: item.name,
        amount: item.amount,
        paymentStatus: "pending",
      }))
    );
  }

  const config = useRuntimeConfig();
  const publicUrl = `${config.public.appUrl}/bills/${billId}`;

  return {
    billId,
    publicUrl,
    bill: extractedData,
  };
});
