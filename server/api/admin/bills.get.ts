import { desc, inArray } from "drizzle-orm";
import { bills, billItems } from "~~/server/db/schema/sqlite";

export default defineEventHandler(async (event) => {
  requireAdmin(event);

  const db = useDrizzle();
  const allBills = await db
    .select({
      id: bills.id,
      title: bills.title,
      totalAmount: bills.totalAmount,
      createdAt: bills.createdAt,
    })
    .from(bills)
    .orderBy(desc(bills.createdAt));

  if (allBills.length === 0) {
    return [];
  }

  const billIds = allBills.map((bill) => bill.id);
  const allItems = await db
    .select()
    .from(billItems)
    .where(inArray(billItems.billId, billIds));

  const itemsByBillId = allItems.reduce<Record<string, typeof allItems>>((acc, item) => {
    const items = acc[item.billId] || [];
    items.push(item);
    acc[item.billId] = items;
    return acc;
  }, {});

  const result = allBills.map((bill) => ({
    ...bill,
    items: itemsByBillId[bill.id] || [],
  }));

  return result;
});
