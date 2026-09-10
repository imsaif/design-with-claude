#!/bin/zsh
# Regenerate media/dwic-audit.gif from the live audit output.
# Re-run whenever the audit output changes, then re-check the numbers in DISTRIBUTION.md.
# Requires: brew install asciinema agg
set -e
HERE="${0:A:h}"
DEMO=/Users/Shared/acme-web
rm -rf "$DEMO"
cp -R "$HERE/../examples/broken-project" "$DEMO"
rm -rf "$DEMO/.dwic"
asciinema rec --window-size 114x37 --overwrite -c "$HERE/record-demo-session.sh" "$HERE/dwic.cast"
agg --theme dracula --font-size 18 --line-height 1.35 --last-frame-duration 4 "$HERE/dwic.cast" "$HERE/dwic-audit.gif"
rm -rf "$DEMO"
echo "wrote $HERE/dwic-audit.gif"
