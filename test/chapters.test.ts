import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildStory } from "../src/story.js";
import { detectChapters } from "../src/chapters.js";
import { renderHtml } from "../src/render.js";
import type { Commit } from "../src/types.js";

function mk(i: number, over: Partial<Commit> = {}): Commit {
  return { hash: "h" + i.toString().padStart(7, "0"), author: "A", email: "a@x", date: new Date(Date.UTC(2024, 0, 1 + i)).toISOString(), subject: "c" + i, added: 5, deleted: 1, files: 1, tags: [], ...over };
}

test("genesis, release and revert are detected", () => {
  const cs = [mk(0), mk(1, { tags: ["v1.0.0"] }), mk(2, { subject: 'Revert "bad"' })];
  const kinds = detectChapters(cs).map((c) => c.kind);
  assert.deepEqual(kinds, ["genesis", "release", "revert"]);
});

test("long gap is detected", () => {
  const cs = [mk(0), mk(1), mk(200)];
  assert.ok(detectChapters(cs).some((c) => c.kind === "gap"));
});

test("empty history gives no chapters", () => assert.deepEqual(detectChapters([]), []));

test("end to end on a real temp repo", () => {
  const d = mkdtempSync(join(tmpdir(), "rr-"));
  const run = (...a: string[]) => execFileSync("git", a, { cwd: d, stdio: "pipe" });
  run("init", "-q");
  run("config", "user.email", "t@x.io");
  run("config", "user.name", "T");
  for (let i = 0; i < 3; i++) {
    writeFileSync(join(d, "f.txt"), "line\n".repeat(i + 1));
    run("add", ".");
    run("commit", "-qm", "step " + i);
  }
  run("tag", "v0.1.0");
  const story = buildStory(d);
  assert.equal(story.stats.commits, 3);
  assert.equal(story.chapters[0].kind, "genesis");
  const html = renderHtml(story, { dir: "rtl", lang: "ar" });
  assert.match(html, /dir="rtl"/);
  assert.match(html, /Release v0\.1\.0/);
});
