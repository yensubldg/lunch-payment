import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const bills = sqliteTable("bills", {
  id: text().primaryKey(),
  title: text().notNull(),
  imageData: text(),
  totalAmount: integer().notNull().default(0),
  createdAt: integer({ mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const billItems = sqliteTable("bill_items", {
  id: integer().primaryKey({ autoIncrement: true }),
  billId: text()
    .notNull()
    .references(() => bills.id),
  name: text().notNull(),
  amount: integer().notNull().default(0),
  paymentStatus: text().notNull().default("pending"), // pending | paid
  paymentOrderCode: integer(),
  paidAt: integer({ mode: "timestamp" }),
});
