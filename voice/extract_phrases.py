"""
extract_phrases.py — Extracts every deterministic speech phrase used by the schedule app.
"""
from __future__ import annotations

import json
import re
from pathlib import Path


def format_duration(seconds: int) -> str:
    if seconds <= 0:
        return "0 seconds"
    days = seconds // 86400
    hours = (seconds % 86400) // 3600
    minutes = (seconds % 3600) // 60
    secs = seconds % 60
    parts: list[str] = []
    if days:
        parts.append(f"{days} day" if days == 1 else f"{days} days")
    if hours:
        parts.append(f"{hours} hour" if hours == 1 else f"{hours} hours")
    if minutes:
        parts.append(f"{minutes} minute" if minutes == 1 else f"{minutes} minutes")
    if not days and not hours and secs:
        parts.append(f"{secs} second" if secs == 1 else f"{secs} seconds")
    return " ".join(parts)


def parse_duration(d_str: str | None) -> int:
    if not d_str:
        return 0
    parts = list(map(int, d_str.split(":")))
    if len(parts) == 2:
        return parts[0] * 3600 + parts[1] * 60
    if len(parts) == 3:
        return parts[0] * 3600 + parts[1] * 60 + parts[2]
    return 0


def interpolate(template: str, variables: dict[str, str]) -> str:
    res = re.sub(r"\{(\w+)\}", lambda m: variables.get(m.group(1), ""), template)
    return re.sub(r"\s+", " ", res).strip()


def get_all_phrases() -> list[str]:
    data_path = Path(__file__).resolve().parent.parent / "public" / "data" / "schedule.json"
    data = json.loads(data_path.read_text(encoding="utf-8"))

    cat_map = {c["id"]: c for c in data.get("categories", [])}
    ev_map = {e["id"]: e for e in data.get("events", [])}

    phrases: set[str] = set()

    # Cargo ship speech
    for a in data.get("cargoShip", {}).get("alerts", []):
        if a.get("speech"):
            phrases.add(a["speech"].strip())

    # Settings test phrase
    phrases.add("This is a test of the speech alert system.")

    leads = [60, 450, 900, 1800]

    for timer in data.get("timers", []):
        ev = ev_map.get(timer.get("eventId"))
        if not ev or ev.get("disabled"):
            continue
        cat = cat_map.get(ev.get("categoryId"))
        dur_sec = parse_duration(timer.get("duration"))
        dur_str = format_duration(dur_sec) if dur_sec else "now"

        start_tmpl = (
            timer.get("messages", {}).get("start")
            or (cat.get("startMessage") if cat else None)
            or "{event} has started."
        )
        vars_start = {
            "event": ev["name"],
            "duration": dur_str,
            "remaining": "0 seconds",
            "label": timer.get("label", ""),
        }
        phrases.add(interpolate(start_tmpl, vars_start))

        rem_tmpl = (
            timer.get("messages", {}).get("reminder")
            or (cat.get("reminderMessage") if cat else None)
            or "{event} will start in {remaining}."
        )
        for lead_sec in leads:
            lead_str = format_duration(lead_sec)
            vars_rem = {
                "event": ev["name"],
                "duration": dur_str,
                "remaining": lead_str,
                "label": timer.get("label", ""),
            }
            phrases.add(interpolate(rem_tmpl, vars_rem))

        phrases.add(f"Audio messages enabled for {ev['name']}.")

    return sorted(phrases)


if __name__ == "__main__":
    all_p = get_all_phrases()
    print(f"Total phrases found: {len(all_p)}")
    for p in all_p[:15]:
        print(f"  - {p}")
