CREATE TABLE `recommendations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`slug` text NOT NULL,
	`product_zh` text NOT NULL,
	`product_es` text NOT NULL,
	`keywords` text NOT NULL,
	`category` text NOT NULL,
	`platforms` text NOT NULL,
	`price` real,
	`currency` text DEFAULT 'MXN' NOT NULL,
	`trend_status` text NOT NULL,
	`verdict` text NOT NULL,
	`report_json` text NOT NULL,
	`feishu_status` text DEFAULT 'pending' NOT NULL,
	`feishu_error` text,
	`feishu_pushed_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `recommendations_slug_unique` ON `recommendations` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `recommendations_date_unique` ON `recommendations` (`date`);--> statement-breakpoint
CREATE INDEX `recommendations_platforms_idx` ON `recommendations` (`platforms`);--> statement-breakpoint
CREATE INDEX `recommendations_verdict_idx` ON `recommendations` (`verdict`);