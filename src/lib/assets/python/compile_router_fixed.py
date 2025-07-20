#!/usr/bin/env python3
"""
Supporter Guide GPT — Stage‑2 Router Compiler (Flat Directory)
Scans all *.txt files in the working directory, extracts
`script_id:` and `template_id:` pairs inside each "---" block,
and writes supporter_tone_router_master.json_AUTO.json.

Author: OpenAI o3
"""
import sys, re, json, pathlib

ID_RE  = re.compile(r'^script_id\s*[:=]\s*(\S+)', re.I)
TPL_RE = re.compile(r'^template_id\s*[:=]\s*(\S+)', re.I)

def harvest(root: pathlib.Path):
    mapping, errors = {}, []
for txt in root.glob("*.txt"):
    if "---" not in txt.read_text(encoding="utf-8", errors="ignore"):
        continue  # Skip files without metadata blocks


# Only include files with metadata blocks
        blocks = txt.read_text(encoding="utf-8", errors="ignore").split("---")
        for blk in blocks:
            lines = [l.strip() for l in blk.strip().splitlines()]
            sid = tpl = None
            for line in lines:
                m = ID_RE.match(line)
                if m: sid = m.group(1)
                m2 = TPL_RE.match(line)
                if m2: tpl = m2.group(1)
            if sid or tpl:
                if not sid or not tpl:
                    errors.append(f"Missing field in {txt.name}: script_id={sid} template_id={tpl}")
                elif tpl in mapping:
                    errors.append(f"Duplicate template_id '{tpl}' (second file {txt.name})")
                else:
                    mapping[tpl] = sid
    return mapping, errors

def main():
    root = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else pathlib.Path(".")
    mapping, errors = harvest(root)
    if errors:
        print("=== ERRORS ===")
        for e in errors:
            print("•", e)
        sys.exit(1)

    out_path = root / "supporter_tone_router_master_AUTO.json"
    out_path.write_text(json.dumps(
        [{"template_id": t, "script_id": s} for t, s in sorted(mapping.items())],
        indent=2))
    print(f"✅  Wrote {len(mapping)} entries to {out_path}")
    sys.exit(0)

if __name__ == "__main__":
    main()