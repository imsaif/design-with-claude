import json, re, html, urllib.request, os

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "hn5_out.txt")
IDS = [47806725, 47818700, 47832366, 49058547, 44878257, 47810897, 48792399, 47825004]
KW = ["iterat", "regenerat", "re-roll", "reroll", "start over", "starts over", "started over",
      "one change", "small change", "tweak", "revert", "previous version", "undo", "lost ",
      "converge", "same", "generic", "slop", "taste", "nudge", "adjust", "prompt"]

lines = []
def walk(n, buf, depth=0):
    t = re.sub("<[^>]+>", "", html.unescape(n.get("text") or ""))
    if t:
        low = t.lower()
        if any(k in low for k in KW):
            buf.append(f"[{n.get('author')}] id={n.get('id')}\n{t}\n")
    for c in n.get("children") or []:
        walk(c, buf, depth+1)

for i in IDS:
    try:
        d = json.load(urllib.request.urlopen(f"https://hn.algolia.com/api/v1/items/{i}", timeout=60))
    except Exception as e:
        lines.append(f"ERR {i} {e}"); continue
    buf = []
    walk(d, buf)
    lines.append("#"*25 + f" story {i}: {d.get('title')} ({len(buf)} matches)")
    lines += buf

open(OUT, "w").write("\n".join(lines))
print("wrote", OUT, len(lines))
