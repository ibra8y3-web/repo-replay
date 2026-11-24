import { basename, resolve } from "node:path";
import { readCommits } from "./git.js";
import { detectChapters } from "./chapters.js";
import type { Story } from "./types.js";

export function buildStory(repoPath: string, opts: { limit?: number; maxChapters?: number } = {}): Story {
  const cwd = resolve(repoPath);
  const commits = readCommits(cwd, opts.limit);
  if (commits.length === 0) throw new Error("No commits found in " + cwd);
  return {
    repo: basename(cwd),
    commits,
    chapters: detectChapters(commits, opts.maxChapters),
    stats: {
      commits: commits.length,
      authors: new Set(commits.map((c) => c.email)).size,
      first: commits[0].date,
      last: commits[commits.length - 1].date,
      added: commits.reduce((s, c) => s + c.added, 0),
      deleted: commits.reduce((s, c) => s + c.deleted, 0),
    },
  };
}
