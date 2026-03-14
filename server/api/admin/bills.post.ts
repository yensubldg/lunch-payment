import { nanoid } from "nanoid";
import { bills, billItems } from "~~/server/db/schema/sqlite";

export default defineEventHandler(async (event) => {
  requireAdmin(event);

  const body = await readBody(event);
  const { images, manualItems } = body || {};

  let extractedData;

  if (manualItems) {
    // Allow manual entry / editing
    extractedData = manualItems;
  } else if (images && Array.isArray(images) && images.length > 0) {
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

  // Default to storing the first image, or stringify if array
  const imageDataString = images && images.length > 0
    ? JSON.stringify(images.map((img: any) => `data:${img.mimeType || "image/jpeg"};base64,${img.base64}`))
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
