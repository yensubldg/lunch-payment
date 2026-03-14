import { eq } from "drizzle-orm";
import { bills, billItems } from "~~/server/db/schema/sqlite";

export default defineEventHandler(async (event) => {
  requireAdmin(event);

  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Bill ID required" });
  }

  const db = useDrizzle();

  // Ensure the bill exists
  const existingBill = await db.select().from(bills).where(eq(bills.id, id)).get();
  if (!existingBill) {
    throw createError({ statusCode: 404, statusMessage: "Bill not found" });
  }

  // Delete associated items first due to foreign key constraints (if any)
  await db.delete(billItems).where(eq(billItems.billId, id));
  
  // Delete the bill
  await db.delete(bills).where(eq(bills.id, id));

  return { success: true, message: "Bill deleted successfully" };
});
