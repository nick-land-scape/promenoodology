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
#   ASC_KEY_ID      the ten-character Key ID
#   ASC_ISSUER_ID   the issuer UUID, at the top of that page
#   AuthKey_<ASC_KEY_ID>.p8 in ~/.appstoreconnect/private_keys/
#
# The .p8 downloads exactly once and cannot be downloaded again; that folder is
# where every Apple tool looks for it, so put it there and nowhere else.
#
#   ASC_KEY_ID=ABCD123456 ASC_ISSUER_ID=69a6de… ./scripts/ship-ios.sh
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

[ -n "${ASC_KEY_ID:-}" ]    || stop "ASC_KEY_ID is not set. See the top of this file."
[ -n "${ASC_ISSUER_ID:-}" ] || stop "ASC_ISSUER_ID is not set. See the top of this file."
[ -f "$KEY_DIR/AuthKey_$ASC_KEY_ID.p8" ] || \
  stop "No key at $KEY_DIR/AuthKey_$ASC_KEY_ID.p8 — that exact name, that exact folder."

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
  -allowProvisioningUpdates \
  -authenticationKeyPath "$KEY_DIR/AuthKey_$ASC_KEY_ID.p8" \
  -authenticationKeyID "$ASC_KEY_ID" \
  -authenticationKeyIssuerID "$ASC_ISSUER_ID" \
  CURRENT_PROJECT_VERSION="$BUILD" \
  archive

say "Exporting the ipa"
xcodebuild \
  -exportArchive \
  -archivePath "$ARCHIVE" \
  -exportOptionsPlist ios/ExportOptions.plist \
  -exportPath "$OUT" \
  -allowProvisioningUpdates \
  -authenticationKeyPath "$KEY_DIR/AuthKey_$ASC_KEY_ID.p8" \
  -authenticationKeyID "$ASC_KEY_ID" \
  -authenticationKeyIssuerID "$ASC_ISSUER_ID"

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
