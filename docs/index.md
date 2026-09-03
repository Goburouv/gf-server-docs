# GF Server Data Reference

Reference documentation for the server data files (`S_*.ini`), written from the decompiled server binaries and
checked against real data. Every article states which binary functions read each column, what the values mean
at runtime, which mistakes stop the server from booting, and how to edit the file safely.

## Articles

| File | What it controls | Status |
|---|---|---|
| [S_DropItem.ini](server/S_DropItem.md) | Loot tables: monster drops, bag contents, gold, affix quality, part-break drops, announcements | Complete |

## Conventions

- Column numbers are **1-based** unless marked `idx` (0-based).
- Addresses (`@0x...`) refer to the ZoneServer binary and are given so the claims can be re-checked.
- "Dead column" means the loader parses it but no code ever reads the value.
