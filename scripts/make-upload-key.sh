#!/bin/bash
#
# The upload key, made in one go.
#
#   ./scripts/make-upload-key.sh
#
# It asks for a password, twice, and nothing else. Everything keytool would
# otherwise ask — the name, the organisation, the town, the country, six
# questions and a "is this correct" — is filled in below, because none of it is
# shown to anybody and all of it is already known.
#
# Then it writes android/keystore.properties, which is what the build reads, and
# which is git-ignored along with the key itself. The password goes from your
# hands into that file and nowhere else: it is passed to keytool through the
# environment rather than on the command line, so it never appears in `ps` and
# never lands in your shell history.
#
# WHAT THIS KEY IS. Google holds the key that signs what people actually install
# — that is Play App Signing, and it is the default when you create the first
# release. This one only signs what you hand to Google. Losing it is not fatal;
# it can be replaced by asking them, which takes a few days. Losing it *and*
# having no backup is a few days you did not need to spend, so put a copy
# somewhere that is not this laptop.
#
# It will not overwrite an existing key. Not caution for its own sake: a second
# key with the same filename is an upload key Play does not recognise, and the
# first symptom is a rejected bundle on the day you wanted to ship.

set -euo pipefail

cd "$(dirname "$0")/.."

KEY="android/promenood-upload.jks"
PROPS="android/keystore.properties"

say() { printf '\n\033[1m%s\033[0m\n' "$1"; }
stop() { printf '\n\033[31m%s\033[0m\n' "$1" >&2; exit 1; }

[ -f "$KEY" ] && stop "$KEY already exists. Nothing has been changed.
If you really mean to start again, move that file somewhere safe first — and
remember that Play will not accept a bundle signed with a different upload key
until you have asked Google to reset it."

# Java, wherever this machine keeps it. The Homebrew one is keg-only, so it is
# not on anybody's PATH by default.
KEYTOOL=""
for candidate in /opt/homebrew/opt/openjdk@21/bin/keytool \
                 /opt/homebrew/opt/openjdk/bin/keytool \
                 "/Applications/Android Studio.app/Contents/jbr/Contents/Home/bin/keytool" \
                 "$(command -v keytool || true)"; do
  [ -x "$candidate" ] && KEYTOOL="$candidate" && break
done
[ -n "$KEYTOOL" ] || stop "No keytool found. brew install openjdk@21"

say "A password for the upload key."
printf '%s' "It is not shown as you type, and it is not stored anywhere but in
android/keystore.properties, which is git-ignored. Keep it with the key.

Password: "
read -rs PASSWORD
printf '\nAgain: '
read -rs AGAIN
printf '\n'

[ -n "$PASSWORD" ] || stop "An empty password is not a password."
[ "${#PASSWORD}" -ge 6 ] || stop "Six characters at the very least — Java refuses shorter ones."
[ "$PASSWORD" = "$AGAIN" ] || stop "Those two were not the same. Nothing has been changed."

# Through the environment rather than as an argument: an argument is visible to
# anybody who runs `ps` while this is going.
export PROMENOOD_KEY_PASSWORD="$PASSWORD"

say "Making the key…"
"$KEYTOOL" -genkeypair \
  -keystore "$KEY" \
  -alias upload \
  -keyalg RSA \
  -keysize 4096 \
  -validity 10000 \
  -storepass:env PROMENOOD_KEY_PASSWORD \
  -keypass:env PROMENOOD_KEY_PASSWORD \
  -dname "CN=promeNOODology, O=promeNOODology, L=Geneva, C=CH"

# The four lines the build reads. Written with the file's permissions closed
# first, so there is never a moment where it exists and is world-readable.
umask 077
cat > "$PROPS" <<PROPERTIES
# The upload key and its password. Never committed — see android/.gitignore.
# Made by scripts/make-upload-key.sh on $(date +%Y-%m-%d).
storeFile=promenood-upload.jks
storePassword=$PASSWORD
keyAlias=upload
keyPassword=$PASSWORD
PROPERTIES
chmod 600 "$PROPS"

unset PROMENOOD_KEY_PASSWORD PASSWORD AGAIN

say "Done."
printf '  %s\n' \
  "$KEY — the key itself. Back this up somewhere that is not this laptop." \
  "$PROPS — the four lines the build reads. Also worth backing up." \
  "" \
  "Both are git-ignored. Next: ./scripts/ship-android.sh"

# What Play will show as the upload certificate, so it can be checked against
# the console later without hunting for the command.
say "Its fingerprint, for the record:"
"$KEYTOOL" -list -v -keystore "$KEY" -alias upload \
  -storepass:file <(printf '%s' "$(sed -n 's/^storePassword=//p' "$PROPS")") 2>/dev/null |
  grep -E "SHA1:|SHA256:" | sed 's/^/  /' || true
