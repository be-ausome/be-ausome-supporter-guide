#!/usr/bin/env python3
"""
Merge lean auto‑generated router into rich master router.

Keeps all metadata from supporter_tone_router_master.json
but refreshes `script_id` from supporter_tone_router_master_AUTO.json.
"""
import json, pathlib

root = pathlib.Path(__file__).parent
rich_path = root / "supporter_tone_router_master.json"
auto_path = root / "supporter_tone_router_master_AUTO.json"

rich = json.loads(rich_path.read_text())
auto = {row["template_id"]: row["script_id"] for row in json.loads(auto_path.read_text())}

for row in rich:
    tpl = row.get("template_id") or row.get("scenario_tag")
    if tpl in auto:
        row["script_id"] = auto[tpl]

rich_path.write_text(json.dumps(rich, indent=2))
print(f"✅  Updated {rich_path.name} with {len(auto)} script_id mappings")