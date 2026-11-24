# repo-replay

Turn any git repo's history into a shareable story. One command, runs locally, no API keys.

```bash
npx repo-replay .            # writes <repo>-story.html
npx repo-replay . --format md
npx repo-replay . --rtl --lang ar   # right-to-left (Arabic, Hebrew)
```

Gource shows a pretty animation. repo-replay tells you *what happened*: the first commit, the big rewrite,
the revert, the release, the contributor wave, the long silence and the comeback.

## Status: v0.1 (early)

Works today:
- Reads full history with `git log` (no network).
- Detects chapters: genesis, tagged releases, big rewrites, reverts, new-contributor waves, long gaps.
- Outputs a self-contained HTML page (no external requests), Markdown, or JSON.
- RTL layout option.

Next (see ROADMAP.md): PR/issue titles via `gh`, MP4 export, GitHub Action that keeps a story in your README,
optional LLM narration (bring your own model, off by default).

## Develop

```bash
npm install
npm test
node dist/src/cli.js path/to/repo
```

## License

MIT
