import { eq } from "drizzle-orm";
import { bills, billItems } from "~~/server/db/schema/sqlite";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Bill ID required" });
  }

  const query = getQuery(event);
  const includeImage = query.includeImage === "1" || query.includeImage === "true";

  const db = useDrizzle();

  const bill = await db
    .select({
      id: bills.id,
      title: bills.title,
      totalAmount: bills.totalAmount,
      createdAt: bills.createdAt,
    })
    .from(bills)
    .where(eq(bills.id, id))
    .get();

  if (!bill) {
    throw createError({ statusCode: 404, statusMessage: "Bill not found" });
  }

  let imageData: string | null = null;
  if (includeImage) {
    const billImage = await db
      .select({ imageData: bills.imageData })
      .from(bills)
      .where(eq(bills.id, id))
      .get();
    imageData = billImage?.imageData || null;
  }

  const items = await db
    .select()
    .from(billItems)
    .where(eq(billItems.billId, id));

  return { ...bill, imageData, items };
});
