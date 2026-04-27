#!/usr/bin/env python3
"""
Dev-only: strip large inline `[]` contents in `lib/store.ts` (memory data store).
Safe default is dry-run. Use `--write` to apply (creates `store.ts.bak` first).
Does not restart the dev server; for `DATA_STORE=memory`, also restart the server
so `globalThis.__skillrise_store` is re-read.

Run from `web/`:  python3 scripts/dev_clear_local_seed.py
"""

from __future__ import annotations

import argparse
import sys

from _paths import STORE_FILE
from _store_array_strip import (
    StripResult,
    strip_array_after_assign,
    strip_property_array_line,
    write_backup,
    STORE_MARKERS,
)


def run_strips(text: str) -> tuple[str, list[StripResult], bool]:
    t = text
    any_change = False
    results: list[StripResult] = []
    for kind, marker in STORE_MARKERS:
        if kind == "const":
            r = strip_array_after_assign(t, marker, marker.strip()[:40])
        else:
            r = strip_property_array_line(t, marker, marker.strip()[:40])
        results.append(r)
        t = r.text
        if r.changed:
            any_change = True
    return t, results, any_change


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument(
        "--write",
        action="store_true",
        help="Write store.ts (after .bak backup).",
    )
    p.add_argument(
        "--no-backup",
        action="store_true",
        help="With --write, skip copy to store.ts.bak (not recommended).",
    )
    args = p.parse_args()

    if not STORE_FILE.is_file():
        print(f"Missing {STORE_FILE}", file=sys.stderr)
        return 1

    original = STORE_FILE.read_text(encoding="utf-8")
    new_text, results, any_change = run_strips(original)

    for r in results:
        state = "strip" if r.changed else "ok"
        print(f"  [{state}] {r.label}")

    if not any_change:
        print("No inline array bodies to remove (or already empty).")
        if new_text != original:
            print("Warning: text drift — compare manually.", file=sys.stderr)
        return 0

    if not args.write:
        print("Dry run only. Re-run with --write to apply (creates a .bak by default).")
        return 0

    if not args.no_backup:
        write_backup(STORE_FILE)
        print(f"Backup: {STORE_FILE.with_suffix(STORE_FILE.suffix + '.bak')}")

    STORE_FILE.write_text(new_text, encoding="utf-8", newline="\n")
    print(f"Wrote {STORE_FILE}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
