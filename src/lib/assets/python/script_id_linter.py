
"""
Supporter Guide GPT — Script‑ID Linter
======================================
Scans a directory of text and JSON files to ensure:
  • Every `script_id:` declared in a script library is unique.
  • Every `script_id` referenced by the prompt router exists in a library file.
  • Reports any orphaned or duplicate IDs.

Usage:
    python script_id_linter.py /path/to/supporter_bot_files

Assumptions:
  • Script libraries are plain‑text files containing lines that start with
    'script_id:' followed by an identifier (e.g. script_id: scenario_001_story).
  • Prompt router is a JSON file containing a list or dict where values include
    "script_id" keys or string references. The tool will look for a file whose
    name includes 'router' or ends with '.json'.
  • Tone‑mapping file isn’t required for the ID check but can be passed with
    --tone-map to ensure its `script_id` references match.

Author: OpenAI o3 — Generated 2025-07-13

"""
import argparse, json, re, sys, pathlib, collections

ID_PATTERN = re.compile(r"script_id\s*[:=]\s*([\w\-]+)", re.IGNORECASE)

def harvest_ids_from_text(file_path: pathlib.Path):
    ids = []
    with file_path.open("r", encoding="utf-8", errors="ignore") as f:
        for line in f:
            m = ID_PATTERN.search(line)
            if m:
                ids.append(m.group(1))
    return ids

def harvest_ids_from_json_router(router_path: pathlib.Path):
    with router_path.open("r", encoding="utf-8") as f:
        data = json.load(f)
    extracted = set()

    def walk(obj):
        if isinstance(obj, dict):
            for k, v in obj.items():
                if isinstance(k, str) and k.lower() == "script_id" and isinstance(v, str):
                    extracted.add(v)
                walk(v)
        elif isinstance(obj, list):
            for item in obj:
                walk(item)
    walk(data)
    return list(extracted)

def main():
    parser = argparse.ArgumentParser(description="Lints Supporter Guide GPT script IDs.")
    parser.add_argument("root", type=str, help="Root directory of bot files")
    parser.add_argument("--router", type=str, default=None,
                        help="Explicit path to router JSON (optional)")
    parser.add_argument("--tone-map", type=str, default=None,
                        help="Path to tone‑mapping JSON (optional)")
    args = parser.parse_args()

    root = pathlib.Path(args.root)
    if not root.is_dir():
        sys.exit(f"Provided root '{root}' is not a directory.")

    # Collect text files with potential script definitions
    text_files = [p for p in root.rglob("*.txt") if "script" in p.name.lower()]
    all_script_ids = []
    for txt in text_files:
        all_script_ids.extend(harvest_ids_from_text(txt))

    # Check duplicates
    counter = collections.Counter(all_script_ids)
    duplicates = [sid for sid, cnt in counter.items() if cnt > 1]

    # Router
    router_file = pathlib.Path(args.router) if args.router else None
    if not router_file:
        candidates = [p for p in root.rglob("*.json") if 'router' in p.name.lower()]
        if candidates:
            router_file = candidates[0]
    router_ids = harvest_ids_from_json_router(router_file) if router_file and router_file.exists() else []

    missing_in_library = [sid for sid in router_ids if sid not in all_script_ids]

    # Tone‑map optional check
    tone_missing = []
    if args.tone_map:
        tone_path = pathlib.Path(args.tone_map)
        if tone_path.exists():
            tone_ids = harvest_ids_from_json_router(tone_path)
            tone_missing = [sid for sid in tone_ids if sid not in router_ids]

    print("\n===== SCRIPT‑ID LINTER REPORT =====")
    print(f"Scanned {len(text_files)} script files and found {len(all_script_ids)} IDs.")
    if duplicates:
        print(f"‼️ Duplicate IDs ({len(duplicates)}):", ", ".join(sorted(duplicates)))
    else:
        print("✅ No duplicate script IDs.")

    if router_file:
        print(f"Router file: {router_file.name} • {len(router_ids)} referenced IDs")
        if missing_in_library:
            print(f"⚠️ IDs referenced in router but NOT found in any library ({len(missing_in_library)}):")
            for sid in missing_in_library:
                print("   •", sid)
        else:
            print("✅ All router IDs have matching scripts.")
    else:
        print("⚠️ No router JSON located / specified.")

    if tone_missing:
        print(f"⚠️ Tone‑map references {len(tone_missing)} IDs not in router:")
        for sid in tone_missing:
            print("   •", sid)

    print("===================================\n")
    if duplicates or missing_in_library or tone_missing:
        sys.exit(1)

if __name__ == "__main__":
    main()
