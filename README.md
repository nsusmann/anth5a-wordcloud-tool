# ANTH 5A Classroom Word Clouds

A two-question classroom participation tool for exploring what is and is not a tool.

**Live classroom link:** https://anth5a-wordcloud-tool.brandeis-4774.chatgpt.site

## What students can do

- Students with last names A–K submit examples of things that are tools.
- Students with last names L–Z submit examples of things that are not tools.
- Anyone can refresh the results to see both word clouds side by side.

## Privacy

The application asks for no name, email address, student account, or other identifying information. It stores only normalized response words and aggregate counts in Cloudflare D1. Duplicate words in a single response count once.

## Technology

The app is built with React, Vinext, and Cloudflare D1. The hosted version is deployed through ChatGPT Sites because a static GitHub Pages site cannot securely accept and aggregate shared classroom submissions by itself.

## Local development

```bash
npm install
npm run db:generate
npm run build
npm run dev
```

For local database setup, apply the migration in `drizzle/` with Wrangler after the first build.
