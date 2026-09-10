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

# --- 22s post/landing-page cut -------------------------------------------
# Adds what the short GIF cannot show: the real exit code and the markdown
# report. `--idle-time-limit 12` is load-bearing; without it agg compresses
# the holds and the video runs half as long as intended.
rm -rf "$DEMO"
cp -R "$HERE/../examples/broken-project" "$DEMO"
rm -rf "$DEMO/.dwic"
asciinema rec --window-size 114x44 --overwrite -c "$HERE/record-demo-30s-session.sh" "$HERE/dwic-30s.cast"
agg --theme dracula --font-size 17 --line-height 1.35 --idle-time-limit 12 \
    --last-frame-duration 3 "$HERE/dwic-30s.cast" "$HERE/dwic-audit-30s.gif"
ffmpeg -y -v error -i "$HERE/dwic-audit-30s.gif" -movflags +faststart -pix_fmt yuv420p \
    -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" "$HERE/dwic-audit-30s.mp4"
rm -rf "$DEMO"
echo "wrote $HERE/dwic-audit-30s.{gif,mp4}"
