import json,urllib.parse,urllib.request,re,html,os,time
OUT=os.path.join(os.path.dirname(os.path.abspath(__file__)),"harvest2_out.txt")
UA={"User-Agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/122 Safari/537.36"}
def get(u): return urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=40).read().decode("utf-8","replace")
def clean(t): return html.unescape(re.sub("<[^>]+>","",t or "")).replace("\n"," ")
QUERIES=[
 '"don\'t know what\'s wrong" design AI',
 '"I know something is off" design',
 '"can\'t articulate" design AI',
 '"don\'t have the vocabulary" design',
 'AI UI "looks off" but "can\'t"',
 '"design feedback" vibe coded founder',
 '"my app looks" AI generated feedback',
 'lovable v0 design "all look the same"',
 '"taste" bottleneck AI design engineers',
 'AI frontend "visual hierarchy" bad',
 '"whitespace" AI generated UI bad',
 'AI generated UI accessibility contrast unreadable',
 'claude code frontend design worse each iteration',
 '"make it prettier" prompt design',
 'AI design "I have no idea if"',
 'non-designer AI mockup judge quality',
 'vibe coded landing page conversion bad design',
 '"design review" AI generated app founder',
]
lines=[];seen=set()
for q in QUERIES:
    u=f"https://hn.algolia.com/api/v1/search?query={urllib.parse.quote(q)}&tags=comment&hitsPerPage=40"
    try: d=json.loads(get(u))
    except Exception as e: lines.append(f"ERR {q} {e}"); continue
    lines.append(f"===== {q} nb={d.get('nbHits')}")
    for h in d["hits"]:
        oid=h["objectID"]
        if oid in seen: continue
        seen.add(oid)
        t=clean(h.get("comment_text"))
        dt=h.get("created_at","")[:10]
        if dt[:4] not in ("2024","2025","2026"): continue
        if len(t)<80: continue
        low=t.lower()
        if not any(k in low for k in ["design","ui","ux","layout","typograph","spacing","font","color","colour","aesthetic","taste","visual"]): continue
        if not any(k in low for k in ["ai","llm","claude","gpt","cursor","v0","lovable","bolt","vibe","copilot"]): continue
        lines.append(f"--- {oid} | {h['author']} | {dt} | https://news.ycombinator.com/item?id={oid}")
        lines.append(t[:1600])
    time.sleep(0.3)
open(OUT,"w").write("\n".join(lines))
print("wrote",len(lines))
