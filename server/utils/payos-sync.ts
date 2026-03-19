import { eq } from "drizzle-orm";
import { billItems } from "~~/server/db/schema/sqlite";
import { useDrizzle } from "~~/server/utils/drizzle";
import { getPayOS } from "~~/server/utils/payos";

type SyncOptions = {
  billId?: string;
};

type SyncResult = {
  checked: number;
  synced: number;
  failed: number;
  unchanged: number;
};

export async function reconcilePendingPayments(
  options: SyncOptions = {}
): Promise<SyncResult> {
  const db = useDrizzle();
  const payos = getPayOS();

  const baseItems = options.billId
    ? await db.select().from(billItems).where(eq(billItems.billId, options.billId))
    : await db.select().from(billItems);

  const pendingItems = baseItems.filter(
    (item) => item.paymentStatus !== "paid" && !!item.paymentOrderCode
  );

  let synced = 0;
  let failed = 0;

  // Keep reconciliation sequential to avoid intermittent API rate/connection issues.
  for (const item of pendingItems) {
    try {
      const paymentInfo = await payos.paymentRequests.get(Number(item.paymentOrderCode));

      if (paymentInfo.status === "PAID") {
        await db
          .update(billItems)
          .set({
            paymentStatus: "paid",
            paidAt: new Date(),
          })
          .where(eq(billItems.id, item.id));
        synced += 1;
      }
    } catch (error) {
      failed += 1;
      console.warn(
        `[PayOS] Failed to reconcile order ${item.paymentOrderCode}:`,
        error
      );
    }
  }

  return {
    checked: pendingItems.length,
    synced,
    failed,
    unchanged: pendingItems.length - synced - failed,
  };
}
