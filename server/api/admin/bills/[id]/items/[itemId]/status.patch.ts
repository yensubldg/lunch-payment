import { and, eq } from "drizzle-orm";
import { createError, defineEventHandler, getRouterParam, readBody } from "h3";
import { billItems } from "~~/server/db/schema/sqlite";
import { useDrizzle } from "~~/server/utils/drizzle";
import { requireAdmin } from "~~/server/utils/auth";

type PaymentStatus = "pending" | "paid";

export default defineEventHandler(async (event) => {
  requireAdmin(event);

  const billId = getRouterParam(event, "id");
  const itemIdParam = getRouterParam(event, "itemId");
  if (!billId || !itemIdParam) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bill ID and Item ID are required",
    });
  }

  const body = await readBody(event);
  const nextStatus = body?.paymentStatus as PaymentStatus | undefined;

  if (nextStatus !== "pending" && nextStatus !== "paid") {
    throw createError({
      statusCode: 400,
      statusMessage: "paymentStatus must be either pending or paid",
    });
  }

  const itemId = Number(itemIdParam);
  if (!Number.isInteger(itemId) || itemId <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid Item ID",
    });
  }

  const db = useDrizzle();

  const existingItem = await db
    .select()
    .from(billItems)
    .where(and(eq(billItems.id, itemId), eq(billItems.billId, billId)))
    .get();

  if (!existingItem) {
    throw createError({
      statusCode: 404,
      statusMessage: "Item not found",
    });
  }

  const paidAt = nextStatus === "paid" ? new Date() : null;

  await db
    .update(billItems)
    .set({
      paymentStatus: nextStatus,
      paidAt,
    })
    .where(eq(billItems.id, itemId));

  return {
    ok: true,
    itemId,
    paymentStatus: nextStatus,
    paidAt,
  };
});
