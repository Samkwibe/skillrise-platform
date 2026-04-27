# Dev scripts

Run these from the `web/` directory (so `lib/` and `app/` resolve correctly).

| Command | Purpose |
|--------|--------|
| `python3 scripts/dev_check_use_client.py` | List `.ts`/`.tsx` files under `app/` and `components/` that use `onClick` but not `"use client"` (heuristic; verify manually). |
| `python3 scripts/dev_clear_local_seed.py` | Dry-run: report whether `lib/store.ts` still has non-empty inline array literals. With `--write`, strips them to `[]` and writes `store.ts.bak` first. **Restart the dev server** after changing the memory store. |

For `DATA_STORE=memory`, the in-process store is only reset on process restart, even if you edit `store.ts` on disk.

## Lint (Next.js 16+)

`next lint` was removed. This app uses the ESLint CLI: `npm run lint` in `web/` (see `eslint.config.mjs`). Noisy rules are set to `warn` so CI can pass while issues are fixed incrementally; tighten in `eslint.config.mjs` when ready.
