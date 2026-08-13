import json, re, html, urllib.parse, urllib.request, os, time

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "hn3_out.txt")
QS = [
 "prompting for every small adjustment design",
 "AI image edit changes the whole image inpainting frustration",
 "nano banana keeps changing things I didn't ask",
 "generate again lottery until it looks right",
 "slot machine prompting design",
 "AI design no direct manipulation only prompt",
 "figma AI iterate on design instead of regenerate",
 "AI second iteration worse than first design",
 "design system prompt AI ignores tokens regenerates",
 "AI can't do small visual tweaks pixel",
 "frontend design skill converge Space Grotesk",
 "AI landing page every one looks like the last",
 "asked for one change AI rewrote CSS entire page",
 "iterate on AI output vs starting over prompt",
]

lines = []
for q in QS:
    u = f"https://hn.algolia.com/api/v1/search?query={urllib.parse.quote(q)}&tags=comment&hitsPerPage=10"
    try:
        d = json.load(urllib.request.urlopen(u, timeout=30))
    except Exception as e:
        lines.append(f"ERR {q} {e}"); continue
    lines.append("="*15 + " " + q)
    for h in d["hits"]:
        t = re.sub("<[^>]+>", "", html.unescape(h.get("comment_text") or ""))
        lines.append(f"--- [{h.get('author')}] https://news.ycombinator.com/item?id={h['objectID']}")
        lines.append(t[:1000])
    time.sleep(0.4)

open(OUT, "w").write("\n".join(lines))
print("wrote", OUT, len(lines))
