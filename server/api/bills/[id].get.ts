import { eq } from "drizzle-orm";
import { bills, billItems } from "~~/server/db/schema/sqlite";
import { reconcilePendingPayments } from "~~/server/utils/payos-sync";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Bill ID required" });
  }

  const db = useDrizzle();

  const bill = await db.select().from(bills).where(eq(bills.id, id)).get();
  if (!bill) {
    throw createError({ statusCode: 404, statusMessage: "Bill not found" });
  }

  await reconcilePendingPayments({ billId: id });

  const items = await db
    .select()
    .from(billItems)
    .where(eq(billItems.billId, id));

  return { ...bill, items };
});
