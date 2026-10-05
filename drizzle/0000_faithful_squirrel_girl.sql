CREATE TABLE `word_counts` (
	`question` integer NOT NULL,
	`word` text NOT NULL,
	`count` integer DEFAULT 1 NOT NULL,
	PRIMARY KEY(`question`, `word`)
);
