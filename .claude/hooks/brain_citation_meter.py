#!/usr/bin/env python3
"""
Brain citation meter — counts unique brain-note references inside workflow output docs.

Triggered via PostToolUse(Write|Edit). Acts only on files under docs/sprints/ or
docs/discovery/. For each (note_id, doc_path) pair the count is incremented at most
once, so re-edits of the same doc do NOT inflate the metric. lastCitedAt is refreshed
on every edit that still contains the reference.

State lives in brain/.metrics/citations.json and is gitignored via brain/.metrics/.gitignore.

Run with --report to print a summary; the hook entry point reads stdin (Claude Code
PostToolUse JSON payload). Failures are swallowed silently — the meter must never
block a tool call.
"""
import json
import os
import re
import sys
import tempfile
from datetime import datetime, timezone

PROJECT_DIR = os.environ.get("CLAUDE_PROJECT_DIR", os.getcwd())
METRICS_DIR = os.path.join(PROJECT_DIR, "brain", ".metrics")
METRICS_FILE = os.path.join(METRICS_DIR, "citations.json")
GITIGNORE_FILE = os.path.join(METRICS_DIR, ".gitignore")

NUMERIC_NOTE_RE = re.compile(r"\b(DEC|PAT|LES)-\d{1,4}\b")
SLUG_NOTE_RE = re.compile(r"\b(CON|GLO)-[a-z][a-z0-9]*(?:-[a-z0-9]+)*\b")
NOTE_PREFIXES = ("DEC", "PAT", "LES", "CON", "GLO")
INCLUDE_PREFIXES = ("docs/sprints/", "docs/discovery/")

NOTE_DIRS = {
    "DEC": "brain/02-decisions",
    "PAT": "brain/03-patterns",
    "LES": "brain/04-lessons",
    "CON": "brain/01-concepts",
    "GLO": "brain/06-glossary",
}


def now_iso():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def empty_state():
    return {
        "notes": {},
        "totals": {"uniqueNotesCited": 0, "totalCitations": 0, "lastUpdatedAt": None},
    }


def load_metrics():
    if not os.path.exists(METRICS_FILE):
        return empty_state()
    try:
        with open(METRICS_FILE, encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return empty_state()


def save_metrics(data):
    os.makedirs(METRICS_DIR, exist_ok=True)
    if not os.path.exists(GITIGNORE_FILE):
        with open(GITIGNORE_FILE, "w", encoding="utf-8") as f:
            f.write("*\n!.gitignore\n")
    fd, tmp = tempfile.mkstemp(prefix=".citations-", suffix=".json", dir=METRICS_DIR)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, sort_keys=True)
        os.replace(tmp, METRICS_FILE)
    except Exception:
        if os.path.exists(tmp):
            try:
                os.unlink(tmp)
            except Exception:
                pass


def relpath(path):
    try:
        return os.path.relpath(path, PROJECT_DIR)
    except ValueError:
        return path


def update_for_file(file_path):
    if not file_path or not file_path.endswith(".md"):
        return
    rel = relpath(file_path).replace(os.sep, "/")
    if not any(rel.startswith(p) for p in INCLUDE_PREFIXES):
        return
    if not os.path.exists(file_path):
        return

    try:
        with open(file_path, encoding="utf-8") as f:
            content = f.read()
    except Exception:
        return

    found = {m.group(0) for m in NUMERIC_NOTE_RE.finditer(content)}
    found |= {m.group(0) for m in SLUG_NOTE_RE.finditer(content)}
    if not found:
        return

    data = load_metrics()
    notes = data.setdefault("notes", {})
    now = now_iso()

    for note_id in sorted(found):
        entry = notes.get(note_id)
        if entry is None:
            entry = {
                "count": 1,
                "firstCitedAt": now,
                "lastCitedAt": now,
                "citingDocs": [rel],
            }
            notes[note_id] = entry
            continue
        entry["lastCitedAt"] = now
        if rel not in entry["citingDocs"]:
            entry["citingDocs"].append(rel)
            entry["count"] = len(entry["citingDocs"])

    data["totals"] = {
        "uniqueNotesCited": len(notes),
        "totalCitations": sum(n["count"] for n in notes.values()),
        "lastUpdatedAt": now,
    }
    save_metrics(data)


def report():
    data = load_metrics()
    notes = data.get("notes", {})
    totals = data.get("totals", {})

    print("Brain Citation Meter")
    print("─" * 56)
    if not notes:
        print("No citations recorded yet.")
        print(f"State file: {os.path.relpath(METRICS_FILE, PROJECT_DIR)}")
        return

    print(f"Unique notes cited: {totals.get('uniqueNotesCited', 0)}")
    print(f"Total citations:    {totals.get('totalCitations', 0)}")
    print(f"Last updated:       {totals.get('lastUpdatedAt', 'never')}")

    by_prefix = {p: 0 for p in NOTE_PREFIXES}
    for nid in notes:
        prefix = nid.split("-", 1)[0]
        if prefix in by_prefix:
            by_prefix[prefix] += 1
    print("By type:           " + "  ".join(f"{p}={by_prefix[p]}" for p in NOTE_PREFIXES))
    print()

    print("Top cited:")
    sorted_notes = sorted(notes.items(), key=lambda kv: (-kv[1]["count"], kv[0]))
    width = max((len(nid) for nid, _ in sorted_notes[:15]), default=10)
    for nid, entry in sorted_notes[:15]:
        docs = entry["citingDocs"]
        preview = ", ".join(docs[:2])
        more = "" if len(docs) <= 2 else f" (+{len(docs) - 2} more)"
        print(f"  {nid:<{width}}  x{entry['count']:<3d} {preview}{more}")


def inventory_on_disk():
    """Walk brain/ subdirs (recursive) and return {prefix: [note_id, ...]} for what exists."""
    result = {p: [] for p in NOTE_PREFIXES}
    for prefix, subdir in NOTE_DIRS.items():
        full = os.path.join(PROJECT_DIR, subdir)
        if not os.path.isdir(full):
            continue
        for _, _, files in os.walk(full):
            for fn in sorted(files):
                if not fn.endswith(".md") or fn.startswith("."):
                    continue
                stem = fn[:-3]
                if prefix in ("DEC", "PAT", "LES"):
                    m = re.match(rf"^({prefix}-\d{{1,4}})", stem)
                    if m:
                        result[prefix].append(m.group(1))
                else:
                    if stem.startswith(f"{prefix}-"):
                        result[prefix].append(stem)
        result[prefix] = sorted(set(result[prefix]))
    return result


def dashboard(uncited_prefix=None):
    data = load_metrics()
    notes = data.get("notes", {})
    totals = data.get("totals", {})
    on_disk = inventory_on_disk()

    cited_by_prefix = {p: set() for p in NOTE_PREFIXES}
    for nid in notes:
        prefix = nid.split("-", 1)[0]
        if prefix in cited_by_prefix:
            cited_by_prefix[prefix].add(nid)

    if uncited_prefix:
        prefix = uncited_prefix.upper()
        if prefix not in NOTE_PREFIXES:
            print(f"Unknown prefix: {prefix}. Use one of: {', '.join(NOTE_PREFIXES)}")
            return
        uncited = [n for n in on_disk[prefix] if n not in cited_by_prefix[prefix]]
        print(f"Uncited {prefix} notes ({len(uncited)} of {len(on_disk[prefix])}):")
        for n in uncited:
            print(f"  {n}")
        return

    print("Brain Citation Meter — Dashboard")
    print("=" * 56)
    print()

    print("Inventory (on disk vs cited)")
    total_disk = total_cited = 0
    for p in NOTE_PREFIXES:
        n_disk = len(on_disk[p])
        n_cited = len(cited_by_prefix[p])
        pct = (n_cited * 100 / n_disk) if n_disk else 0.0
        total_disk += n_disk
        total_cited += n_cited
        print(f"  {p:3s}  {n_disk:4d} on disk  /  {n_cited:4d} cited  ({pct:5.1f}%)")
    pct_all = (total_cited * 100 / total_disk) if total_disk else 0.0
    print(f"  {'─' * 50}")
    print(f"  ALL  {total_disk:4d} on disk  /  {total_cited:4d} cited  ({pct_all:5.1f}%)")
    print()

    print("Activity")
    print(f"  Total citations:    {totals.get('totalCitations', 0)}")
    print(f"  Last updated:       {totals.get('lastUpdatedAt', 'never')}")
    print()

    if notes:
        print("Top cited (top 10)")
        sorted_notes = sorted(notes.items(), key=lambda kv: (-kv[1]["count"], kv[0]))
        width = max((len(nid) for nid, _ in sorted_notes[:10]), default=10)
        for nid, entry in sorted_notes[:10]:
            docs = entry["citingDocs"]
            preview = ", ".join(docs[:1])
            more = "" if len(docs) <= 1 else f" (+{len(docs) - 1} more)"
            print(f"  {nid:<{width}}  x{entry['count']:<3d} {preview}{more}")
        print()

    print("Pruning candidates — never cited")
    any_uncited = False
    for p in NOTE_PREFIXES:
        uncited = [n for n in on_disk[p] if n not in cited_by_prefix[p]]
        if not uncited:
            continue
        any_uncited = True
        preview = ", ".join(uncited[:3])
        more = "" if len(uncited) <= 3 else f" (+{len(uncited) - 3} more)"
        print(f"  {p}: {len(uncited):3d} never cited — {preview}{more}")
    if not any_uncited:
        print("  (none — every note has been cited at least once)")
    print()
    print("Tip: full pruning list per type → --uncited <PREFIX>   (e.g. --uncited CON)")


def main():
    args = sys.argv[1:]
    if args and args[0] == "--report":
        report()
        return
    if args and args[0] == "--dashboard":
        dashboard()
        return
    if args and args[0] == "--uncited" and len(args) >= 2:
        dashboard(uncited_prefix=args[1])
        return

    try:
        payload = json.load(sys.stdin)
    except Exception:
        return
    file_path = payload.get("tool_input", {}).get("file_path", "")
    update_for_file(file_path)


if __name__ == "__main__":
    try:
        main()
    except Exception:
        # Never block a tool call from a metering hook
        pass
