#!/usr/bin/env python3
"""
Import real talent-tree data from wowhandbook.com class pages into data/.

Usage:
  1. Fetch the pages (both locales) into a local dir, e.g.:
       for c in warrior paladin hunter rogue priest shaman mage warlock druid; do
         curl -sL "https://wowhandbook.com/zh/classes/$c/" -o fetched/zh/$c.html
         curl -sL "https://wowhandbook.com/classes/$c/"   -o fetched/en/$c.html
       done
  2. python3 scripts/import-wowhandbook.py <fetched-dir>

The class pages embed the full talent trees as JSON in
<script type="application/json"> blocks. Each tree talent has:
name, max (ranks), row (1-7), col (1-4), req (index of prerequisite talent
in the same tree, must be maxed per classic rules), ranks[].text.

Tree-gating follows the classic rule: row N requires (N-1)*5 points in that
tree, which is emitted as requiresPointsInTree.
"""
import json
import re
import sys
from pathlib import Path

CLASSES = ["warrior", "paladin", "hunter", "rogue", "priest", "shaman", "mage", "warlock", "druid"]

GAME_VERSION = "1.60.1.70425"
PROVENANCE = {
    "status": "reviewed",
    "gameVersion": GAME_VERSION,
    "source": "wowhandbook.com talent data extracted from WoW: Forever beta client",
    "sourceUrl": "https://wowhandbook.com/talents/",
    "importedAt": "2026-10-25",
    "needsRevalidation": True,
    "notes": "Beta build 1.60.1.70425; talent data may still change before the Nov 5 launch. Cross-checked against Blizzard class deep-dive posts.",
}

RULES = {"firstTalentLevel": 10, "maxLevel": 60, "pointsPerLevel": 1, "maxPoints": 51}

TREE_SLUGS = {
    "warrior": ["arms", "fury", "protection"],
    "paladin": ["holy", "protection", "retribution"],
    "hunter": ["beast-mastery", "marksmanship", "survival"],
    "rogue": ["assassination", "combat", "subtlety"],
    "priest": ["discipline", "holy", "shadow-magic"],
    "shaman": ["elemental-combat", "enhancement", "restoration"],
    "mage": ["arcane", "fire", "frost"],
    "warlock": ["affliction", "demonology", "destruction"],
    "druid": ["balance", "feral-combat", "restoration"],
}


def extract_trees(path: Path):
    html = path.read_text(encoding="utf8")
    blocks = re.findall(r'<script type="application/json"[^>]*>(.*?)</script>', html, re.S)
    if not blocks:
        raise RuntimeError(f"no json block in {path}")
    return json.loads(blocks[0])


def convert(class_id: str, src_dir: Path, out_dir: Path):
    zh_trees = extract_trees(src_dir / "zh" / f"{class_id}.html")
    en_trees = extract_trees(src_dir / "en" / f"{class_id}.html")
    slugs = TREE_SLUGS[class_id]
    assert len(zh_trees) == len(en_trees) == len(slugs), f"{class_id}: tree count mismatch"

    trees_out = []
    for t_idx, (zt, et, slug) in enumerate(zip(zh_trees, en_trees, slugs)):
        zts, ets = zt["talents"], et["talents"]
        assert len(zts) == len(ets), f"{class_id}/{slug}: talent count mismatch"
        node_ids = [f"{slug}-{i:02d}" for i in range(len(zts))]
        nodes = []
        for i, (z, e) in enumerate(zip(zts, ets)):
            assert z["row"] == e["row"] and z["col"] == e["col"] and z["max"] == e["max"], (
                f"{class_id}/{slug}/{i}: shape mismatch zh/en"
            )
            requires = []
            if "req" in z:
                req_idx = z["req"]
                requires.append({"nodeId": node_ids[req_idx], "points": zts[req_idx]["max"]})
            node = {
                "id": node_ids[i],
                "name": {"zh": z["name"], "en": e["name"]},
                "description": {"zh": z["ranks"][-1]["text"], "en": e["ranks"][-1]["text"]},
                "maxPoints": z["max"],
                "row": z["row"] - 1,
                "col": z["col"] - 1,
                "requires": requires,
                "requiresPointsInTree": (z["row"] - 1) * 5,
                "exclusiveWith": [],
            }
            nodes.append(node)
        trees_out.append({"id": slug, "name": {"zh": zt["name"], "en": et["name"]}, "nodes": nodes})

    data = {
        "classId": class_id,
        "gameVersion": GAME_VERSION,
        "rules": RULES,
        "demo": False,
        "provenance": PROVENANCE,
        "trees": trees_out,
    }
    out = out_dir / f"{class_id}.json"
    out.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf8")
    total = sum(len(t["nodes"]) for t in trees_out)
    print(f"{class_id}: {len(trees_out)} trees, {total} talents -> {out}")


def main():
    src_dir = Path(sys.argv[1] if len(sys.argv) > 1 else "/tmp/wowhandbook")
    out_dir = Path("data/talents")
    for c in CLASSES:
        convert(c, src_dir, out_dir)


if __name__ == "__main__":
    main()
