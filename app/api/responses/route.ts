import { env } from "cloudflare:workers";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const MAX_TEXT_LENGTH = 80;
const MAX_WORDS = 8;
const STOP_WORDS = new Set(
  [
    "a", "about", "after", "again", "all", "also", "am", "an", "and", "any", "are", "as", "at",
    "be", "because", "been", "before", "being", "between", "both", "but", "by",
    "can", "could", "did", "do", "does", "doing", "down", "during",
    "each", "either", "else", "for", "from", "further", "had", "has", "have", "having", "he", "her",
    "here", "hers", "herself", "him", "himself", "his", "how", "i", "if", "in", "into", "is", "it",
    "its", "itself", "just", "me", "more", "most", "my", "myself", "neither", "no", "nor", "not",
    "of", "off", "on", "once", "only", "or", "other", "our", "ours", "ourselves", "out", "over",
    "same", "she", "should", "so", "some", "such", "than", "that", "the", "their", "theirs", "them",
    "themselves", "then", "there", "these", "they", "this", "those", "through", "to", "too", "under",
    "until", "up", "very", "was", "we", "were", "what", "when", "where", "which", "while", "who",
    "whom", "why", "will", "with", "would", "you", "your", "yours", "yourself", "yourselves", "yet",
  ],
);

function normalizeWords(value: string) {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("en-US")
    .replace(/[’']/g, "")
    .match(/[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*/gu)
    ?.filter((word) => !STOP_WORDS.has(word) && !/\d/u.test(word))
    .slice(0, MAX_WORDS) ?? [];
}

export async function GET() {
  try {
    const rows = await env.DB.prepare(
      "SELECT question, word, count FROM word_counts ORDER BY count DESC, word ASC LIMIT 200",
    ).all<{ question: number; word: string; count: number }>();
    const result: Record<1 | 2, { word: string; count: number }[]> = { 1: [], 2: [] };
    for (const row of rows.results) {
      if (row.question === 1 || row.question === 2) {
        if (!STOP_WORDS.has(row.word) && !/\d/u.test(row.word)) {
          result[row.question].push({ word: row.word, count: row.count });
        }
      }
    }
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Unable to load word cloud results", error);
    return NextResponse.json({ error: "Results are temporarily unavailable." }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > 1000) {
      return NextResponse.json({ error: "That response is too long." }, { status: 413 });
    }
    const body = (await request.json()) as { question?: unknown; text?: unknown };
    if ((body.question !== 1 && body.question !== 2) || typeof body.text !== "string") {
      return NextResponse.json({ error: "Choose a question and enter a response." }, { status: 400 });
    }
    if (body.text.length > MAX_TEXT_LENGTH) {
      return NextResponse.json({ error: `Please use ${MAX_TEXT_LENGTH} characters or fewer.` }, { status: 400 });
    }
    const words = normalizeWords(body.text);
    if (!words.length) {
      return NextResponse.json({ error: "Please enter at least one descriptive word." }, { status: 400 });
    }
    const uniqueWords = [...new Set(words)];
    const statements = uniqueWords.map((word) =>
      env.DB.prepare(
        "INSERT INTO word_counts (question, word, count) VALUES (?, ?, 1) ON CONFLICT(question, word) DO UPDATE SET count = count + 1",
      ).bind(body.question, word),
    );
    await env.DB.batch(statements);
    return NextResponse.json({ ok: true, words: uniqueWords.length });
  } catch (error) {
    console.error("Unable to save word cloud response", error);
    return NextResponse.json({ error: "Your response could not be saved. Please try again." }, { status: 503 });
  }
}
