"""Strip inline TypeScript / TSX array initializers to `[];` (dev-only, memory store)."""

from __future__ import annotations

import shutil
from dataclasses import dataclass


@dataclass(frozen=True)
class StripResult:
    text: str
    changed: bool
    label: str


def _is_already_empty(s: str, i: int) -> bool:
    j = i
    while j < len(s) and s[j] in " \t\n":
        j += 1
    if j < len(s) and s[j : j + 2] == "[]":
        k = j + 2
        while k < len(s) and s[k] in " \t\n":
            k += 1
        return k < len(s) and s[k] == ";"
    return False


def _skip_balanced_array(text: str, start_bracket: int) -> int | None:
    """If text[start_bracket] is '[', return index one past the closing `;` of `...];`."""
    if start_bracket >= len(text) or text[start_bracket] != "[":
        return None
    depth = 0
    k = start_bracket
    while k < len(text):
        c = text[k]
        if c == "[":
            depth += 1
        elif c == "]":
            depth -= 1
            if depth == 0:
                m = k + 1
                while m < len(text) and text[m] in " \t\n":
                    m += 1
                if m < len(text) and text[m] == ";":
                    return m + 1
                return None
        k += 1
    return None


def strip_array_after_assign(text: str, marker: str, label: str) -> StripResult:
    """
    Find `marker` (e.g. '  const users: User[] = ') and, if the right-hand side is
    a non-empty array literal, replace it with `[];`.
    """
    i = text.find(marker)
    if i == -1:
        return StripResult(text=text, changed=False, label=f"{label} (marker not found)")

    j = i + len(marker)
    if _is_already_empty(text, j):
        return StripResult(text=text, changed=False, label=label)

    if j >= len(text) or text[j] != "[":
        return StripResult(text=text, changed=False, label=f"{label} (unexpected form)")

    end = _skip_balanced_array(text, j)
    if end is None:
        return StripResult(text=text, changed=False, label=f"{label} (unbalanced array)")

    new_text = text[: i + len(marker)] + "[];" + text[end:]
    return StripResult(text=new_text, changed=True, label=label)


def strip_property_array_line(
    text: str, property_prefix: str, label: str, trailing: str = ","
) -> StripResult:
    """
    Like `    courseReviews: [` ... `],`  — property_prefix includes leading spaces and name,
    e.g. '    courseReviews: '  then the array. trailing is typically ',' or '];' ending - we expect comma after `]`.
    """
    i = text.find(property_prefix)
    if i == -1:
        return StripResult(text=text, changed=False, label=f"{label} (marker not found)")

    j = i + len(property_prefix)
    while j < len(text) and text[j] in " \t\n":
        j += 1
    if j < len(text) and text[j : j + 2] == "[]":
        return StripResult(text=text, changed=False, label=label)

    if j >= len(text) or text[j] != "[":
        return StripResult(text=text, changed=False, label=f"{label} (unexpected form)")

    end_bracket = _find_matching_bracket_end(text, j)
    if end_bracket is None:
        return StripResult(text=text, changed=False, label=f"{label} (unbalanced array)")

    k = end_bracket + 1
    if k < len(text) and text[k] in " \t":
        while k < len(text) and text[k] in " \t":
            k += 1
    if not (k < len(text) and text[k] == ","):
        return StripResult(text=text, changed=False, label=f"{label} (expected `],` after array)")

    new_text = text[:i] + property_prefix + "[]" + text[k:]
    return StripResult(text=new_text, changed=True, label=label)


def _find_matching_bracket_end(text: str, at_open: int) -> int | None:
    if at_open >= len(text) or text[at_open] != "[":
        return None
    depth = 0
    for k in range(at_open, len(text)):
        if text[k] == "[":
            depth += 1
        elif text[k] == "]":
            depth -= 1
            if depth == 0:
                return k
    return None


def write_backup(path) -> None:
    bak = path.with_suffix(path.suffix + ".bak")
    shutil.copy2(path, bak)


# Markers in `lib/store.ts` for large seeded arrays (const + one property in `return`).

STORE_MARKERS: list[tuple[str, str]] = [
    ("const", "  const users: User[] = "),
    ("const", "  const tracks: Track[] = "),
    (
        "property",
        "    courseReviews: ",
    ),
]
