import json, re, html, urllib.parse, urllib.request, os, time

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "hn4_out.txt")
lines = []

# 1. full text of specific comments/threads
def item(i):
    try:
        return json.load(urllib.request.urlopen(f"https://hn.algolia.com/api/v1/items/{i}", timeout=30))
    except Exception as e:
        return {"err": str(e)}

def walk(n, depth=0, buf=None):
    if buf is None: buf = []
    t = re.sub("<[^>]+>", "", html.unescape(n.get("text") or ""))
    if t:
        buf.append(f"{'  '*depth}[{n.get('author')} id={n.get('id')}] {t}")
    for c in n.get("children") or []:
        walk(c, depth+1, buf)
    return buf

for i in [44903116, 49276150, 48508171]:
    d = item(i)
    lines.append("#"*20 + f" item {i}")
    lines += walk(d)

# 2. story threads about AI design
for q in ["AI slop design", "Claude Design", "vibe coding design", "AI generated websites look"]:
    u = f"https://hn.algolia.com/api/v1/search?query={urllib.parse.quote(q)}&tags=story&hitsPerPage=8"
    try:
        d = json.load(urllib.request.urlopen(u, timeout=30))
    except Exception as e:
        lines.append(f"ERR {q} {e}"); continue
    lines.append("="*10 + " STORIES " + q)
    for h in d["hits"]:
        lines.append(f"  {h.get('title')} | pts={h.get('points')} c={h.get('num_comments')} | https://news.ycombinator.com/item?id={h['objectID']}")
    time.sleep(0.4)

open(OUT, "w").write("\n".join(lines))
print("wrote", OUT, len(lines))
