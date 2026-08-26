#!/bin/bash
#
# Send a build to App Store Connect: TestFlight, and from there to review.
#
# One command, because the interesting part of shipping an iOS app is none of
# this. It syncs the web shell into the native project, archives, exports an ipa
# and uploads it — and if anything is missing it says which thing and stops
# rather than leaving half an archive somewhere in /tmp.
#
# What it needs, once, from App Store Connect → Users and Access → Integrations →
# App Store Connect API (a *team* key, role App Manager):
#
#   AuthKey_<KEY_ID>.p8 in ~/.appstoreconnect/private_keys/ — the .p8 downloads
#                       exactly once and cannot be downloaded again, and that
#                       folder is where every Apple tool looks, so put it there
#                       and nowhere else.
#   the issuer UUID     printed at the top of that same page.
#
# The first time, hand it the issuer:
#
#   ASC_ISSUER_ID=69a6de00-… ./scripts/ship-ios.sh
#
# and every time after that, nothing:
#
#   ./scripts/ship-ios.sh
#
# because the issuer is remembered in ~/.appstoreconnect/issuer and the key id is
# read off the name of the .p8 itself. Neither is a secret — the key is the
# secret, and it stays where it was put. This exists because the two of them were
# being copied out of a browser and pasted onto a command line every time, which
# is exactly the kind of thing that ends with a paste going wrong at the point of
# shipping.
#
# The build number is the minute it was built (202608221930), so it always goes
# up and there is nothing to remember or increment. The version people see is
# MARKETING_VERSION in the Xcode project, and that one is a decision, not a
# clock — change it by hand when the app is meaningfully different.

set -euo pipefail

cd "$(dirname "$0")/.."

KEY_DIR="$HOME/.appstoreconnect/private_keys"
BUILD="$(date +%Y%m%d%H%M)"
OUT="${TMPDIR:-/tmp}/promenood-ship"
ARCHIVE="$OUT/App.xcarchive"

say() { printf '\n\033[1m%s\033[0m\n' "$1"; }
stop() { printf '\n\033[31m%s\033[0m\n' "$1" >&2; exit 1; }

# The key id, off the name of the key itself. One .p8 in that folder is the usual
# state of things; where there are several, say which.
if [ -z "${ASC_KEY_ID:-}" ]; then
  found=("$KEY_DIR"/AuthKey_*.p8)
  if [ -f "${found[0]}" ] && [ "${#found[@]}" -eq 1 ]; then
    ASC_KEY_ID="$(basename "${found[0]}" .p8)"
    ASC_KEY_ID="${ASC_KEY_ID#AuthKey_}"
  elif [ "${#found[@]}" -gt 1 ]; then
    stop "More than one key in $KEY_DIR. Say which: ASC_KEY_ID=… $0"
  else
    stop "No key in $KEY_DIR. See the top of this file."
  fi
fi

[ -f "$KEY_DIR/AuthKey_$ASC_KEY_ID.p8" ] || \
  stop "No key at $KEY_DIR/AuthKey_$ASC_KEY_ID.p8 — that exact name, that exact folder."

# The issuer, remembered the first time it is given.
ISSUER_FILE="$HOME/.appstoreconnect/issuer"
if [ -z "${ASC_ISSUER_ID:-}" ] && [ -f "$ISSUER_FILE" ]; then
  ASC_ISSUER_ID="$(tr -d '[:space:]' < "$ISSUER_FILE")"
fi
if [ -z "${ASC_ISSUER_ID:-}" ]; then
  stop "No issuer id. It is the UUID at the top of App Store Connect → Users and
Access → Integrations → App Store Connect API. Once:

  ASC_ISSUER_ID=69a6de00-… $0

and it is remembered in $ISSUER_FILE for every time after."
fi
if [ ! -f "$ISSUER_FILE" ] || [ "$(tr -d '[:space:]' < "$ISSUER_FILE")" != "$ASC_ISSUER_ID" ]; then
  mkdir -p "$(dirname "$ISSUER_FILE")"
  printf '%s\n' "$ASC_ISSUER_ID" > "$ISSUER_FILE"
  chmod 600 "$ISSUER_FILE"
  say "Remembered the issuer in $ISSUER_FILE"
fi

export ASC_KEY_ID ASC_ISSUER_ID

say "Asking Apple whether the key works and the app exists"
node scripts/asc-check.mjs

# The App Store profile, made over the API and put where Xcode looks.
#
# Not automatic signing, and that is the whole trick: automatic signing asks for a
# *development* profile while it archives, a development profile needs a
# registered device, and a team that ships from a laptop through TestFlight has
# never plugged a phone in. An App Store profile needs no devices by definition —
# nothing is being installed on anything.
say "The App Store profile"
PROFILE="$(node scripts/asc-profile.mjs | sed -n 's/^PROFILE_NAME=//p')"
[ -n "$PROFILE" ] || stop "No profile came back. The lines above say why."

say "The web shell into the native project"
npx cap sync ios

say "Archiving (build $BUILD)"
rm -rf "$OUT"
mkdir -p "$OUT"
xcodebuild \
  -project ios/App/App.xcodeproj \
  -scheme App \
  -configuration Release \
  -destination 'generic/platform=iOS' \
  -archivePath "$ARCHIVE" \
  CODE_SIGN_STYLE=Manual \
  CODE_SIGN_IDENTITY="Apple Distribution" \
  PROVISIONING_PROFILE_SPECIFIER="$PROFILE" \
  DEVELOPMENT_TEAM=K35XLVJJ3T \
  CURRENT_PROJECT_VERSION="$BUILD" \
  archive

say "Exporting the ipa"
# The export options name the profile, so this file can say the same thing twice
# without either half guessing: it is written here rather than checked in with a
# profile name that would go stale the day the profile is remade.
sed "s|__PROFILE__|$PROFILE|" ios/ExportOptions.plist > "$OUT/ExportOptions.plist"
xcodebuild \
  -exportArchive \
  -archivePath "$ARCHIVE" \
  -exportOptionsPlist "$OUT/ExportOptions.plist" \
  -exportPath "$OUT"

IPA="$(find "$OUT" -maxdepth 1 -name '*.ipa' | head -1)"
[ -n "$IPA" ] || stop "The export produced no ipa. The log above says why."

say "Uploading $IPA"
xcrun altool --upload-app \
  --type ios \
  --file "$IPA" \
  --apiKey "$ASC_KEY_ID" \
  --apiIssuer "$ASC_ISSUER_ID"

say "Up. Build $BUILD is with Apple."
cat <<'AFTER'

It takes ten or fifteen minutes to finish processing, and then:

  TestFlight   App Store Connect → your app → TestFlight. Internal testers (up to
               100 people on the team) need no review and can install straight
               away; anybody outside the team goes through a short review first.

  Review       App Store Connect → your app → the version → add this build, then
               Submit. Everything Apple asks for in writing is in
               ~/Desktop/promeNOODology app store/ — the review notes there
               include the sign-in that needs no inbox.

AFTER
