import { eq } from "drizzle-orm";
import { billItems } from "~~/server/db/schema/sqlite";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const payos = getPayOS();

  // Verify webhook data from PayOS
  let webhookData;
  try {
    webhookData = await payos.webhooks.verify(body);
  } catch (e) {
    console.error("Webhook verification failed:", e);
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid webhook data",
    });
  }

  // webhookData contains: orderCode, amount, description, accountNumber, reference, transactionDateTime, etc.
  const { orderCode } = webhookData;

  if (!orderCode) {
    return { success: true }; // Acknowledge but skip if no order code
  }

  const db = useDrizzle();

  // Find the bill item by order code
  const item = await db
    .select()
    .from(billItems)
    .where(eq(billItems.paymentOrderCode, Number(orderCode)))
    .get();

  if (item && item.paymentStatus !== "paid") {
    // Update payment status
    await db
      .update(billItems)
      .set({
        paymentStatus: "paid",
        paidAt: new Date(),
      })
      .where(eq(billItems.id, item.id));

    console.log(
      `Payment confirmed: Item ${item.id} (${item.name}) - ${item.amount} VND`
    );
  }

  return { success: true };
});
