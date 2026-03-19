import { createError, defineEventHandler, readBody } from "h3";
import { requireAdmin } from "~~/server/utils/auth";
import { reconcilePendingPayments } from "~~/server/utils/payos-sync";

export default defineEventHandler(async (event) => {
  requireAdmin(event);

  const body = await readBody(event);
  const billIdRaw = body?.billId;

  if (billIdRaw !== undefined && typeof billIdRaw !== "string") {
    throw createError({
      statusCode: 400,
      statusMessage: "billId must be a string",
    });
  }

  const billId = billIdRaw?.trim() || undefined;
  const result = await reconcilePendingPayments({ billId });

  return {
    ok: true,
    scope: billId ? "bill" : "all",
    billId: billId || null,
    ...result,
  };
});
