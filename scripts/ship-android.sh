#!/bin/bash
#
# Build the bundle Google Play takes.
#
# The sibling of ship-ios.sh, and shorter, because Google has no equivalent of
# Xcode's signing dance: one key, one file, one command. It syncs the web shell
# into the native project, builds a release App Bundle, and prints where it is and
# what version it says it is.
#
# It stops short of uploading. That is deliberate for now: the Play Console will
# not accept an upload from the API until the developer account is verified and
# the app record exists, and a script that pretends otherwise fails at the end of
# a long build. Drag the .aab into Play Console → Production → Create release.
#
# What it needs, once: an upload key. Make it yourself, so that nothing but you
# ever knows the password:
#
#   keytool -genkeypair -v \
#     -keystore android/promenood-upload.jks \
#     -alias upload -keyalg RSA -keysize 4096 -validity 10000
#
# It asks for a password twice and then for a name and a place; the name it wants
# is the association's, and none of it is shown to anybody. Then write the four
# lines it needs into android/keystore.properties, which is git-ignored:
#
#   storeFile=promenood-upload.jks
#   storePassword=…
#   keyAlias=upload
#   keyPassword=…
#
# Keep a copy of that .jks somewhere that is not this laptop. Losing it is not
# fatal — Play App Signing means Google holds the key people's phones actually
# trust, and a lost *upload* key can be replaced by asking them — but replacing it
# takes days, and days are worse than a backup.
#
#   ./scripts/ship-android.sh
#   ./scripts/ship-android.sh --apk    # an apk for a phone on the desk instead

set -euo pipefail

cd "$(dirname "$0")/.."

say() { printf '\n\033[1m%s\033[0m\n' "$1"; }
stop() { printf '\n\033[31m%s\033[0m\n' "$1" >&2; exit 1; }

# Java, wherever this machine keeps it. Gradle needs 17 or later; 21 is what the
# Android tools are built against today.
if [ -z "${JAVA_HOME:-}" ]; then
  for candidate in /opt/homebrew/opt/openjdk@21 /opt/homebrew/opt/openjdk \
                   /Applications/Android\ Studio.app/Contents/jbr/Contents/Home; do
    [ -x "$candidate/bin/java" ] && export JAVA_HOME="$candidate" && break
  done
fi
[ -n "${JAVA_HOME:-}" ] || stop "No Java found. brew install openjdk@21"
export PATH="$JAVA_HOME/bin:$PATH"

[ -d android ] || stop "There is no android/ folder. npx cap add android"

if [ ! -f android/keystore.properties ] && [ -z "${PROMENOOD_KEYSTORE:-}" ]; then
  printf '\n\033[33m%s\033[0m\n' \
    "No upload key: android/keystore.properties is missing, so this build will be
unsigned and Play will refuse it. See the top of this file. Building anyway, so
that everything else can be checked."
fi

say "Syncing the shell into the native project…"
npx cap sync android

if [ "${1:-}" = "--apk" ]; then
  say "Building a release apk…"
  (cd android && ./gradlew --console=plain :app:assembleRelease)
  MADE="android/app/build/outputs/apk/release/app-release.apk"
else
  say "Building the App Bundle…"
  (cd android && ./gradlew --console=plain :app:bundleRelease)
  MADE="android/app/build/outputs/bundle/release/app-release.aab"
fi

[ -f "$MADE" ] || stop "The build finished but $MADE is not there."

# What it calls itself, read back out of the thing rather than out of the script:
# the version code is a clock in build.gradle, and a build that says a number
# nobody can see is a build nobody can talk about.
say "Made $MADE"
ls -lh "$MADE" | awk '{print "  " $5}'
grep -o 'versionName "[^"]*"' android/app/build.gradle | sed 's/^/  /'
printf '  version code: %s (minutes since 2020)\n' \
  "$(( ( $(date +%s) - 1577836800 ) / 60 ))"

say "Next: Play Console → Production → Create new release → upload this file."
