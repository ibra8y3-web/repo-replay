import { execFileSync } from "node:child_process";
import type { Commit } from "./types.js";

const SEP = "\x1f";
const REC = "\x1e";

function git(cwd: string, args: string[]): string {
  return execFileSync("git", args, { cwd, encoding: "utf8", maxBuffer: 512 * 1024 * 1024 });
}

/** Read the full history of the repo at `cwd`, oldest first. */
export function readCommits(cwd: string, limit?: number): Commit[] {
  const fmt = `${REC}%H${SEP}%an${SEP}%ae${SEP}%aI${SEP}%s${SEP}%D`;
  const args = ["log", "--reverse", "--no-merges", `--pretty=format:${fmt}`, "--numstat"];
  const out = git(cwd, args);
  const commits: Commit[] = [];
  for (const block of out.split(REC)) {
    if (!block.trim()) continue;
    const nl = block.indexOf("\n");
    const head = nl === -1 ? block : block.slice(0, nl);
    const rest = nl === -1 ? "" : block.slice(nl + 1);
    const [hash, author, email, date, subject, refs = ""] = head.split(SEP);
    let added = 0, deleted = 0, files = 0;
    for (const line of rest.split("\n")) {
      const m = /^(\d+|-)\t(\d+|-)\t/.exec(line);
      if (!m) continue;
      files++;
      if (m[1] !== "-") added += Number(m[1]);
      if (m[2] !== "-") deleted += Number(m[2]);
    }
    const tags = refs
      .split(",")
      .map((r) => r.trim())
      .filter((r) => r.startsWith("tag: "))
      .map((r) => r.slice(5));
    commits.push({ hash, author, email, date, subject, added, deleted, files, tags });
  }
  return limit ? commits.slice(-limit) : commits;
}
