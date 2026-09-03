---
title: Home
hide:
  - navigation
  - toc
---

<div class="hero" markdown>

# GF Server Data Reference

<p class="lead">Column-by-column reference for the server data files, written from the decompiled server binaries and checked against real data. Every article says which functions read each column, what the values do at runtime, what stops the server from booting, and how to edit the file safely.</p>

</div>

## Articles

<div class="grid cards" markdown>

-   :material-treasure-chest:{ .lg .middle } __S_DropItem.ini__

    ---

    Loot tables: monster drops, bag contents, gold, affix quality, part-break drops and server-wide announcements. Includes the exact roll formula and the list of boot killers.

    <span class="status-badge">Complete</span>

    [:octicons-arrow-right-24: Read the article](server/S_DropItem.md)

-   :material-skull-outline:{ .lg .middle } __S_Monster.ini__

    ---

    Monster templates: stats, spells, AI hooks, alignment and part breaking.

    <span class="status-badge status-badge--planned">Planned</span>

</div>

## How to read these pages

<div class="grid cards" markdown>

-   :material-table-column:{ .lg .middle } __Columns__

    ---

    Column numbers are **1-based** unless marked `idx` (0-based). Header names come from the file; field names come from the binary's debug symbols.

-   :material-memory:{ .lg .middle } __Addresses__

    ---

    `@0x...` values are ZoneServer addresses, given so every claim can be re-checked in a disassembler.

-   :material-skull-crossbones:{ .lg .middle } __Boot killers__

    ---

    Anything marked as a boot killer makes the ZoneServer refuse to start. Each article lists them for its file.

-   :material-close-circle-outline:{ .lg .middle } __Dead columns__

    ---

    Parsed by the loader but never read by any code. Editing them does nothing.

</div>
