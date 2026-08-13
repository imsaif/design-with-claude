import json,urllib.parse,urllib.request,sys,re,html,os,time

OUT=os.path.join(os.path.dirname(os.path.abspath(__file__)),"harvest_out.txt")
UA={"User-Agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36"}

def get(url):
    r=urllib.request.Request(url,headers=UA)
    return urllib.request.urlopen(r,timeout=40).read().decode("utf-8","replace")

def clean(t):
    return html.unescape(re.sub("<[^>]+>","",t or "")).replace("\n"," ")

QUERIES=[
 '"not a designer"',
 '"not a UI designer"',
 '"looks AI generated"',
 '"AI generated look"',
 '"looks like AI"',
 '"every AI app looks the same"',
 '"I have no taste"',
 '"make it look better"',
 '"purple gradient"',
 '"doesn\'t look professional"',
 'v0 lovable bolt design generic',
 'shadcn every site looks the same',
 'vibe coded UI ugly',
 'AI design taste cannot judge',
]

lines=[]
seen=set()
for q in QUERIES:
    for endpoint in ["search","search_by_date"]:
        url=f"https://hn.algolia.com/api/v1/{endpoint}?query={urllib.parse.quote(q)}&tags=comment&hitsPerPage=60"
        try:
            d=json.loads(get(url))
        except Exception as e:
            lines.append(f"ERR {q} {e}"); continue
        lines.append(f"===== HN[{endpoint}] {q} nbHits={d.get('nbHits')}")
        for h in d["hits"]:
            oid=h["objectID"]
            if oid in seen: continue
            seen.add(oid)
            t=clean(h.get("comment_text"))
            if len(t)<60: continue
            lines.append(f"--- {oid} | {h['author']} | {h.get('created_at','')[:10]} | https://news.ycombinator.com/item?id={oid}")
            lines.append(t[:1600])
        time.sleep(0.3)

open(OUT,"w").write("\n".join(lines))
print("wrote",OUT,len(lines),"lines")
