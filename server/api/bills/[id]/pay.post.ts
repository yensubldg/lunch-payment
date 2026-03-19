import { eq } from "drizzle-orm";
import { billItems, bills } from "~~/server/db/schema/sqlite";

function generateOrderCode() {
  const suffix = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return Number(`${Date.now()}${suffix}`);
}

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Bill ID required" });
  }

  const body = await readBody(event);
  const { itemId } = body || {};

  if (!itemId) {
    throw createError({ statusCode: 400, statusMessage: "Item ID required" });
  }

  const db = useDrizzle();

  // Get the bill item
  const item = await db
    .select()
    .from(billItems)
    .where(eq(billItems.id, itemId))
    .get();

  if (!item || item.billId !== id) {
    throw createError({ statusCode: 404, statusMessage: "Item not found" });
  }

  if (item.paymentStatus === "paid") {
    throw createError({
      statusCode: 400,
      statusMessage: "Already paid",
    });
  }

  // Get the bill for title
  const bill = await db.select().from(bills).where(eq(bills.id, id)).get();
  if (!bill) {
    throw createError({ statusCode: 404, statusMessage: "Bill not found" });
  }

  const config = useRuntimeConfig();
  const payos = getPayOS();
  await ensurePayOSWebhookConfigured();

  // Generate a unique order code (PayOS requires positive int up to 9007199254740991).
  let orderCode = 0;
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = generateOrderCode();
    const existingOrder = await db
      .select({ id: billItems.id })
      .from(billItems)
      .where(eq(billItems.paymentOrderCode, candidate))
      .get();

    if (!existingOrder) {
      orderCode = candidate;
      break;
    }
  }

  if (!orderCode) {
    throw createError({
      statusCode: 500,
      statusMessage: "Could not generate unique payment order code",
    });
  }

  const paymentData = {
    orderCode,
    amount: item.amount,
    description: `${item.name} - ${bill.title}`.substring(0, 25),
    cancelUrl: `${config.public.appUrl}/bills/${id}`,
    returnUrl: `${config.public.appUrl}/bills/${id}?paid=${itemId}`,
    items: [
      {
        name: item.name,
        quantity: 1,
        price: item.amount,
      },
    ],
  };

  const paymentLink = await payos.paymentRequests.create(paymentData);

  // Save order code to bill item
  await db
    .update(billItems)
    .set({ paymentOrderCode: orderCode })
    .where(eq(billItems.id, itemId));

  // Build VietQR image URL from PayOS response
  const qrImageUrl = `https://img.vietqr.io/image/${paymentLink.bin}-${paymentLink.accountNumber}-vietqr_pro.jpg?amount=${paymentLink.amount}&addInfo=${encodeURIComponent(paymentLink.description)}`;

  return {
    checkoutUrl: paymentLink.checkoutUrl,
    qrCode: qrImageUrl,
    orderCode,
  };
});
