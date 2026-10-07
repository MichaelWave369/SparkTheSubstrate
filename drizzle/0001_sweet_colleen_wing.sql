CREATE TABLE `progress` (
	`id` text PRIMARY KEY NOT NULL,
	`token_hash` text NOT NULL,
	`revision` integer NOT NULL,
	`snapshot` text NOT NULL,
	`updated` integer NOT NULL
);
