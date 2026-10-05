"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Word = { word: string; count: number };
type Results = { 1: Word[] };

const EMPTY_RESULTS: Results = { 1: [] };
const COLORS = ["#12355b", "#00798c", "#d1495b", "#edae49", "#30638e", "#5f4b8b"];

function WordCloud({ words }: { words: Word[] }) {
  const max = Math.max(1, ...words.map((item) => item.count));
  const arranged = useMemo(
    () => [...words].sort((a, b) => b.count - a.count || a.word.localeCompare(b.word)),
    [words],
  );

  if (!arranged.length) {
    return (
      <div className="cloud-empty">
        <p>No responses yet.</p>
        <span>Submit an example to start this cloud.</span>
      </div>
    );
  }

  return (
    <div className="word-cloud" aria-label="Class word cloud">
      {arranged.map((item, index) => {
        const scale = Math.sqrt(item.count / max);
        const size = 1 + scale * 2.1;
        return (
          <span
            key={item.word}
            title={`${item.word}: ${item.count} response${item.count === 1 ? "" : "s"}`}
            style={{
              color: COLORS[(index + 1) % COLORS.length],
              fontSize: `${size}rem`,
              fontWeight: item.count === max ? 800 : 650,
              transform: `rotate(${index % 5 === 0 ? -2 : index % 7 === 0 ? 2 : 0}deg)`,
            }}
          >
            {item.word}
          </span>
        );
      })}
    </div>
  );
}

function QuestionCard({ words, onSubmitted }: {
  words: Word[];
  onSubmitted: () => Promise<void>;
}) {
  const [answer, setAnswer] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event?: FormEvent) {
    event?.preventDefault();
    const value = answer.trim();
    if (!value) return;
    setBusy(true);
    setStatus("");
    try {
      const response = await fetch("/api/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: 1, text: value }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Could not submit your response.");
      setAnswer("");
      setStatus("Submitted — thank you!");
      await onSubmitted();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not submit your response.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="question-card" aria-labelledby="question-title">
      <div className="question-heading">
        <span className="question-number">Question 1</span>
      </div>
      <h2 id="question-title">Provide an example of something that is a tool.</h2>

      <form onSubmit={submit} className="response-form">
        <label htmlFor="answer-1">Your example</label>
        <div className="input-row">
          <Input
            id="answer-1"
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            maxLength={80}
            autoComplete="off"
            aria-describedby="status-1"
          />
          <Button type="submit" disabled={busy || !answer.trim()}>
            <Send aria-hidden="true" />
            {busy ? "Sending" : "Submit"}
          </Button>
        </div>
        <p id="status-1" className="form-status" aria-live="polite">
          {status || "No name, email, or account is requested."}
        </p>
      </form>

      <div className="cloud-frame">
        <WordCloud words={words} />
      </div>
      <p className="response-count">
        {words.reduce((total, item) => total + item.count, 0)} total word responses
      </p>
    </section>
  );
}

export default function Home() {
  const [results, setResults] = useState<Results>(EMPTY_RESULTS);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setLoadError("");
    try {
      const response = await fetch("/api/responses", { cache: "no-store" });
      const payload = (await response.json()) as Results & { error?: string };
      if (!response.ok) throw new Error(payload.error || "Results are temporarily unavailable.");
      setResults({ 1: payload[1] || [] });
      setLastUpdated(new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit", second: "2-digit" }));
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Results are temporarily unavailable.");
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const context = (document as Document & {
      modelContext?: {
        registerTool: (tool: Record<string, unknown>, options?: { signal?: AbortSignal }) => void | Promise<void>;
      };
    }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    void Promise.resolve(
      context.registerTool(
        {
          name: "refresh_word_cloud",
          title: "Refresh word cloud",
          description: "Reload the classroom word cloud and show the latest anonymous responses.",
          inputSchema: { type: "object", properties: {}, additionalProperties: false },
          annotations: { readOnlyHint: true, untrustedContentHint: true },
          execute: async () => {
            await refresh();
            return { refreshed: true };
          },
        },
        { signal: lifecycle.signal },
      ),
    ).catch(() => undefined);
    return () => lifecycle.abort();
  }, [refresh]);

  return (
    <main>
      <header className="site-header">
        <div>
          <p className="eyebrow">ANTH 5A • CLASS RESPONSE</p>
          <h1>What counts as a tool?</h1>
          <p className="intro">Add one example, then refresh to watch the class word cloud take shape.</p>
        </div>
        <div className="refresh-area">
          <Button type="button" variant="outline" onClick={refresh} disabled={refreshing}>
            <RefreshCw className={refreshing ? "spin" : ""} aria-hidden="true" />
            {refreshing ? "Refreshing" : "Refresh results"}
          </Button>
          <span aria-live="polite">{lastUpdated ? `Updated ${lastUpdated}` : "Loading results…"}</span>
        </div>
      </header>

      {loadError && <p className="load-error" role="alert">{loadError}</p>}

      <div className="questions-grid">
        <QuestionCard words={results[1]} onSubmitted={refresh} />
      </div>

      <footer>
        <strong>Anonymous by design.</strong> This page stores only the words submitted and their totals — not names, email addresses, or student accounts.
      </footer>
    </main>
  );
}

