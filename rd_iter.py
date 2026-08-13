import sys, json, urllib.parse, urllib.request, time, os

UA = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36"}
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "iter_out.txt")

def get(u):
    return urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=40).read().decode("utf-8", "replace")

SUBS = ["ClaudeAI", "vibecoding", "cursor", "lovable", "webdev", "UXDesign", "userexperience", "ChatGPTCoding", "SideProject", "graphic_design", "midjourney", "StableDiffusion"]
QS = ['"purple gradient"', 'reroll OR "re-roll" design', '"starts over" design AI', '"I liked the previous version"',
      '"keeps changing things I didn\'t ask"', '"broke the layout"', '"shadcn look"', '"every iteration"  worse',
      '"went back to" "previous version" AI design', '"lost the" design AI regenerate', '"same font" AI generated site',
      '"undo" "AI" design ruined', '"one-shot" design iterate', '"revert" AI design worse']

lines = []
for s in SUBS:
    for q in QS:
        u = f"https://old.reddit.com/r/{s}/search.json?q={urllib.parse.quote(q)}&restrict_sr=1&limit=25&sort=relevance&t=all"
        try:
            d = json.loads(get(u))
        except Exception as e:
            lines.append(f"ERR {s} {q} {e}"); time.sleep(1); continue
        ch = d.get("data", {}).get("children", [])
        if not ch: time.sleep(1.2); continue
        lines.append(f"===== r/{s} {q} n={len(ch)}")
        for c in ch:
            p = c["data"]
            body = (p.get("selftext") or "").replace("\n", " ")
            lines.append(f"--- [{p.get('score')}|{p.get('num_comments')}c] {p.get('title')} | https://www.reddit.com{p.get('permalink')}")
            if len(body) > 60:
                lines.append(body[:1800])
        time.sleep(1.2)

open(OUT, "w").write("\n".join(lines))
print("wrote", OUT, len(lines))
