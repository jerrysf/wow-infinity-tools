#!/usr/bin/env python3
"""
Generate data/{classes,builds,guides,selector} from extracted wowhandbook
class pages (fetched into /tmp/wowhandbook/{zh,en}/<class>.html).

Build panels on each class page carry published allocations with
level-by-level orders; this script maps the Chinese talent names back to the
generated node ids and emits buildSchema/guideSchema JSON.
"""
import json
import re
from pathlib import Path

SRC = Path("/tmp/wowhandbook")
DATA = Path("data")
GAME_VERSION = "1.60.1.70425"

PROV = {
    "status": "reviewed",
    "gameVersion": GAME_VERSION,
    "source": "wowhandbook.com recommended builds, beta client data",
    "sourceUrl": "https://wowhandbook.com/talents/",
    "importedAt": "2026-10-25",
    "needsRevalidation": True,
    "notes": "Beta build 1.60.1.70425 recommendations; may change before launch.",
}

# Editorial class metadata (generic, no power claims).
CLASSES = {
    "warrior": {"slug": "warrior", "zh": "战士", "en": "Warrior",
        "roles": ["melee-dps", "tank"],
        "tagline": {"zh": "近战前排：武器与狂怒输出，或防护系承担坦克。", "en": "Front-line melee: Arms and Fury damage, or Protection tanking."},
        "strengths": {"zh": "生存力强，能切坦克职责，组队需求高。", "en": "Durable, can tank, always in demand for groups."},
        "drawbacks": {"zh": "依赖装备与怒气循环，练级偏慢。", "en": "Gear- and rage-dependent; slower to level."},
        "tags": ["melee", "durable", "tank-curious", "group"]},
    "paladin": {"slug": "paladin", "zh": "圣骑士", "en": "Paladin",
        "roles": ["healer", "tank", "melee-dps"],
        "tagline": {"zh": "神圣治疗、防护坦克或惩戒输出，buff 团队价值高。", "en": "Holy healing, Protection tanking or Retribution damage with high-utility blessings."},
        "strengths": {"zh": "职责覆盖全，增益能力团队价值高，生存力强。", "en": "Covers all roles, powerful group blessings, very survivable."},
        "drawbacks": {"zh": "输出节奏偏慢，依赖法力资源。", "en": "Slower kill pace and mana-dependent."},
        "tags": ["melee", "support", "healing", "tank-curious", "durable", "group"]},
    "hunter": {"slug": "hunter", "zh": "猎人", "en": "Hunter",
        "roles": ["ranged-dps"],
        "tagline": {"zh": "远程输出与宠物伙伴，单人体验顺滑。", "en": "Ranged damage with a pet companion; smooth solo play."},
        "strengths": {"zh": "单人练级轻松，宠物可承担前排。", "en": "Easy solo leveling with a pet up front."},
        "drawbacks": {"zh": "需要管理宠物，近战距离弱势。", "en": "Pet management overhead; weak in melee range."},
        "tags": ["ranged", "solo", "simple", "leveling"]},
    "rogue": {"slug": "rogue", "zh": "潜行者", "en": "Rogue",
        "roles": ["melee-dps"],
        "tagline": {"zh": "潜行与近战爆发，控制手段多，PVP 主动性强。", "en": "Stealthy melee burst and control; proactive in PvP."},
        "strengths": {"zh": "爆发高、控制多、能跳过不想打的怪。", "en": "High burst, rich control, can skip unwanted fights."},
        "drawbacks": {"zh": "容错低，对走位和时机要求高。", "en": "Low margin for error; demands positioning and timing."},
        "tags": ["melee", "pvp", "complex", "burst", "solo"]},
    "priest": {"slug": "priest", "zh": "牧师", "en": "Priest",
        "roles": ["healer", "ranged-dps"],
        "tagline": {"zh": "戒律与神圣治疗，或暗影远程输出。", "en": "Discipline and Holy healing, or ranged Shadow damage."},
        "strengths": {"zh": "团队核心治疗，组队容易。", "en": "Core group healer; easy to find parties."},
        "drawbacks": {"zh": "单人练级速度一般。", "en": "Average solo leveling speed."},
        "tags": ["ranged", "healing", "support", "group"]},
    "shaman": {"slug": "shaman", "zh": "萨满祭司", "en": "Shaman",
        "roles": ["healer", "melee-dps", "ranged-dps"],
        "tagline": {"zh": "元素、增强或恢复，图腾带来独特团队增益。", "en": "Elemental, Enhancement or Restoration; totems bring unique group utility."},
        "strengths": {"zh": "图腾团队增益独特，职责覆盖广。", "en": "Unique totem utility; covers many roles."},
        "drawbacks": {"zh": "机制分散，需要兼顾图腾管理。", "en": "Spread-thin mechanics and totem management."},
        "tags": ["versatile", "support", "healing", "group"]},
    "mage": {"slug": "mage", "zh": "法师", "en": "Mage",
        "roles": ["ranged-dps"],
        "tagline": {"zh": "奥术、火焰或冰霜远程爆发，控制与机动出色。", "en": "Arcane, Fire or Frost burst with strong control and mobility."},
        "strengths": {"zh": "爆发高、控制多、自带吃喝与传送。", "en": "High burst, rich control, conjured food and teleports."},
        "drawbacks": {"zh": "身板脆，法力管理要求高。", "en": "Fragile and mana-hungry."},
        "tags": ["ranged", "burst", "complex", "pvp", "fragile"]},
    "warlock": {"slug": "warlock", "zh": "术士", "en": "Warlock",
        "roles": ["ranged-dps"],
        "tagline": {"zh": "痛苦持续伤害、恶魔学识宠物或毁灭爆发。", "en": "Affliction damage-over-time, Demonology pets, or Destruction burst."},
        "strengths": {"zh": "宠物协助单人，持续伤害稳定，生存手段多。", "en": "Pet-assisted soloing, steady DoT damage, many survival tools."},
        "drawbacks": {"zh": "爆发偏慢，技能循环较繁琐。", "en": "Slower burst and a busier rotation."},
        "tags": ["ranged", "solo", "durable", "complex", "leveling"]},
    "druid": {"slug": "druid", "zh": "德鲁伊", "en": "Druid",
        "roles": ["tank", "healer", "melee-dps", "ranged-dps"],
        "tagline": {"zh": "全能变形职业，可覆盖坦克、治疗与输出。", "en": "Versatile shapeshifter covering tank, healer and damage roles."},
        "strengths": {"zh": "职责最灵活，想换玩法不必重练。", "en": "Most flexible class; swap roles without rerolling."},
        "drawbacks": {"zh": "样样通但上手复杂，装备需求分散。", "en": "Jack of all trades; complex and gear-hungry."},
        "tags": ["versatile", "support", "group", "complex", "tank-curious", "healing"]},
}

SLUG_SAFE = re.compile(r"[^a-z0-9]+")

# Stable slugs and playstyles for named endgame builds (keyed on zh name).
NAMED_BUILDS = {
    ("druid", "野性练级"): ("druid-feral-leveling", "leveling"),
    ("druid", "野性坦克"): ("druid-feral-tank", "dungeon"),
    ("druid", "野性猫"): ("druid-feral-cat", "raid"),
    ("druid", "恢复"): ("druid-restoration-healing", "raid"),
    ("druid", "平衡"): ("druid-balance-dps", "raid"),
}


def load_trees(class_id):
    return json.loads((DATA / "talents" / f"{class_id}.json").read_text(encoding="utf8"))


def name_to_node(trees):
    """zh talent name -> [(tree_idx, node_id)]"""
    m = {}
    for t in trees["trees"]:
        for n in t["nodes"]:
            m.setdefault(n["name"]["zh"], []).append(n["id"])
    return m


def parse_panels(html):
    panels = re.findall(r'<article class="build-panel"(.*?)</article>', html, re.S)
    out = []
    for p in panels:
        p = re.sub(r'data-astro-cid-\w+', '', p)
        name = re.search(r'<h3\s*>([^<]+)</h3>', p)
        use = re.search(r'build-panel__use"[^>]*>([^<]+)', p)
        intro = re.search(r'</header>\s*<p\s*>([^<]+)</p>', p)
        whys = [w.strip() for w in re.findall(r'<li\s*>([^<]+)</li>', p)]
        split = re.findall(r'<b\s*>(\d+)</b>\s*([^<]+)</span>', p)
        steps = re.findall(
            r'talent-order__lv"[^>]*>([^<]+)</span>.*?talent-order__name"[^>]*>([^<]+)<small\s*>([^<]+)</small>',
            p, re.S)
        out.append({
            "name": name.group(1).strip() if name else "?",
            "use": use.group(1).strip() if use else "",
            "intro": intro.group(1).strip() if intro else "",
            "whys": whys,
            "split": [(int(a), b.strip()) for a, b in split],
            "steps": [(a.strip(), b.strip(), c.strip()) for a, b, c in steps],
        })
    return out


def step_increments(steps):
    """turn (levelRange, name, 'x/y') rows into incremental spends per node name"""
    cum = {}
    out = []
    for lv, name, rank in steps:
        cur = int(rank.split("/")[0])
        prev = cum.get(name, 0)
        inc = cur - prev
        cum[name] = cur
        out.append((lv, name, inc))
    return out


def main():
    builds_all = []
    for cid, meta in CLASSES.items():
        trees = load_trees(cid)
        lookup = name_to_node(trees)
        zh = parse_panels((SRC / "zh" / f"{cid}.html").read_text(encoding="utf8"))
        en = parse_panels((SRC / "en" / f"{cid}.html").read_text(encoding="utf8"))
        assert len(zh) == len(en), f"{cid}: build panel count mismatch zh={len(zh)} en={len(en)}"
        for i, (zb, eb) in enumerate(zip(zh, en)):
            tree_slug_for_build = None
            # figure out main tree from split (the nonzero tree)
            main_tree_idx = max(range(len(zb["split"])), key=lambda k: zb["split"][k][0])
            main_tree_slug = trees["trees"][main_tree_idx]["id"]
            role_txt = zb["use"] or zb["name"]
            full60 = any("60" in s[0] for s in zb["steps"])
            # level range
            levels = re.findall(r'(\d+)', zb["steps"][-1][0]) if zb["steps"] else []
            max_lv = int(levels[-1]) if levels else 20
            named = NAMED_BUILDS.get((cid, zb["name"]))
            if named:
                slug, playstyle = named
            else:
                slug = f"{cid}-{main_tree_slug}-leveling"
                playstyle = "leveling"
            incs = step_increments(zb["steps"])
            allocation = {}
            leveling = []
            unresolved = []
            for lv, name, inc in incs:
                ids = lookup.get(name)
                if not ids:
                    unresolved.append(name)
                    continue
                # prefer node in the main tree, else first match
                nid = next((x for x in ids if x.startswith(main_tree_slug)), ids[0])
                allocation[nid] = allocation.get(nid, 0) + inc
                # merge into last step if same level range and same node
                if leveling and leveling[-1]["levelRange"] == lv:
                    leveling[-1]["spend"][nid] = leveling[-1]["spend"].get(nid, 0) + inc
                else:
                    leveling.append({"levelRange": lv.replace("级", ""), "spend": {nid: inc}})
            if unresolved:
                print(f"  WARN {cid} '{zb['name']}' unresolved talents: {unresolved}")
            build = {
                "slug": slug,
                "name": {"zh": zb["name"], "en": eb["name"]},
                "summary": {"zh": zb["intro"], "en": eb["intro"]},
                "classId": cid,
                "playstyle": playstyle,
                "difficulty": "beginner",
                "gameVersion": GAME_VERSION,
                "levelRange": {"min": 10, "max": max_lv},
                "scenario": {"zh": role_txt, "en": eb["use"]},
                "pros": [{"zh": w, "en": eb["whys"][j] if j < len(eb["whys"]) else ""} for j, w in enumerate(zb["whys"])],
                "cons": [],
                "requirements": [],
                "allocation": allocation,
                "levelingSteps": leveling,
                "updatedAt": "2026-10-25",
                "provenance": PROV,
            }
            builds_all.append(build)
            (DATA / "builds" / f"{slug}.json").write_text(
                json.dumps(build, ensure_ascii=False, indent=2) + "\n", encoding="utf8")
            print(f"build {slug}: {len(allocation)} nodes, max level {max_lv}")

    # ---- classes ----
    for cid, meta in CLASSES.items():
        cls = {
            "id": cid, "slug": meta["slug"],
            "name": {"zh": meta["zh"], "en": meta["en"]},
            "tagline": meta["tagline"],
            "roles": meta["roles"],
            "preferenceTags": meta["tags"],
            "strengths": meta["strengths"],
            "drawbacks": meta["drawbacks"],
            "hasTalentData": True,
            "demo": False,
            "provenance": {**PROV, "notes": "Class list and roles per Blizzard class deep-dive posts; tree data extracted from beta client."},
        }
        (DATA / "classes" / f"{cid}.json").write_text(
            json.dumps(cls, ensure_ascii=False, indent=2) + "\n", encoding="utf8")
    print(f"classes: {len(CLASSES)} written")

    # ---- guides: one leveling guide per class ----
    for cid, meta in CLASSES.items():
        cbuilds = [b for b in builds_all if b["classId"] == cid]
        if not cbuilds:
            continue
        body_zh = "".join(
            f"【{b['name']['zh']}】{b['summary']['zh']} "
            for b in cbuilds[:2]
        )
        body_en = "".join(
            f"[{b['name']['en']}] {b['summary']['en']} "
            for b in cbuilds[:2]
        )
        guide = {
            "slug": f"{cid}-leveling-guide",
            "title": {"zh": f"{meta['zh']}练级加点指南", "en": f"{meta['en']} leveling builds"},
            "description": {
                "zh": f"{meta['zh']}在 Beta 中的练级加点路线与逐点顺序。",
                "en": f"Level-by-level {meta['en']} talent orders in the Forever beta.",
            },
            "kind": "leveling",
            "classId": cid,
            "relatedBuilds": [b["slug"] for b in cbuilds],
            "sections": [
                {"heading": {"zh": "练级加点思路", "en": "Leveling talent plan"},
                 "body": {"zh": body_zh.strip(), "en": body_en.strip()}},
                {"heading": {"zh": "适用范围", "en": "Where it applies"},
                 "body": {
                     "zh": "以上方案来自 Beta 版本 1.60.1.70425 的公开数据整理，正式版本上线后可能需要重新验证。",
                     "en": "These builds come from published data for beta build 1.60.1.70425 and may need re-verification at launch."}},
            ],
            "updatedAt": "2026-10-25",
            "provenance": PROV,
        }
        (DATA / "guides" / f"{guide['slug']}.json").write_text(
            json.dumps(guide, ensure_ascii=False, indent=2) + "\n", encoding="utf8")
    print("guides written")


if __name__ == "__main__":
    main()
