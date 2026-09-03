# S_DropItem.ini — complete format and runtime reference (ZoneServer101 decompile)

> Verified 2026-09-03 against the ZoneServer binary (IDA database with DWARF symbols) and the data in
> a test-server copy of `S_DropItem.ini` (`|V.6|194|`, 6,794 rows).
> Scope: ZoneServer only. Client-side files are not covered.

---

## 0. What it is and who uses it

`S_DropItem.ini` is the **only loot table** in the server. One row describes a "pool": gold, an affix-quality
distribution, up to 40 weighted items, 5 part-break items and an optional announcement. The **key (col 1) is
both a MONSTER id and a CONTAINER ITEM id**, because monsters and items share the same number space:

- If the key is a monster → the row is what it drops on death (`CMonster::GiveItem` + `GiveGold`).
- If the key is a bag/box → the row is its contents. The bag points at the row through **`S_Item` col 64
  (`DropIndex`, idx 63)**; by convention `DropIndex = the item's own id` (7809→7809, 2136→2136), but it is a
  separate field.
- ⚠️ If a number is both a monster **and** a bag (55383 is; there are 1,094 such ids), **the same row serves both**.

Full chain (all addresses are ZS 101):

```
S_DropItem.ini ──CDropItemQuery::Init @0xa8eb10──► CGameData::m_kDropItemQuery   (map<short, CDropItemData*>)
       │            LoadDB @0xa8f790 · CheckVersion @0xa8f660 · Deserialize @0xa8ec20
       ▼
CZoneServer::InitMonster @0x5b5f20 ──► CMonsterDBO::GetAllMonsterDrops @0x771e50 ──► CZoneServer::MonsterDrops
                                                                                       (map<short, SMonsterDrop*>)
CNode::BornMonster @0x97b481 assigns CMonster::DropTable (+0xB50) by template id when the mob spawns
(also CNPC::ChangTemplate @0x9757b6 and CZoneRainbowRoadTeam::EventMonster @0x5a15b1).

Consumers of the pool (SMonsterDrop):
  CMonster::GiveReward @0x967900 → GiveItem @0x96fd80 (+ PB pool) and GiveGold @0x968330 · CItemFactory::GenerateDrop @0x4dde70
  CItemFactory::OpenLuckyBag @0x4ecf60 (bag class 12) · OpenOptionalLuckyBag @0x4ed320 (pick-your-own bag, class 15)
  CItemFactory::GetDropItemByDropIndex @0x501940 (fishing only: CFishFactory::AutoFished) · PlayerPickUpSurpriseBox @0x4db6c0
  CEventDelayElfWorkResult::Remove @0x5e1040 (sprite work result) · CFishFactory::SetFishItemId
  GM: TC_Drop_Item_Test @0x8945c0 · TC_DropItem @0x7c5690 · Server_TC_ServerDataTest
Consumers of the raw row (CDropItemData, via CGameData::QueryDropItem @0xa51700):
  OpenOptionalLuckyBag (item list and RandTimes) · PlayerPickUpTreasure @0x4d8aa0 (Marquee announcement on pickup)
  CMonsterDBO::GetItemPos @0x773f60 (item→position map for the client's "where to get it")
```

**No hot reload**: no GM command re-reads `S_DropItem`; the ZS must be restarted. As with every other loader,
if `S_DropItem.ini.bin` exists (RC4 `easyfun`) **that** file is loaded and the `.ini` is ignored.

---

## 1. Versions and column count (`CheckVersion @0xa8f660`)

The header `|V.x|N|` sets `m_nVer = x` and the number of item slots `MaxDropItem`:

| Header | MaxDropItem | Columns |
|---|---|---|
| V.0 / V.1 | not set (do not use) | — |
| V.2 | 20 | 12 + 80 = 92 |
| V.3 | 20 | 13 + 80 = 93 |
| V.4 | 40 | 13 + 160 = 173 |
| V.5 | 40 | 13 + 160 + 20 = 193 |
| **V.6 (current)** | **40** | **13 + 160 + 20 + 1 = 194** |

Formula: `12 base columns + 1 (PurpleRate, v≥3) + 4·MaxDropItem + 20 (5 PB entries, v≥5) + 1 (MarqueeItem, v≥6)`.
Any other version makes `CheckVersion` fail and the load abort. The tokenizer is the one shared by every
`S_*.ini`: it flattens the file on `|`, requires `(tokens − 2) % 194 == 0` and slices blindly into chunks of 194,
so **every record carries exactly 194 `|`** even when it spans two physical lines (982 test-server records have a
`\n` inside the name, as in `S_Monster`). One `|` too many or too few shifts every following row.

---

## 2. Columns (1-based) — type, conversion and real use in the binary

Every `*Rate` column is read as a **real number in PERCENT** and stored as an integer `×1,000,000`
(`(int)(v·1e6 + 0.5)`); at runtime it is compared against **1e8 = 100 %**. So `70` = 70 %, `0.05` = 0.05 %,
`100` = always. The old note claiming "0.05 = 5 %" was wrong. The real-number reader is
`CInTextStream::operator>>(double&) @0xa7e610` = `strtod(token, 0)`: a trailing `%` is ignored (`1%` reads as 1),
non-numeric or empty text reads as 0, and a negative value (`-100`) ends up in an overflowed `UInt`.

| # | Name (header) | DWARF field / type | What it really does |
|---|---|---|---|
| 1 | Id | `m_nId` int → **short key** | Unique. `QueryDropItem` and every map truncate to `short`: ids ≥ 32768 work (as negatives) but must be < 65536 and unique modulo 65536. |
| 2 | Name | `m_kName` string | Logs only. May contain a line break (two-line record). |
| 3 | Level | `m_nLevel` uchar | **Dead**: parsed, never read (neither by `GetAllMonsterDrops` nor by the raw-row consumers). |
| 4 | DropGoldRate | `m_nDropGoldRate` % ×1e6 | Chance to drop gold (`GiveGold`): `roll ∈ [1, 1e8] ≤ rate`. `100` = always, empty = never. |
| 5 | AvgGold | `m_nAvgGold` uint | Average gold. |
| 6 | RandGold | `m_nRandGold` uint | Gold = uniform in `[Avg − Rand, Avg + Rand)`. |
| 7 | RandTimes | `m_nRandTimes` uchar → `m_nDropNumber` | **Number of independent rolls** per kill/opening (each may miss or repeat an item). In pick-your-own bags (class 15) = **number of items the player chooses**. Empty = 0 = nothing. |
| 8 | NotDropRate | `m_nNotDropRate` % ×1e6 | **Dead**: parsed but **never copied into the pool nor read by anyone**. The "nothing drops" chance comes from the weights summing to less than 100 (§4). the test data has 112 rows with `-100` and dozens with 43/55/75: they do nothing. |
| 9-12 | GreenRate, BlueRate, OrangeRate, YellowRate | `m_nGreenRate`…`m_nYellowRate` % ×1e6 | **Affix quality** distribution (`S_ItemCombo`) for equipment coming out of this pool: qualities 2, 3, 4, 5. |
| 13 | RedRate (v≥3) | `m_nPurpleRate` % ×1e6 | Quality 6. The header calls it Red, the binary Purple. |
| 14-173 | 40 × `Drop_ItemId, Drop_ItemName, Drop_Stack, Drop_Rate` | `DropItem {m_nItemId uint, m_kItemName string, m_nStack ushort, m_nRate % ×1e6}` | Normal pool. `ItemId` 0/empty = gap (skipped, the list stays dense). `Rate` 0/empty = **dead entry** (never enters the pool). `Stack` = exact amount dropped. The name is informational. |
| 174-193 | 5 × `PB_ItemId, PB_ItemName, PB_Stack, PB_Rate` | list `m_kPBDropItems` | **Part-break** pool: rolled ONLY if at death `MaxPartHP > 0 && PartHP <= 0` (see the part-breaking article). There are **5** entries, not 6. |
| 194 | MarqueeItem (v≥6) | `m_kMarqueeItemIds` map<int,int> | Server-wide announcement when a given item comes out of this row (§7). Without a `#` it is a comment and is ignored. |

---

## 3. Deserialize (`@0xa8ec20`) — exact read order

```
id(int)  name(str)  level(uchar)  DropGoldRate(real→×1e6)  AvgGold(uint)  RandGold(uint)  RandTimes(uchar)
NotDropRate(real→×1e6)  Green  Blue  Orange  Yellow (reals→×1e6)
[v≥3] Purple(real→×1e6)
MaxDropItem × { ItemId(uint) Name(str) Stack(ushort) Rate(real→×1e6) }   → m_kDropItems if ItemId≠0
[v≥5] 5 × { ItemId Name Stack Rate }                                     → m_kPBDropItems if ItemId≠0
[v≥6] MarqueeItem(str)  → StrToken '#'; if exactly 2 parts, the 2nd is split on ':' (≤45 pairs)
                          and each pair on ' ' into (short,short) → m_kMarqueeItemIds[itemId] = textIndex
```

Parser errors (set `m_bError`, `Init` returns false and the ZS does not boot):
`ERROR!! DropItem:%d MarqueeItem Fields size != 2` (more than one `#`, or a pair without two fields) and
`ERROR!! DropItem:%d MarqueeItem is over 45`. A MarqueeItem without `#` (0 or 1 parts) is not an error: it is dropped.

---

## 4. Building the in-memory pool (`CMonsterDBO::GetAllMonsterDrops @0x771e50`)

Despite the "DBO" name it never touches PostgreSQL: it walks `CGameData::GetAllDropItems()` and creates one
`SMonsterDrop` (256 B) per row, which is what the rolls use:

| SMonsterDrop field | Source |
|---|---|
| `m_nId`, `m_nDropGoldRate`, `m_nAvgGold`, `m_nRandGold` | straight copy |
| `m_nDropNumber` (short) | `RandTimes` |
| `m_nGreenRate`…`m_nPurpleRate`, `m_nSumOfQualityRate`, `m_kItemQuality` | cumulative map `{0→0, Green→2, Green+Blue→3, +Orange→4, +Yellow→5, +Purple→6}` (only non-zero rates) |
| `m_nSumOfProbability`, `m_kDropItems` (map<cumulative, CDropItem{itemId, stack, rate}>) | for every entry with `Rate ≠ 0`: `Sum += rate; map[Sum] = entry` |
| `m_nPBSumOfProbability`, `m_kPBDropItems` | same with the PB list |
| `m_kMarqueeItems` | copy of the Marquee map |

`Level` and `NotDropRate` are **not copied**: that is why they are dead.

Validations in this phase (they go to `InitErrLog` → `CLogFactory::DBError = 1` → `[FAIL] Database Error!!`,
the ZS dies at the end of loading):

- `DropID[%d] with worng drop item id[%u]!` → the normal-pool `ItemId` does not exist in `S_Item` (looked up in
  `CZoneServer::AllItems`, also keyed by short).
- `DropID[%d] with worng item[%u] count[%hu]!` → `Stack` = 0, or `Stack > 1` on a **non-stackable** item
  (bit 0 of `CItem::Flags`). A piece of equipment with Stack 2 does not boot.
- The PB list is **not** validated at load; a bad id there only yields `Invalid drop item [%u] in MonsterDrop [%d]`
  at roll time (InitErrLogAppend, no abort).

---

## 5. The roll (`CItemFactory::GenerateDrop @0x4dde70`)

`GenerateDrop(eDropType, &list, killer, SMonsterDrop*, monster_id, add_drop_rate, bTestData)`:

1. Pool: `eDropType == 0` → normal; `1 (eDr_PartBreaking)` → PB. `killer` plays no part in the selection;
   `monster_id` is only logged.
2. `base = (int)((1 − add_drop_rate) · 1e8)`, floored at 0.
3. `DropNumber` times: `range = max(Sum, base)`; `roll = random()/2³¹ · range + 1` (uniform in `[1, range]`);
   if `roll > Sum` → this roll **drops nothing** (with `bTestData` a null pair is recorded to count misses);
   otherwise → `upper_bound(roll)` in the cumulative map → `{ItemId, Stack}`; the item must exist in
   `AllItems` (else `Invalid drop item [%u] in MonsterDrop [%d]`) and is appended to the list.
4. Logs (level 0): `[DROP] ID:<monster_id> MonsterDrop:<row>(PartBreaking)` and per item
   ` drop from ItemID:<id> Amount:<n>`.

Consequences:

- **P(a given item per roll) = rate / max(Sum, 100·(1 − add_drop_rate))**, in percent.
- **P(anything drops per roll) = Sum / max(Sum, 100·(1 − add))**. If `Sum ≥ 100` the pool is **saturated**:
  something always drops and any drop bonus is inert. In the test data: 450 rows
  with sum > 100 (max 254), 3,016 rows with sum < 100.
- Rolls are **with replacement**: with `RandTimes 5` you can get 5 copies of the same item.
- `add_drop_rate` for monsters = `CNodeTemplate::GetDropRateUp(node, killer IP)` + the killer's attribute at
  `EFBonusAttr+0x4C4` (added by `CEC_ItemDropRateUp`, an `S_Enchant` command: parameter in %, between −100 and
  100, divided by 100). The node bonus is a map keyed by **IP range** (`SetDropRateUp @0x98b090`, GM
  `TC_SetNodeDrop`) capped at 5.0. `CEC_DropRateUp` writes a **different** attribute (`+0x4A0`) that the
  `S_DropItem` chain never reads.
- Bags, fishing and surprise boxes call with `add_drop_rate = 1.0` → `base = 0` → **they never miss**: every
  roll yields an item (unless the pool is empty).

---

## 6. Delivery: monsters, gold and bags

### 6.1 Monster death (`CMonster::GiveReward @0x967900`)
Order: EXP (`GiveExp`/`GiveTeamExp`/`GiveNodePlayersExp`) → items (virtual `GiveItem`) → `GiveGold`. With a
Raid-10 team, items and gold are only given in the node types of bitmask `0x82040`.

`GiveItem @0x96fd80`: `GenerateDrop(0, …, DropTable, id, GetDropRateUp + bonus, 0)`; if `MaxPartHP > 0 &&
PartHP <= 0` it runs a **second** `GenerateDrop(1, …)` with the PB pool (same bonus). Every item is materialized
with `DropTreasure @0x4deb20` on a random cell around the corpse (4 attempts at ~1 cell, respecting blocks and
line of movement; if none is valid it lands on the corpse itself):

- `CItem::Clone` → `SelectItemCombo @0x4e9180`: if the item can carry affixes (`Flags` bit 7 and
  `GetItemComboType ≠ 0`), `roll ∈ [1, 1e8]`; if `roll ≤ SumOfQualityRate` → `upper_bound` in `m_kItemQuality`
  → quality 2..6 → `RandItemCombo` picks an `S_ItemCombo` affix of that quality; otherwise no affix.
  **Green..Purple are therefore the affix probabilities of dropped equipment, not the item's own color.**
- Durability: if the item is stackable (`Flags` bit 0) and `MaxDurability > Stack`, the durability field =
  `Stack` (that is how the amount travels); otherwise max durability.
- `Treasure->SourceID = row` (used later for the Marquee on pickup).
- In Beasts Tower it logs `[ItemDrop]` / `[PartBreak ItemDrop] Monster ID[%hu] Drop Item ID[%d] …`.

### 6.2 Gold (`CMonster::GiveGold @0x968330`)
Only if the killer is a player and in the same node. `roll ∈ [1, 1e8] ≤ DropGoldRate` → amount
`Avg − Rand + random()·2·Rand`. Split: in Beasts Tower equally among the players in the node; with a team,
equally among the members present in the node (`GiveGold Team Number Error ????` if the list is empty);
otherwise all to the killer. Each share is multiplied by `1 + GetGoldRateUp(node, IP)` (cap 5.0, GM
`TC_SetNodeGold`) and goes through `CCharacter::GainGold` (messages 9052/9053, `ItemLog` type 5 `M:<mob>,A:-1`).
Gold does **not** go through `GenerateDrop` nor through the item-drop bonus.

### 6.3 Normal bags (`OpenLuckyBag @0x4ecf60`, item class 12)
Item `DropIndex` → `MonsterDrops` → `GenerateDrop(0, …, add = 1.0)` → `RandTimes` items (with replacement,
never misses) → `HandleREOpenLuckyBag` (recommended events) → `AddItemsToCharacter @0x4eb300`, which runs every
item through `DiceItemCombo @0x4e9fa0` (same quality table as §6.1) and puts it in the normal or sprite inventory
by type (23-26, 32/33, 9022). Then, for every obtained item present in `m_kMarqueeItems`, it sends the
announcement (§7).

### 6.4 Pick-your-own bags (`OpenOptionalLuckyBag @0x4ed320`, class 15)
The client sends the chosen ids separated by `,`. Rules: the number of ids must be **exactly `RandTimes`**;
every id must appear in the row's list (weights are ignored, the amount is the entry's `Stack`); the item must
exist (`Invalid OpenOptionalLuckyBag item [%u]`); inventory slots are checked (message 9057 if they do not fit)
and the items are delivered through `AddItemsToCharacter` + Marquee. Debug log
`OpenOptionalLuckyBag select_id[%d] not found if drop_id[%hu]` when an id is not in the list.

### 6.5 Others
- Fishing: `GetDropItemByDropIndex @0x501940` (requires a free inventory slot, message 9057; `add = 1.0`; drops
  the treasure at the player's feet and picks it up immediately).
- `PlayerPickUpSurpriseBox @0x4db6c0`, `CEventDelayElfWorkResult::Remove @0x5e1040` and
  `CFishFactory::SetFishItemId` call `GenerateDrop` with the row their own table points at.
- `CMonsterDBO::GetItemPos @0x773f60` walks `S_Item`: if the item has a position (`node;area`) and no enchant
  with command 1075, it dumps **the contents of its `S_DropItem` row** (by item id) into the item→position map
  that feeds the client's "where to get it".

---

## 7. MarqueeItem (col 194)

Format: `<free text>#<itemId> <textIndex>:<itemId> <textIndex>:…` (at most 45 pairs). The resulting map
`itemId → textIndex` is checked when **opening a bag** (§6.3/6.4) and when **picking up a treasure**
(`PlayerPickUpTreasure`, through the treasure's `SourceID`). If the obtained item is in the map and
`textIndex > 0`, the ZS asks the MissionServer for
`BroadCastScreenMessage Type= 7 Msg= |TextIndex:<n> Param:<player>, <item>, <bag or source>|` (server-wide
screen message, text from `T_TextIndex`). In the test data the 18 rows using this column carry only a comment
(`20230111農曆新年活動`, `藏寶圖任務獎勵`…) without `#`, so **no announcement is active**.

---

## 8. Test-server data (for calibration)

| Column | Distribution |
|---|---|
| Level | empty 2,316 · 90: 533 · 80: 226 · 15: 122 · 70: 114 (dead) |
| Gold | 4,428 rows without gold; patterns `100|372|100`, `100|358|95`, `100|1510|90` on normal mobs |
| RandTimes | 1: 5,286 · 2: 582 · 3: 486 · 5: 242 · 4: 62 · empty: 40 · 10: 33 · 6: 27 · 15: 25 |
| NotDropRate | 0: 4,082 · −100: 112 · 43: 87 · 55: 63 · 100: 55 · 50: 46 (dead) |
| Quality (G,B,O,Y,R) | empty 3,771 · `35,1` 715 · `35,5` 296 · `40,60` 262 · `20` 127 · `75,25` 125 · `95,5` 120 · `20,80` 119 |
| Item rates | 56,947 integers · 43,918 decimals · **883 empty (dead entries)** · 2 with a `%` suffix |
| Entries per row | 0 to 40; 31 rows at the cap of 40 |
| Weight sum | median 100 · 450 rows > 100 (max 254) · 3,016 rows < 100 |
| PB | 103 rows: raids 51298/51299/51369/51459/51921, Sprite Messengers 50408-51673 (PB at 100 %), boxes 17141-17146, 19998 |
| Marquee | 18 rows, all comments |

Sample row (boss 59534 Rast, saturated pool at 137 %, `RandTimes 5`, no gold):
`59534|Rast|65|||||5|0||||||31606|…|15|13.5|31605|…|15|13.5|…|34414|…|1|4|…`

---

## 9. Recipes and traps

- **Raise/lower a drop**: change its `Rate` (%). Its per-roll chance is `rate / max(Sum, 100)`; if you want
  drop x2 events to affect it, keep the pool sum **below 100**.
- **New drop on a mob**: use a free slot among the 40 entries (`ItemId|Name|Stack|Rate`), `Rate > 0`, an item
  that exists in `S_Item`, `Stack 1` unless stackable. Empty slots may sit in any position.
- **New box/bag**: item of class 12 (or 15 for "choose N") with `DropIndex` = the row id; in the row,
  `RandTimes` = number of items that come out (or get chosen), weights in % (for class 12 it is convenient to
  make them sum to 100 so they read as probabilities; if they sum to less, something still always drops, because
  `add = 1.0`).
- **Gold**: `DropGoldRate 100|Avg|Rand`. The `Level` and `NotDropRate` columns do nothing: do not waste time on them.
- **Things that kill the ZS at boot**: one `|` too many/few, a non-existent `ItemId`, `Stack 0`, `Stack > 1` on a
  non-stackable item, a `MarqueeItem` with more than one `#`, malformed pairs or more than 45 pairs.
- **Short key**: monsters 50031-60000 and mall items 40001-65000 work, but an id ≥ 65536 would collide with
  `id − 65536`, and **a monster and a box with the same number share the row**.
- The `.bin` takes precedence over the `.ini`; and there is no hot reload.
- The client ships the same table as `C_DropItem.ini` in its data folder (`|V.6|194|`, empty names, visible
  probabilities): any weight change is public.

---

## 10. Function index

| Function | Addr | Role |
|---|---|---|
| `CDropItemQuery::Init` / `CheckVersion` / `Deserialize` | 0xa8eb10 / 0xa8f660 / 0xa8ec20 | load and parse |
| `CBaseQuery<short,CDropItemData>::LoadDB` | 0xa8f790 | tokenizer + `.bin` |
| `CGameData::QueryDropItem` / `GetAllDropItems` | 0xa51700 / 0xa51780 | raw row access (short key) |
| `CMonsterDBO::GetAllMonsterDrops` | 0x771e50 | row → `SMonsterDrop` (cumulative pools, validations) |
| `CZoneServer::InitMonster` | 0x5b5f20 | calls the above at boot |
| `CNode::BornMonster` | assigns at 0x97b481 | `CMonster::DropTable` |
| `CItemFactory::GenerateDrop` | 0x4dde70 | the roll |
| `CItemFactory::DropTreasure` / `CreateTreasure` | 0x4deb20 / 0x4e9050 | treasure on the ground |
| `CItemFactory::SelectItemCombo` / `DiceItemCombo` / `RandItemCombo` | 0x4e9180 / 0x4e9fa0 / 0x4d16b0 | affix quality |
| `CItemFactory::AddItemsToCharacter` | 0x4eb300 | direct delivery (bags) |
| `CMonster::GiveReward` / `GiveItem` / `GiveGold` | 0x967900 / 0x96fd80 / 0x968330 | rewards on death |
| `CItemFactory::OpenLuckyBag` / `OpenOptionalLuckyBag` | 0x4ecf60 / 0x4ed320 | bags |
| `CItemFactory::GetDropItemByDropIndex` | 0x501940 | fishing |
| `CItemFactory::PlayerPickUpTreasure` | 0x4d8aa0 | pickup + Marquee |
| `CNodeTemplate::SetDropRateUp` / `GetDropRateUp` / `SetGoldRateUp` / `GetGoldRateUp` | 0x98b090 / 0x98b4a0 / 0x98ad60 / 0x98b430 | per-node bonus by IP range (cap 5.0) |
| `CEC_ItemDropRateUp::Init` / `Execute` | 0x9f6e30 / 0x9f6f40 | drop buff (%, ±100) → `EFBonusAttr+0x4C4` |
| `CEC_DropRateUp::Init` / `Execute` | 0x9de260 / 0x9de340 | another attribute (`+0x4A0`), outside this chain |
| `CMonsterDBO::GetItemPos` | 0x773f60 | item → position ("where to get it") |
| `TC_Drop_Item_Test` / `TC_DropItem` | 0x8945c0 / 0x7c5690 | GM test commands (`bTestData`) |

Structures: `GameData::CDropItemData` (144 B: id 0x0, name 0x8, level 0x10, gold 0x14-0x1c, RandTimes 0x20,
NotDrop 0x24, Green..Purple 0x28-0x38, lists 0x40/0x50, marquee 0x60) · `CDropItemData::DropItem` (24 B: id 0x0,
name 0x8, stack 0x10, rate 0x14) · `lapis::SMonsterDrop` (256 B: id 0x0, gold 0x4-0xc, DropNumber 0x10, quality
0x14-0x28, `m_kItemQuality` 0x30, `m_nSumOfProbability` 0x60, `m_kDropItems` 0x68, PB 0x98/0xa0, marquee 0xd0) ·
`CDropItemQuery` (`m_nMaxDropItem` 0x78, `m_nVer` 0x7c, `m_bError` 0x80).
