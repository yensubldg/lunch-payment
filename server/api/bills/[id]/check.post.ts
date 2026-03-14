import { eq } from "drizzle-orm";
import { billItems } from "~~/server/db/schema/sqlite";

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

  const item = await db
    .select()
    .from(billItems)
    .where(eq(billItems.id, itemId))
    .get();

  if (!item || item.billId !== id) {
    throw createError({ statusCode: 404, statusMessage: "Item not found" });
  }

  // Already paid in DB
  if (item.paymentStatus === "paid") {
    return { status: "paid" };
  }

  // No payment order yet
  if (!item.paymentOrderCode) {
    return { status: "pending" };
  }

  // Check with PayOS API
  try {
    const payos = getPayOS();
    const paymentInfo = await payos.paymentRequests.get(item.paymentOrderCode);

    if (paymentInfo.status === "PAID") {
      // Update DB
      await db
        .update(billItems)
        .set({
          paymentStatus: "paid",
          paidAt: new Date(),
        })
        .where(eq(billItems.id, item.id));

      return { status: "paid" };
    }

    return { status: paymentInfo.status.toLowerCase() };
  } catch (e) {
    console.error("PayOS status check error:", e);
    return { status: "pending" };
  }
});
