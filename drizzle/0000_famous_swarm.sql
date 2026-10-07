CREATE TABLE `rooms` (
	`code` text PRIMARY KEY NOT NULL,
	`host_hash` text NOT NULL,
	`guest_hash` text,
	`created` integer NOT NULL,
	`expires` integer NOT NULL,
	`host_seen` integer NOT NULL,
	`guest_seen` integer DEFAULT 0 NOT NULL,
	`host_seq` integer DEFAULT 0 NOT NULL,
	`guest_seq` integer DEFAULT 0 NOT NULL,
	`snapshot` text NOT NULL,
	`input` text DEFAULT '{}' NOT NULL,
	`guest_form` text,
	`closed` integer DEFAULT 0 NOT NULL
);
