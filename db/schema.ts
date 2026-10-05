import { integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const wordCounts = sqliteTable(
  "word_counts",
  {
    question: integer("question").notNull(),
    word: text("word").notNull(),
    count: integer("count").notNull().default(1),
  },
  (table) => [primaryKey({ columns: [table.question, table.word] })],
);
