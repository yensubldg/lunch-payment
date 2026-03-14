import { eq, desc } from "drizzle-orm";
import { bills, billItems } from "~~/server/db/schema/sqlite";

export default defineEventHandler(async (event) => {
  requireAdmin(event);

  const db = useDrizzle();
  const allBills = await db.select().from(bills).orderBy(desc(bills.createdAt));

  // Get items for each bill
  const result = await Promise.all(
    allBills.map(async (bill) => {
      const items = await db
        .select()
        .from(billItems)
        .where(eq(billItems.billId, bill.id));
      return { ...bill, items };
    })
  );

  return result;
});
