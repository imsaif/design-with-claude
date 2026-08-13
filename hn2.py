import json, re, html, urllib.parse, urllib.request, os, time

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "hn2_out.txt")
QS = [
 "purple gradient AI",
 "AI websites look the same shadcn",
 "vibe coded apps look identical",
 "AI keeps rewriting parts I did not ask",
 "asked AI to change one thing it redesigned everything",
 "AI design iteration worse each time",
 "regenerate versus iterate AI image",
 "midjourney reroll instead of iterate",
 "AI cannot make small design changes",
 "AI UI generation same layout every time",
 "claude code design taste generic",
 "v0 lovable design generic same",
 "AI art hard to make small edits",
 "prompting for visual design is hard specific",
 "AI regenerates whole component instead of tweaking",
]

lines = []
for q in QS:
    u = f"https://hn.algolia.com/api/v1/search?query={urllib.parse.quote(q)}&tags=comment&hitsPerPage=12"
    try:
        d = json.load(urllib.request.urlopen(u, timeout=30))
    except Exception as e:
        lines.append(f"ERR {q} {e}"); continue
    lines.append("="*15 + " " + q)
    for h in d["hits"]:
        t = re.sub("<[^>]+>", "", html.unescape(h.get("comment_text") or ""))
        lines.append(f"--- [{h.get('author')}] https://news.ycombinator.com/item?id={h['objectID']}")
        lines.append(t[:1200])
    time.sleep(0.4)

open(OUT, "w").write("\n".join(lines))
print("wrote", OUT, len(lines))
