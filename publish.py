#!/usr/bin/env python3
"""Publish allow-listed notes into docs/.

Only the files listed in manifest.json are ever copied. Each file goes through the
replacement map first and is then scanned line by line against the deny patterns;
a single hit blocks that file and the script exits with status 1, printing the
offending lines so they can be fixed at the source.
"""
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent
MANIFEST = ROOT / "manifest.json"


def main() -> int:
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    source_root = pathlib.Path(manifest["source_root"])
    deny = [re.compile(p, re.IGNORECASE) for p in manifest["deny_patterns"]]
    replacements = manifest.get("replacements", {})
    blocked = False

    for entry in manifest["files"]:
        src = source_root / entry["src"]
        dst = ROOT / "docs" / entry["dst"]
        if not src.is_file():
            print(f"MISSING  {src}")
            blocked = True
            continue

        text = src.read_text(encoding="utf-8")
        for old, new in replacements.items():
            text = text.replace(old, new)

        hits = []
        for number, line in enumerate(text.splitlines(), start=1):
            if any(pattern.search(line) for pattern in deny):
                hits.append((number, line.strip()))
        if hits:
            blocked = True
            print(f"BLOCKED  {entry['src']} ({len(hits)} lines):")
            for number, line in hits:
                print(f"  line {number}: {line[:120]}")
            continue

        dst.parent.mkdir(parents=True, exist_ok=True)
        tmp = dst.with_suffix(dst.suffix + ".tmp")
        tmp.write_text(text, encoding="utf-8", newline="\n")
        tmp.replace(dst)
        print(f"published {entry['src']} -> docs/{entry['dst']}")

    return 1 if blocked else 0


if __name__ == "__main__":
    sys.exit(main())
