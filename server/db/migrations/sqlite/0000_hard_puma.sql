CREATE TABLE `bill_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`billId` text NOT NULL,
	`name` text NOT NULL,
	`amount` integer DEFAULT 0 NOT NULL,
	`paymentStatus` text DEFAULT 'pending' NOT NULL,
	`paymentOrderCode` integer,
	`paidAt` integer,
	FOREIGN KEY (`billId`) REFERENCES `bills`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `bills` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`imageData` text,
	`totalAmount` integer DEFAULT 0 NOT NULL,
	`createdAt` integer NOT NULL
);
