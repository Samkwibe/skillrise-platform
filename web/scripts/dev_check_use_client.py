#!/usr/bin/env python3
"""
Find client components that use `onClick` but are missing a `"use client"` directive
(false positives: server components that re-export, etc. — use as a hint only).

Run from `web/`:  python3 scripts/dev_check_use_client.py
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from _paths import APP_DIR, COMPONENTS_DIR


def scan_dir(dir_path: Path) -> list[Path]:
    found: list[Path] = []
    if not dir_path.is_dir():
        return found
    for p in dir_path.rglob("*.ts"):
        if "node_modules" in p.parts or ".next" in p.parts:
            continue
        _check_file(p, found)
    for p in dir_path.rglob("*.tsx"):
        if "node_modules" in p.parts or ".next" in p.parts:
            continue
        _check_file(p, found)
    return found


def _check_file(path: Path, out: list[Path]) -> None:
    try:
        text = path.read_text(encoding="utf-8")
    except OSError as e:
        print(f"skip {path}: {e}", file=sys.stderr)
        return
    if "onClick" in text and "use client" not in text:
        out.append(path)


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument(
        "--app",
        type=Path,
        default=APP_DIR,
        help="App directory to scan (default: web/app)",
    )
    p.add_argument(
        "--components",
        type=Path,
        default=COMPONENTS_DIR,
        help="Components directory to scan (default: web/components)",
    )
    args = p.parse_args()

    all_found: list[Path] = []
    all_found.extend(scan_dir(args.app))
    all_found.extend(scan_dir(args.components))
    for path in sorted(set(all_found)):
        print(path)
    if not all_found:
        print("(none)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
