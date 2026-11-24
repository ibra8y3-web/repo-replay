#!/usr/bin/env node
import { writeFileSync } from "node:fs";
import { buildStory } from "./story.js";
import { renderHtml, renderMarkdown } from "./render.js";

const HELP = `repo-replay [path] [options]

  path                 git repo to read (default: .)
  -o, --out <file>     output file (default: <repo>-story.html)
  --format <html|md|json>   output format (default: html)
  --rtl                right-to-left layout (Arabic, Hebrew)
  --lang <code>        html lang attribute (default: en)
  --limit <n>          only the last n commits
  --chapters <n>       max chapters (default: 12)
  -h, --help
`;

function main(argv: string[]): void {
  const o: Record<string, string | boolean> = {};
  const pos: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "-h" || a === "--help") o.help = true;
    else if (a === "--rtl") o.rtl = true;
    else if (a === "-o" || a === "--out") o.out = argv[++i];
    else if (["--format", "--lang", "--limit", "--chapters"].includes(a)) o[a.slice(2)] = argv[++i];
    else if (a.startsWith("-")) { console.error("Unknown option " + a + "\n" + HELP); process.exit(2); }
    else pos.push(a);
  }
  if (o.help) { console.log(HELP); return; }
  const story = buildStory(pos[0] ?? ".", {
    limit: o.limit ? Number(o.limit) : undefined,
    maxChapters: o.chapters ? Number(o.chapters) : undefined,
  });
  const format = (o.format as string) ?? "html";
  const ext = format === "md" ? "md" : format === "json" ? "json" : "html";
  const out = (o.out as string) ?? `${story.repo}-story.${ext}`;
  const body = format === "md" ? renderMarkdown(story) : format === "json" ? JSON.stringify(story, null, 2) : renderHtml(story, { dir: o.rtl ? "rtl" : "ltr", lang: o.lang as string | undefined });
  writeFileSync(out, body);
  console.log(`${story.chapters.length} chapters from ${story.stats.commits} commits -> ${out}`);
}

try { main(process.argv.slice(2)); } catch (e) { console.error((e as Error).message); process.exit(1); }
