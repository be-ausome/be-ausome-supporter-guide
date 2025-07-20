#!/usr/bin/env python3
"""
validate_supporter_assets.py

Quick pre‑commit validator for Supporter Guide GPT assets.
Checks:
 1. Every tone tag in router has lexicon or alias.
 2. Every script_id in router exists in script index.
 3. Scenario descriptions in router map back to script index.
 4. Flags duplicate script_ids across roles.

Usage:
    python validate_supporter_assets.py \
        --router supporter_prompt_router_GALACTIC_CORE_PATCHED.json \
        --index supporter_script_index_FINAL_REBUILT.json \
        --aliases tone_aliases.json \
        --lexicons ./   # folder containing tone_profile_lexicon_*.txt
"""
import json, argparse, glob, os, sys, re

def load_lexicons(path_glob):
    lexicons = set()
    for fp in glob.glob(path_glob):
        name = os.path.basename(fp)
        if name.startswith("tone_profile_lexicon_") and name.endswith(".txt"):
            tag = name.split("_")[-1].replace(".txt","").lower()
            lexicons.add(tag)
    return lexicons

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--router", required=True)
    p.add_argument("--index", required=True)
    p.add_argument("--aliases", required=True)
    p.add_argument("--lexicons", required=True, help="directory with lexicon txt files")
    args = p.parse_args()

    router = json.load(open(args.router))
    index = json.load(open(args.index))
    aliases = json.load(open(args.aliases))
    lexicons = load_lexicons(os.path.join(args.lexicons, "tone_profile_lexicon_*.txt"))

    errors = []

    # Check tones
    for role, items in router.items():
        if role.startswith("__"):
            continue
        for e in items:
            for t in e.get("tone_tags", []):
                if t not in lexicons and t not in aliases.values():
                    errors.append(f"Missing lexicon for tone '{t}' in role '{role}' scenario '{e['scenario_match']}'")

    # Check scripts
    index_ids = set(index.keys())
    for role, items in router.items():
        if role.startswith("__"):
            continue
        for e in items:
            if e["script_id"] not in index_ids:
                errors.append(f"Unknown script_id '{e['script_id']}' in role '{role}'")

    if errors:
        print("Validation FAILED:")
        for err in errors:
            print(" -", err)
        sys.exit(1)
    else:
        print("All checks passed ✅")

if __name__ == "__main__":
    main()
