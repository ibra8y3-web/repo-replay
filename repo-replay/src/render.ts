import type { Story } from "./types.js";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const fmt = (iso: string) => iso.slice(0, 10);

/** Render a self-contained HTML page (no external requests). */
export function renderHtml(story: Story, opts: { dir?: "ltr" | "rtl"; lang?: string } = {}): string {
  const dir = opts.dir ?? "ltr";
  const { stats } = story;
  // sparkline of cumulative commits
  const W = 600, H = 80;
  const n = story.commits.length;
  const pts = story.commits.map((_, i) => `${((i / Math.max(1, n - 1)) * W).toFixed(1)},${(H - ((i + 1) / n) * (H - 4)).toFixed(1)}`).join(" ");
  const chapters = story.chapters
    .map((c, i) => {
      const idx = story.commits.findIndex((k) => k.hash === c.commit);
      const x = ((idx / Math.max(1, n - 1)) * W).toFixed(1);
      return `<section class="ch ${c.kind}" style="--i:${i}"><div class="date">${fmt(c.date)} · ${c.kind}</div><h2>${esc(c.title)}</h2><p>${esc(c.summary)}</p><code>${esc(c.commit.slice(0, 8))}</code><span class="x" data-x="${x}"></span></section>`;
    })
    .join("\n");
  const dots = story.chapters
    .map((c) => {
      const idx = story.commits.findIndex((k) => k.hash === c.commit);
      return `<circle cx="${((idx / Math.max(1, n - 1)) * W).toFixed(1)}" cy="${(H - ((idx + 1) / n) * (H - 4)).toFixed(1)}" r="4"><title>${esc(c.title)}</title></circle>`;
    })
    .join("");
  return `<!doctype html>
<html lang="${esc(opts.lang ?? "en")}" dir="${dir}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(story.repo)} · the story</title>
<style>
:root{color-scheme:dark}body{margin:0;font:16px/1.6 system-ui,sans-serif;background:#0d1117;color:#e6edf3}
main{max-width:720px;margin:0 auto;padding:48px 20px}h1{font-size:2.4rem;margin:0}
.meta{color:#8b949e;margin:8px 0 24px}svg{width:100%;height:auto;background:#161b22;border-radius:8px}
polyline{fill:none;stroke:#58a6ff;stroke-width:2}circle{fill:#f78166}
.ch{border-inline-start:3px solid #30363d;padding:4px 0 4px 18px;margin:28px 0;opacity:0;transform:translateY(12px);animation:in .5s ease forwards;animation-delay:calc(var(--i)*.12s)}
.ch.genesis{border-color:#3fb950}.ch.rewrite{border-color:#f78166}.ch.release{border-color:#d29922}.ch.revert{border-color:#db61a2}
.date{color:#8b949e;font-size:.85rem;text-transform:uppercase;letter-spacing:.05em}h2{margin:.2em 0}code{color:#8b949e}
@keyframes in{to{opacity:1;transform:none}}footer{color:#6e7681;margin-top:48px;font-size:.85rem}
</style></head><body><main>
<h1>${esc(story.repo)}</h1>
<div class="meta">${stats.commits} commits · ${stats.authors} contributors · ${fmt(stats.first)} → ${fmt(stats.last)} · +${stats.added} / −${stats.deleted} lines</div>
<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="commit growth"><polyline points="${pts}"/>${dots}</svg>
${chapters}
<footer>Made with repo-replay</footer>
</main></body></html>`;
}

export function renderMarkdown(story: Story): string {
  const lines = [`# The story of ${story.repo}`, "", `${story.stats.commits} commits by ${story.stats.authors} contributors, ${fmt(story.stats.first)} to ${fmt(story.stats.last)}.`, ""];
  for (const c of story.chapters) lines.push(`## ${c.title} (${fmt(c.date)})`, "", c.summary, "");
  return lines.join("\n");
}
