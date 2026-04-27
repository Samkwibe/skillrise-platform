"""Shared paths for dev utilities (run from repo: `cd web` then `python scripts/...`)."""

from __future__ import annotations

from pathlib import Path

# `web/` directory (parent of this `scripts/` package)
WEB_ROOT = Path(__file__).resolve().parent.parent
STORE_FILE = WEB_ROOT / "lib" / "store.ts"
APP_DIR = WEB_ROOT / "app"
COMPONENTS_DIR = WEB_ROOT / "components"
