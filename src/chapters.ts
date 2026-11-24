import type { Chapter, Commit } from "./types.js";

const DAY = 86_400_000;

function t(c: Commit): number {
  return new Date(c.date).getTime();
}

/**
 * Detect turning points in a commit history. Heuristics only (v0.1):
 * genesis, tagged releases, big rewrites, reverts, new-contributor waves,
 * and long silences followed by revival.
 */
export function detectChapters(commits: Commit[], maxChapters = 12): Chapter[] {
  if (commits.length === 0) return [];
  const out: Chapter[] = [];
  const first = commits[0];
  out.push({
    kind: "genesis",
    title: "Day one",
    summary: `${first.author} made the first commit: "${first.subject}".`,
    date: first.date,
    commit: first.hash,
    score: 100,
  });

  const sizes = commits.map((c) => c.added + c.deleted).sort((a, b) => a - b);
  const p95 = sizes[Math.floor(sizes.length * 0.95)] ?? 0;
  const seenAuthors = new Set<string>([first.email]);
  let recentNew: string[] = [];

  for (let i = 1; i < commits.length; i++) {
    const c = commits[i];
    const churn = c.added + c.deleted;

    for (const tag of c.tags) {
      out.push({ kind: "release", title: `Release ${tag}`, summary: `${tag} was tagged: "${c.subject}".`, date: c.date, commit: c.hash, score: 60 });
    }
    if (/^revert\b/i.test(c.subject)) {
      out.push({ kind: "revert", title: "A step back", summary: `The team reverted a change: "${c.subject}".`, date: c.date, commit: c.hash, score: 55 });
    }
    if (churn > 0 && churn >= p95 && c.deleted > 0 && c.deleted / churn > 0.4 && churn > 200) {
      out.push({ kind: "rewrite", title: "The big rewrite", summary: `${c.added} lines added and ${c.deleted} removed across ${c.files} files: "${c.subject}".`, date: c.date, commit: c.hash, score: 70 + Math.min(20, Math.log10(churn) * 4) });
    }
    if (!seenAuthors.has(c.email)) {
      seenAuthors.add(c.email);
      recentNew.push(c.email);
      if (recentNew.length === 3) {
        out.push({ kind: "contributors", title: "The team grows", summary: `${seenAuthors.size} people have now contributed. The latest newcomer is ${c.author}.`, date: c.date, commit: c.hash, score: 50 });
        recentNew = [];
      }
    }
    const gap = t(c) - t(commits[i - 1]);
    if (gap > 90 * DAY) {
      out.push({ kind: "gap", title: "Silence, then a comeback", summary: `${Math.round(gap / DAY)} days passed with no commits before "${c.subject}".`, date: c.date, commit: c.hash, score: 45 });
    }
  }

  const keepGenesis = out[0];
  const rest = out.slice(1).sort((a, b) => b.score - a.score).slice(0, maxChapters - 1);
  return [keepGenesis, ...rest.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())];
}
