#!/bin/bash
#
# Restart the app on every simulator that has it, so it picks up a deploy.
#
#   ./scripts/app-again.sh
#
# Why this exists rather than one simctl command: `simctl … booted` means "the
# booted device", and with two simulators up — which is normal the moment Xcode
# has opened one of its own — it picks one of them and fails with "found nothing
# to terminate" if that is not the one carrying the app. This asks every booted
# device instead, and says which ones it did.
#
# It restarts the *process*, which is all a web change needs: the screens come
# from the server, so a fresh launch is a fresh copy of everything. A change to
# the native side (a gesture, a shortcut, the launch screen) needs a build first —
# ask Claude, or press play in Xcode.

set -uo pipefail

APP="com.promenoodology.community"
found=0

while read -r udid name; do
  [ -n "$udid" ] || continue
  if xcrun simctl get_app_container "$udid" "$APP" >/dev/null 2>&1; then
    xcrun simctl terminate "$udid" "$APP" >/dev/null 2>&1
    xcrun simctl launch "$udid" "$APP" >/dev/null && printf 'restarted on %s\n' "$name"
    found=$((found + 1))
  else
    printf 'not installed on %s — build it there first\n' "$name"
  fi
done < <(
  xcrun simctl list devices booted -j | python3 -c '
import json, sys
for runtime, devices in json.load(sys.stdin)["devices"].items():
    for one in devices:
        if one.get("state") == "Booted":
            print(one["udid"], one["name"])
'
)

[ "$found" -gt 0 ] || echo "No booted simulator has the app. Start one, or press play in Xcode."
