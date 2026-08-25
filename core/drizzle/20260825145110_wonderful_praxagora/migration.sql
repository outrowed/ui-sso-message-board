CREATE TABLE IF NOT EXISTS `messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`author_username` text NOT NULL,
	`content` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT `fk_messages_author_username_profiles_username_fk` FOREIGN KEY (`author_username`) REFERENCES `profiles`(`username`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `profiles` (
	`username` text PRIMARY KEY,
	`fullname` text NOT NULL,
	`interests` text,
	`likes` text,
	`dislikes` text,
	`instagram` text,
	`twitter` text,
	`youtube` text,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP
);
