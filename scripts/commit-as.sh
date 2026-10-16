#!/usr/bin/env bash
# Commit work on behalf of a team member so they keep authorship credit.
# Usage:   scripts/commit-as.sh <member> "<message>" [paths...]
# Example: scripts/commit-as.sh carl "feat(api): add reports endpoints"
#          scripts/commit-as.sh pauline "feat(web): login page" web/src/pages
#          COAUTHOR=lenon scripts/commit-as.sh pauline "feat(web): map view"
# Run it with Git Bash on Windows.
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"
CONF="scripts/members.conf"
LOG="docs/contributions/handoff-log.csv"

usage() {
  echo "Usage: scripts/commit-as.sh <member> \"<message>\" [paths...]"
  echo "Optional: COAUTHOR=<member> adds a Co-authored-by trailer."
  echo "Members:"
  tr -d '\r' < "$CONF" | grep -vE '^\s*(#|$)' | cut -d'|' -f1 | sed 's/^/  - /'
  exit 1
}

get_member() {  # prints "name|email|paths" or nothing (strips Windows CR so CRLF files still work)
  tr -d '\r' < "$CONF" | grep -E "^$1\|" | head -n1 | cut -d'|' -f2- || true
}

[ $# -ge 2 ] || usage
key="$1"; msg="$2"; shift 2

row="$(get_member "$key")"
[ -n "$row" ] || { echo "Unknown member '$key'."; usage; }
IFS='|' read -r name email defpaths <<< "$row"
[ "$email" != "REPLACE_ME" ] || { echo "Set $key's email in $CONF first."; exit 1; }

if [ $# -gt 0 ]; then paths=("$@"); else read -r -a paths <<< "$defpaths"; fi

git add -- "${paths[@]}"
if git diff --cached --quiet; then
  echo "Nothing staged for: ${paths[*]}. Copy the member's files in first."
  exit 1
fi

args=(-m "$msg")
if [ -n "${COAUTHOR:-}" ]; then
  crow="$(get_member "$COAUTHOR")"
  [ -n "$crow" ] || { echo "Unknown co-author '$COAUTHOR'."; exit 1; }
  IFS='|' read -r cname cemail _ <<< "$crow"
  args+=(-m "Co-authored-by: $cname <$cemail>")
fi

git commit --author="$name <$email>" "${args[@]}"

hash="$(git rev-parse --short HEAD)"
mkdir -p "$(dirname "$LOG")"
[ -f "$LOG" ] || echo "date,member,message,paths,commit" > "$LOG"
printf '%s,"%s","%s","%s",%s\n' "$(date +%F)" "$name" "${msg//\"/\'}" "${paths[*]}" "$hash" >> "$LOG"

echo "Committed $hash as author: $name (committer: $(git config user.name))"
echo "Logged in $LOG. Remember to commit the log file with your own identity."
