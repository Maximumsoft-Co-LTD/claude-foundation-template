#!/usr/bin/env bash
# Claude Foundation installer — bootstraps the workflow into a target repo.
#
# Usage:
#   ./install.sh [target-path] [--local [source]] [--remote] [--yes]
#
# Defaults: target = current dir, mode = auto (local if cwd looks like the
# template, otherwise remote).

set -euo pipefail

REPO_URL="https://github.com/Maximumsoft-Co-LTD/claude-foundation-template"
SCRIPT_NAME="$(basename "$0")"

# ── ANSI colors (disabled if not a TTY) ─────────────────────────────────────
if [ -t 1 ]; then
  R=$'\033[0;31m'; G=$'\033[0;32m'; Y=$'\033[1;33m'; B=$'\033[0;34m'; D=$'\033[2m'; N=$'\033[0m'
else
  R=''; G=''; Y=''; B=''; D=''; N=''
fi

info()  { printf "%s\n" "${B}▸${N} $*"; }
ok()    { printf "%s\n" "${G}✓${N} $*"; }
warn()  { printf "%s\n" "${Y}⚠${N} $*" >&2; }
fail()  { printf "%s\n" "${R}✗${N} $*" >&2; exit 1; }

usage() {
  cat <<EOF
${SCRIPT_NAME} — Claude Foundation installer

Usage:
  ${SCRIPT_NAME} [target-path] [--local [source]] [--remote] [--yes]

Arguments:
  target-path      Where to install (default: current directory)

Options:
  --local [src]    Use a local clone as source. If no path is given, use \$PWD
                   (requires \$PWD to look like the template repo).
  --remote         Force git clone from GitHub (default when --local not used).
  --yes, -y        Skip interactive prompts (for CI / scripted use).
  --dry-run        Preview changes without writing anything.
  -h, --help       Show this help.

Examples:
  ./install.sh                         # remote → current directory
  ./install.sh ~/my-repo                # remote → specific target
  ./install.sh ~/my-repo --local        # cwd is the template → copy into target
  ./install.sh ~/my-repo --local ~/tpl  # explicit source → target
  ./install.sh ~/my-repo --dry-run      # show what would change, write nothing
EOF
}

# ── Version helpers ─────────────────────────────────────────────────────────
get_source_version() {
  local src="$1"
  local v=""
  if [ -f "$src/CHANGELOG.md" ]; then
    v="$(grep -m1 -oE '^## \[[0-9]+\.[0-9]+\.[0-9]+\]' "$src/CHANGELOG.md" 2>/dev/null | tr -d '[]' | awk '{print $2}')"
  fi
  printf "%s\n" "${v:-unknown}"
}

get_source_sha() {
  git -C "$1" rev-parse --short HEAD 2>/dev/null || echo "unknown"
}

read_installed_version() {
  local marker="$1/.claude/.foundation-version"
  [ -f "$marker" ] || return 0
  grep -E '^version=' "$marker" 2>/dev/null | head -1 | cut -d= -f2
}

# ── Parse args ──────────────────────────────────────────────────────────────
TARGET_PATH=""
SOURCE_PATH=""
MODE=""          # "local" | "remote" | ""
ASSUME_YES="no"
DRY_RUN="no"

while [ $# -gt 0 ]; do
  case "$1" in
    -h|--help) usage; exit 0 ;;
    --local)
      MODE="local"
      if [ $# -gt 1 ] && [ "${2:0:1}" != "-" ] && [ -d "$2" ]; then
        SOURCE_PATH="$2"; shift
      fi
      ;;
    --remote) MODE="remote" ;;
    -y|--yes) ASSUME_YES="yes" ;;
    --dry-run) DRY_RUN="yes" ;;
    -*) fail "Unknown option: $1" ;;
    *)
      if [ -z "$TARGET_PATH" ]; then
        TARGET_PATH="$1"
      else
        fail "Unexpected positional argument: $1"
      fi
      ;;
  esac
  shift
done

# Expand ~ and resolve to absolute path
expand_path() {
  local p="$1"
  # shellcheck disable=SC2088
  case "$p" in "~"|"~/"*) p="${HOME}${p#\~}" ;; esac
  ( cd "$(dirname "$p")" 2>/dev/null && printf "%s/%s\n" "$(pwd)" "$(basename "$p")" ) || printf "%s\n" "$p"
}

TARGET_PATH="${TARGET_PATH:-$PWD}"
TARGET_PATH="$(expand_path "$TARGET_PATH")"
[ -n "$SOURCE_PATH" ] && SOURCE_PATH="$(expand_path "$SOURCE_PATH")"

# Mode auto-detect
looks_like_template() {
  [ -x "$1/install.sh" ] && [ -f "$1/brain/BRAIN-INDEX.md" ] && [ -d "$1/.claude/commands" ] && [ -f "$1/.claude/commands/_WORKFLOW-REF.md" ]
}

if [ -z "$MODE" ]; then
  if looks_like_template "$PWD"; then
    MODE="local"; SOURCE_PATH="$PWD"
  else
    MODE="remote"
  fi
fi

if [ "$MODE" = "local" ] && [ -z "$SOURCE_PATH" ]; then
  SOURCE_PATH="$PWD"
  looks_like_template "$SOURCE_PATH" || fail "--local used but \$PWD ($SOURCE_PATH) doesn't look like the template repo. Pass an explicit source path or use --remote."
fi

# ── Preflight ───────────────────────────────────────────────────────────────
info "Preflight"

command -v python3 >/dev/null 2>&1 || fail "python3 is required (hooks need >= 3.10)"
PYV="$(python3 -c 'import sys; print("%d.%d" % sys.version_info[:2])' 2>/dev/null || echo "0.0")"
PY_OK="$(python3 -c 'import sys; print(1 if sys.version_info >= (3,10) else 0)' 2>/dev/null || echo 0)"
[ "$PY_OK" = "1" ] || fail "python3 >= 3.10 required (found ${PYV}). Hooks use \"X | Y\" union syntax."
ok "python3 ${PYV}"

command -v git >/dev/null 2>&1 || fail "git is required"
ok "git $(git --version | awk '{print $3}')"

# Target dir
if [ ! -d "$TARGET_PATH" ]; then
  if [ "$ASSUME_YES" = "yes" ]; then
    mkdir -p "$TARGET_PATH"
    ok "created target: $TARGET_PATH"
  else
    printf "Target %s doesn't exist. Create it? [y/N] " "$TARGET_PATH"
    read -r ans
    case "$ans" in y|Y|yes|YES) mkdir -p "$TARGET_PATH" ;; *) fail "aborted" ;; esac
  fi
fi
TARGET_PATH="$(expand_path "$TARGET_PATH")"

# Self-copy guard
if [ "$MODE" = "local" ]; then
  case "$TARGET_PATH" in
    "$SOURCE_PATH"|"$SOURCE_PATH"/*) fail "target ($TARGET_PATH) is the same as or inside source ($SOURCE_PATH)" ;;
  esac
fi

# Existing foundation detection
ACTION="install"   # install | reinstall | merge
if [ -f "$TARGET_PATH/.claude/commands/_WORKFLOW-REF.md" ]; then
  if [ "$ASSUME_YES" = "yes" ] || [ "$DRY_RUN" = "yes" ]; then
    ACTION="merge"
  else
    warn "Foundation already installed at $TARGET_PATH"
    printf "Choose: [r]einstall (overwrite commands/rules/hooks) / [m]erge (add missing only) / [a]bort — default merge: "
    read -r ans
    case "$ans" in r|R|reinstall) ACTION="reinstall" ;; a|A|abort) fail "aborted" ;; *) ACTION="merge" ;; esac
  fi
fi

# ── Source preparation ──────────────────────────────────────────────────────
TMP_SRC=""
cleanup() {
  if [ -n "$TMP_SRC" ] && [ -d "$TMP_SRC" ]; then rm -rf "$TMP_SRC"; fi
  return 0
}
trap cleanup EXIT

if [ "$MODE" = "remote" ]; then
  info "Cloning template from $REPO_URL"
  TMP_SRC="$(mktemp -d -t foundation-init.XXXXXX)"
  git clone --depth 1 "$REPO_URL" "$TMP_SRC" >/dev/null 2>&1 || fail "git clone failed (repo: $REPO_URL)"
  SOURCE_PATH="$TMP_SRC"
  ok "cloned to $SOURCE_PATH"
fi

for f in ".claude/commands/_WORKFLOW-REF.md" "brain/BRAIN-INDEX.md" "docs/templates" "CLAUDE.md"; do
  [ -e "$SOURCE_PATH/$f" ] || fail "source is missing $f — is $SOURCE_PATH really the template repo?"
done
ok "source validated: $SOURCE_PATH"

# ── Scan target ─────────────────────────────────────────────────────────────
info "Scanning $TARGET_PATH"

STACKS=()
[ -f "$TARGET_PATH/package.json" ]     && STACKS+=("node")
[ -f "$TARGET_PATH/pyproject.toml" ]   && STACKS+=("python")
[ -f "$TARGET_PATH/requirements.txt" ] && STACKS+=("python")
[ -f "$TARGET_PATH/go.mod" ]           && STACKS+=("go")
[ -f "$TARGET_PATH/Cargo.toml" ]       && STACKS+=("rust")
[ -f "$TARGET_PATH/composer.json" ]    && STACKS+=("php")
[ -f "$TARGET_PATH/Gemfile" ]          && STACKS+=("ruby")
[ -f "$TARGET_PATH/pom.xml" ]          && STACKS+=("java-maven")
if [ -f "$TARGET_PATH/build.gradle" ] || [ -f "$TARGET_PATH/build.gradle.kts" ]; then STACKS+=("jvm-gradle"); fi
if [ -f "$TARGET_PATH/Dockerfile" ] || [ -f "$TARGET_PATH/docker-compose.yml" ]; then STACKS+=("docker"); fi

# Dedupe
if [ "${#STACKS[@]}" -gt 0 ]; then
  STACKS=($(printf "%s\n" "${STACKS[@]}" | awk '!seen[$0]++'))
fi

# Framework hints from package.json
FRAMEWORKS=""
if [ -f "$TARGET_PATH/package.json" ]; then
  for fw in react next vue svelte express nestjs remix astro nuxt vite; do
    grep -q "\"$fw\"" "$TARGET_PATH/package.json" 2>/dev/null && FRAMEWORKS="${FRAMEWORKS}${fw} "
  done
  grep -q '"typescript"' "$TARGET_PATH/package.json" 2>/dev/null && FRAMEWORKS="${FRAMEWORKS}typescript "
fi
FRAMEWORKS="${FRAMEWORKS% }"

# Structure detection (first match wins; always exit 0 so set -e doesn't trip on "none matched")
find_first_dir() {
  local base="$1"; shift
  for d in "$@"; do
    if [ -d "$base/$d" ]; then printf "%s\n" "$d"; return 0; fi
  done
  return 0
}
FE_ROOT="$(find_first_dir "$TARGET_PATH" "src/components" "app" "pages" "frontend" "web" "client" "src/app" "src/pages")"
BE_ROOT="$(find_first_dir "$TARGET_PATH" "src/server" "backend" "api" "server" "services" "src/api")"
TEST_ROOT="$(find_first_dir "$TARGET_PATH" "tests" "test" "__tests__" "spec")"

# Git conventions
DEFAULT_BRANCH=""; COMMIT_STYLE=""
if [ -d "$TARGET_PATH/.git" ]; then
  DEFAULT_BRANCH="$(git -C "$TARGET_PATH" branch --show-current 2>/dev/null || true)"
  if git -C "$TARGET_PATH" log -1 >/dev/null 2>&1; then
    local_log="$(git -C "$TARGET_PATH" log --format='%s' -n 20 2>/dev/null || true)"
    if printf "%s" "$local_log" | grep -qE '^(feat|fix|docs|chore|refactor|test|style|perf)(\(.+\))?:' ; then
      COMMIT_STYLE="conventional"
    fi
  fi
fi

STACK_DISPLAY="${STACKS[*]:-unknown}"
ok "stack: ${STACK_DISPLAY}${FRAMEWORKS:+ ($FRAMEWORKS)}"
ok "layout: FE=${FE_ROOT:-?}  BE=${BE_ROOT:-?}  tests=${TEST_ROOT:-?}"
ok "git: branch=${DEFAULT_BRANCH:-?}  commit-style=${COMMIT_STYLE:-?}"

# ── Version detection ───────────────────────────────────────────────────────
SOURCE_VERSION="$(get_source_version "$SOURCE_PATH")"
SOURCE_SHA="$(get_source_sha "$SOURCE_PATH")"
INSTALLED_VERSION="$(read_installed_version "$TARGET_PATH" || true)"

if [ -n "${INSTALLED_VERSION:-}" ]; then
  if [ "$INSTALLED_VERSION" = "$SOURCE_VERSION" ]; then
    ok "foundation version: ${INSTALLED_VERSION} (same as source)"
  else
    ok "foundation upgrade: ${INSTALLED_VERSION} → ${SOURCE_VERSION}"
  fi
else
  ok "source version: ${SOURCE_VERSION} (sha ${SOURCE_SHA})"
fi

# ── Diff preview (feature A) ────────────────────────────────────────────────
# For each category, count: NEW (src only), CHANGED (both, different), SAME (both, identical), CUSTOM (dst only)
preview_category() {
  local label="$1" src="$2" dst="$3"
  [ -d "$src" ] || { printf "  %-26s %s\n" "$label" "(source missing)"; return; }
  if [ ! -d "$dst" ]; then
    local n; n="$(find "$src" -type f 2>/dev/null | wc -l | tr -d ' ')"
    printf "  %-26s ${G}+%s new${N}  (none existing)\n" "$label" "$n"
    return
  fi
  python3 - "$src" "$dst" "$label" <<'PY'
import sys, os, hashlib, pathlib
src, dst, label = sys.argv[1], sys.argv[2], sys.argv[3]
def walk(root):
    root = pathlib.Path(root)
    for p in root.rglob("*"):
        if p.is_file(): yield str(p.relative_to(root))
def sha(p):
    h = hashlib.sha1()
    with open(p, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""): h.update(chunk)
    return h.hexdigest()
src_files = set(walk(src))
dst_files = set(walk(dst))
new = sorted(src_files - dst_files)
custom = sorted(dst_files - src_files)
both = sorted(src_files & dst_files)
changed, same = [], []
for f in both:
    if sha(os.path.join(src,f)) == sha(os.path.join(dst,f)): same.append(f)
    else: changed.append(f)
G = "\033[0;32m"; Y = "\033[1;33m"; D = "\033[2m"; N = "\033[0m"
parts = []
if new:     parts.append(f"{G}+{len(new)} new{N}")
if changed: parts.append(f"{Y}~{len(changed)} changed{N}")
if same:    parts.append(f"{D}={len(same)} same{N}")
if custom:  parts.append(f"{D}·{len(custom)} custom-kept{N}")
print(f"  {label:<26} " + "  ".join(parts))
# Show first 3 filenames of each non-empty diff category
if new[:3]:     print(f"    {G}new:{N}     " + ", ".join(new[:3]) + (f", … +{len(new)-3} more" if len(new)>3 else ""))
if changed[:3]: print(f"    {Y}changed:{N} " + ", ".join(changed[:3]) + (f", … +{len(changed)-3} more" if len(changed)>3 else ""))
if custom[:3]:  print(f"    {D}custom:{N}  " + ", ".join(custom[:3]) + (f", … +{len(custom)-3} more" if len(custom)>3 else ""))
PY
}

# ── Copy plan ───────────────────────────────────────────────────────────────
info "Copy plan"
printf "  Target  : %s\n" "$TARGET_PATH"
printf "  Mode    : %s (%s)\n" "$MODE" "$ACTION"
printf "  Source  : %s (v%s, %s)\n" "$SOURCE_PATH" "$SOURCE_VERSION" "$SOURCE_SHA"
[ -n "${INSTALLED_VERSION:-}" ] && printf "  Current : v%s installed\n" "$INSTALLED_VERSION"
[ "$DRY_RUN" = "yes" ] && printf "  ${Y}DRY RUN — no files will be written${N}\n"
printf "\n  ${D}Preview (per category):${N}\n"
preview_category ".claude/commands/"  "$SOURCE_PATH/.claude/commands"  "$TARGET_PATH/.claude/commands"
preview_category ".claude/rules/"     "$SOURCE_PATH/.claude/rules"     "$TARGET_PATH/.claude/rules"
preview_category ".claude/hooks/"     "$SOURCE_PATH/.claude/hooks"     "$TARGET_PATH/.claude/hooks"
preview_category ".claude/skills/"    "$SOURCE_PATH/.claude/skills"    "$TARGET_PATH/.claude/skills"
preview_category "brain/"             "$SOURCE_PATH/brain"             "$TARGET_PATH/brain"
preview_category "docs/templates/"    "$SOURCE_PATH/docs/templates"    "$TARGET_PATH/docs/templates"

printf "\n  ${D}Safety rules in effect:${N}\n"
case "$ACTION" in
  merge)
    cat <<EOF
    - ${Y}~changed${N} files → ${G}kept${N} (template update NOT applied — use reinstall to force)
    - +new files → added
    - ·custom files → always kept
    - .claude/settings.json → ${G}JSON-aware merge${N} (new hooks added, existing preserved)
    - CLAUDE.md, docs/BACKLOG.md → never overwritten if present
    - brain/ notes → never overwritten
    - docs/templates/ → overwritten (template skeletons)
EOF
    ;;
  reinstall)
    cat <<EOF
    - ${Y}~changed${N} files → ${R}OVERWRITTEN${N} with template version
    - +new files → added
    - ·custom files → kept (files you added are safe)
    - .claude/settings.json → ${G}JSON-aware merge${N} (new hooks added, existing preserved)
    - CLAUDE.md, docs/BACKLOG.md → still never overwritten if present
    - brain/ notes → still never overwritten
    - docs/templates/ → overwritten
EOF
    ;;
  install)
    cat <<EOF
    - All files copied fresh
    - CLAUDE.md generated as stack-aware starter (TBD markers to fill)
    - .claude/settings.json copied from template
EOF
    ;;
esac

if [ "$DRY_RUN" = "yes" ]; then
  printf "\n${Y}✓ Dry run complete. Re-run without --dry-run to apply.${N}\n"
  exit 0
fi

if [ "$ASSUME_YES" != "yes" ]; then
  printf "\nProceed? [y/N] "
  read -r ans
  case "$ans" in y|Y|yes|YES) : ;; *) fail "aborted" ;; esac
fi

# ── Copy ────────────────────────────────────────────────────────────────────
info "Installing"

copy_dir_merge() {
  local src="$1" dst="$2"
  [ -d "$src" ] || return 0
  mkdir -p "$dst"
  if [ "$ACTION" = "reinstall" ]; then
    cp -R "$src/." "$dst/"
  else
    # cp -n = no-clobber; quiet about skips
    cp -Rn "$src/." "$dst/" 2>/dev/null || true
  fi
}

copy_dir_merge "$SOURCE_PATH/.claude/commands" "$TARGET_PATH/.claude/commands"
copy_dir_merge "$SOURCE_PATH/.claude/rules"    "$TARGET_PATH/.claude/rules"
copy_dir_merge "$SOURCE_PATH/.claude/hooks"    "$TARGET_PATH/.claude/hooks"
copy_dir_merge "$SOURCE_PATH/.claude/skills"   "$TARGET_PATH/.claude/skills"

# settings.json — JSON-aware merge (feature E)
# - If target missing → copy as-is
# - If target present → merge template hooks into user's config, preserving user's hooks
#   and any other top-level keys; back up user's original first.
SETTINGS_RESULT="unchanged"
if [ -f "$SOURCE_PATH/.claude/settings.json" ]; then
  mkdir -p "$TARGET_PATH/.claude"
  if [ ! -f "$TARGET_PATH/.claude/settings.json" ]; then
    cp "$SOURCE_PATH/.claude/settings.json" "$TARGET_PATH/.claude/settings.json"
    SETTINGS_RESULT="copied"
  else
    SETTINGS_RESULT="$(python3 - "$SOURCE_PATH/.claude/settings.json" "$TARGET_PATH/.claude/settings.json" <<'PY'
import json, sys, shutil, time, pathlib
src_f, dst_f = sys.argv[1], sys.argv[2]
try:
    src = json.load(open(src_f))
    dst = json.load(open(dst_f))
except Exception as e:
    print(f"skipped: JSON parse error ({e})"); sys.exit(0)

added = 0
# Merge hooks: for each event (PostToolUse, PreToolUse, etc.)
src_hooks = src.get("hooks", {})
dst_hooks = dst.setdefault("hooks", {}) if "hooks" in src else dst.get("hooks", {})
for event, src_entries in src_hooks.items():
    if event not in dst_hooks:
        dst_hooks[event] = src_entries
        added += sum(len(e.get("hooks", [])) for e in src_entries)
        continue
    dst_entries = dst_hooks[event]
    for src_entry in src_entries:
        matcher = src_entry.get("matcher", "*")
        target_entry = next((e for e in dst_entries if e.get("matcher","*") == matcher), None)
        if target_entry is None:
            dst_entries.append(src_entry)
            added += len(src_entry.get("hooks", []))
            continue
        existing_cmds = {h.get("command") for h in target_entry.get("hooks", []) if "command" in h}
        for h in src_entry.get("hooks", []):
            if h.get("command") not in existing_cmds:
                target_entry.setdefault("hooks", []).append(h)
                added += 1
if "hooks" in src and "hooks" not in dst:
    dst["hooks"] = src_hooks

if added == 0:
    print("no-change")
else:
    # Backup
    bak = f"{dst_f}.bak-{int(time.time())}"
    shutil.copy2(dst_f, bak)
    json.dump(dst, open(dst_f, "w"), indent=2)
    print(f"merged:{added}:{pathlib.Path(bak).name}")
PY
)"
  fi
fi

# Brain — never overwrite existing notes
copy_dir_merge "$SOURCE_PATH/brain" "$TARGET_PATH/brain"

# docs/templates — overwrite is fine
mkdir -p "$TARGET_PATH/docs/templates"
cp -R "$SOURCE_PATH/docs/templates/." "$TARGET_PATH/docs/templates/"

# docs/BACKLOG.md — only if missing
if [ ! -f "$TARGET_PATH/docs/BACKLOG.md" ] && [ -f "$SOURCE_PATH/docs/BACKLOG.md" ]; then
  cp "$SOURCE_PATH/docs/BACKLOG.md" "$TARGET_PATH/docs/BACKLOG.md"
fi

# docs/WORKFLOW-QUICKREF.md — only if missing
if [ ! -f "$TARGET_PATH/docs/WORKFLOW-QUICKREF.md" ] && [ -f "$SOURCE_PATH/docs/WORKFLOW-QUICKREF.md" ]; then
  cp "$SOURCE_PATH/docs/WORKFLOW-QUICKREF.md" "$TARGET_PATH/docs/WORKFLOW-QUICKREF.md"
fi

# Ensure sprints dir exists (empty — /new-sprint fills it)
mkdir -p "$TARGET_PATH/docs/sprints" "$TARGET_PATH/docs/discovery"

ok "files copied"

# Report settings.json outcome
case "$SETTINGS_RESULT" in
  copied)     ok "settings.json: copied (no prior config)" ;;
  no-change)  ok "settings.json: already up-to-date (no hooks added)" ;;
  merged:*)   added="${SETTINGS_RESULT#merged:}"; added="${added%:*}"
              bak="${SETTINGS_RESULT##*:}"
              ok "settings.json: merged ${added} new hook(s); backup saved as ${bak}" ;;
  skipped:*)  warn "settings.json: ${SETTINGS_RESULT#skipped: }" ;;
  unchanged)  : ;;
esac

# ── Adapt path rules ────────────────────────────────────────────────────────
FE_RULE="$TARGET_PATH/.claude/rules/frontend.md"
BE_RULE="$TARGET_PATH/.claude/rules/backend.md"

rewrite_rule_paths() {
  local rule_file="$1"; shift
  local -a globs=("$@")
  [ -f "$rule_file" ] || return 0
  [ ${#globs[@]} -gt 0 ] || return 0

  # Build new frontmatter paths block
  python3 - "$rule_file" "${globs[@]}" <<'PY'
import sys, pathlib
path = pathlib.Path(sys.argv[1])
globs = sys.argv[2:]
text = path.read_text()
if not text.startswith("---\n"):
    sys.exit(0)
end = text.find("\n---\n", 4)
if end == -1:
    sys.exit(0)
fm = text[4:end]
body = text[end+5:]
lines = fm.splitlines()
new_lines = []
in_paths = False
for line in lines:
    if line.startswith("paths:"):
        in_paths = True
        new_lines.append("paths:")
        for g in globs:
            new_lines.append(f'  - "{g}"')
        continue
    if in_paths:
        if line.startswith("  -") or line.startswith("  \"") or line.strip().startswith("- "):
            continue
        in_paths = False
    new_lines.append(line)
new_fm = "\n".join(new_lines)
path.write_text(f"---\n{new_fm}\n---\n{body}")
PY
}

RULES_ADAPTED="no"
if [ -n "$FE_ROOT" ]; then
  FE_GLOBS=("$FE_ROOT/**/*")
  case " $FRAMEWORKS " in
    *" typescript "*|*" react "*|*" next "*) FE_GLOBS=("$FE_ROOT/**/*.{ts,tsx}" "$FE_ROOT/**/*") ;;
    *" vue "*)    FE_GLOBS=("$FE_ROOT/**/*.vue" "$FE_ROOT/**/*.{ts,js}") ;;
    *" svelte "*) FE_GLOBS=("$FE_ROOT/**/*.svelte" "$FE_ROOT/**/*.{ts,js}") ;;
  esac
  rewrite_rule_paths "$FE_RULE" "${FE_GLOBS[@]}" && RULES_ADAPTED="yes"
fi
if [ -n "$BE_ROOT" ]; then
  BE_GLOBS=("$BE_ROOT/**/*")
  case " ${STACKS[*]} " in
    *" python "*) BE_GLOBS=("$BE_ROOT/**/*.py") ;;
    *" go "*)     BE_GLOBS=("$BE_ROOT/**/*.go") ;;
    *" node "*)   BE_GLOBS=("$BE_ROOT/**/*.{ts,js}") ;;
  esac
  rewrite_rule_paths "$BE_RULE" "${BE_GLOBS[@]}" && RULES_ADAPTED="yes"
fi

if [ "$RULES_ADAPTED" = "yes" ]; then ok "path rules adapted to detected roots"
else warn "could not auto-detect FE/BE roots — edit .claude/rules/{frontend,backend}.md manually"
fi

# ── Write CLAUDE.md ─────────────────────────────────────────────────────────
CLAUDE_MD="$TARGET_PATH/CLAUDE.md"
CLAUDE_ACTION="kept"
if [ ! -f "$CLAUDE_MD" ]; then
  CLAUDE_ACTION="created"
  STACK_LINE="${STACK_DISPLAY}${FRAMEWORKS:+ ($FRAMEWORKS)}"
  cat > "$CLAUDE_MD" <<EOF
# CLAUDE.md

This file is loaded by Claude Code on every session and drives all workflow behavior. Fill the four sections below — the rest is workflow infrastructure and should stay intact.

## Project Overview

<!-- TBD — describe what the project does, who uses it, and the key product goals. Replace this. -->

## Development Commands

\`\`\`bash
# TBD — add build, test, lint, and run commands for your stack
\`\`\`

## Architecture

<!-- TBD — entry points, service boundaries, key abstractions. Starting hints from install scan: -->

Detected during install:
- Stack: ${STACK_LINE}
- Frontend root: ${FE_ROOT:-not detected}
- Backend root: ${BE_ROOT:-not detected}
- Tests root: ${TEST_ROOT:-not detected}
- Default branch: ${DEFAULT_BRANCH:-not detected}
- Commit style: ${COMMIT_STYLE:-not detected}

## Team Conventions

- Branch format: \`SP[N]/SP[N]-T[NNN]-short-description\`
- Commit format: \`SP[N]-T[NNN] type: description\` (max 72 chars)
- Commit types: \`feat\` \`fix\` \`test\` \`docs\` \`refactor\` \`chore\`
- No direct commits to \`main\`; branch per task

## Key Constraints

- Task IDs are global and never reset across sprints
- Tasks sized at 13 story points must be broken down before any work begins
- Tests must be written before implementation code — never mocks at the integration layer
- Hooks require Python >= 3.10
- **Confidence Gate:** AI must be >= 90% confident before proceeding with any workflow command. See \`.claude/rules/confidence-gate.md\`

---

## 🧠 Claude Brain (Knowledge Vault)

Living knowledge base in \`brain/\` — decisions, patterns, lessons across sprints.

**Access rules:** read \`brain/BRAIN-INDEX.md\` only when the task requires it — see \`.claude/rules/brain.md\`.

**Growth:** \`/retro-sprint\` Step 6 appends learnings — no separate command needed.

---

## Workflow

### Scrum hierarchy

| Template term | Scrum term | Deployable? | User value? |
|---------------|-----------|-------------|-------------|
| **Sprint** (\`SP[N]\`) | Epic — business theme across stories | no | no |
| **Task** (\`SP[N]-T[NNN]\`) | Story — vertical slice (FE+BE+data) | **yes** | **yes** |
| **Scope Overview bullet** | Feature-area summary inside a story | no | no |
| **Implementation Plan row** | Engineering task — layer-level work | no | no |
| **Implementation Plan checkbox** | Subtask — atomic 2–5 min action | no | no |

"Task" always means a Scrum **Story** unless the context explicitly says "engineering task."

### Command chain

\`/discovery → /new-sprint → /requirement → /implement → /issue (loop) → /code-review → /testing → /retro-task → /git-commit → /next-task → /retro-sprint\`

\`/requirement\` produces the unified story doc (requirement + FE design + BE design + Implementation Plan + TDD test plan) — 1 task = 1 doc.

Parallel tasks: \`/run-tasks [task-id] ...\` or \`/run-tasks-p [task-id] ...\`

Full reference: \`.claude/commands/_WORKFLOW-REF.md\`

## Superpowers Integration

Template commands take priority over superpowers skills. See \`.claude/rules/superpowers.md\`. Graceful degradation when not installed.

## Context7 Integration

Used at \`/requirement\`, \`/implement\`, \`/debug\`, \`/code-review\`, \`/testing\`, \`/dependency-update\` to fetch up-to-date library docs. Graceful degradation when not installed.

---

## First run

1. Fill the four sections above (or run \`/discovery disc-001 <first-feature>\` — Claude will help fill them from your README).
2. Review path globs in \`.claude/rules/frontend.md\` and \`.claude/rules/backend.md\`.
3. \`/new-sprint SP1 "First sprint"\` → \`/requirement SP1-T001\` → begin.
EOF
fi

# ── Write version marker (feature C) ────────────────────────────────────────
# Records what template version is installed — enables smart upgrade logic on re-run.
VERSION_MARKER="$TARGET_PATH/.claude/.foundation-version"
INSTALLED_AT="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
cat > "$VERSION_MARKER" <<EOF
# Claude Foundation version marker — managed by install.sh. Do not edit.
version=${SOURCE_VERSION}
source_sha=${SOURCE_SHA}
template_origin=${MODE}
installed_at=${INSTALLED_AT}
previous_version=${INSTALLED_VERSION:-none}
EOF
ok "version marker: v${SOURCE_VERSION} (sha ${SOURCE_SHA}) written to .claude/.foundation-version"

# ── Output ──────────────────────────────────────────────────────────────────
printf "\n${G}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${N}\n"
printf "${G}✓ Claude Foundation installed${N} at %s\n" "$TARGET_PATH"
printf "${G}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${N}\n"
settings_summary() {
  case "$SETTINGS_RESULT" in
    copied)    echo "copied (new)" ;;
    no-change) echo "already up-to-date" ;;
    merged:*)  added="${SETTINGS_RESULT#merged:}"; echo "JSON-merged (+${added%:*} hooks, backup saved)" ;;
    skipped:*) echo "skipped — ${SETTINGS_RESULT#skipped: }" ;;
    *)         echo "unchanged" ;;
  esac
}
cat <<EOF
  Version      : v${SOURCE_VERSION} (sha ${SOURCE_SHA})${INSTALLED_VERSION:+ ← was v${INSTALLED_VERSION}}
  Mode         : ${MODE} (${ACTION})
  Stack        : ${STACK_DISPLAY}${FRAMEWORKS:+ (${FRAMEWORKS})}
  Layout       : FE=${FE_ROOT:-?}  BE=${BE_ROOT:-?}  tests=${TEST_ROOT:-?}
  CLAUDE.md    : ${CLAUDE_ACTION}
  settings.json: $(settings_summary)
  Path rules   : $([ "$RULES_ADAPTED" = "yes" ] && echo "adapted" || echo "kept defaults — review manually")

  Next steps:
    1. Review ${TARGET_PATH}/CLAUDE.md — fill any TBD sections
    2. (Optional) Tune path globs in .claude/rules/{frontend,backend}.md
    3. Open Claude Code here and run:  /discovery disc-001 <your-first-feature>
EOF
