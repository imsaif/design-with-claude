import json,urllib.request,re,html,sys,os
UA={"User-Agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/122 Safari/537.36"}
def item(i):
    u=f"https://hn.algolia.com/api/v1/items/{i}"
    return json.loads(urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=40).read().decode())
def clean(t): return html.unescape(re.sub("<[^>]+>","",t or ""))
for oid in sys.argv[1:]:
    print("#"*30,"LEAF",oid)
    cur=oid
    for depth in range(4):
        try: d=item(cur)
        except Exception as e: print("ERR",e); break
        print(f"[{depth}] id={d.get('id')} author={d.get('author')} type={d.get('type')} title={d.get('title')}")
        print(clean(d.get("text"))[:2000])
        print("-"*10)
        p=d.get("parent_id")
        if not p: break
        cur=p
    # children of leaf
    try:
        d=item(oid)
        for c in (d.get("children") or [])[:6]:
            print(f"  >>REPLY id={c.get('id')} author={c.get('author')}")
            print("  "+clean(c.get("text"))[:1200])
    except Exception as e: pass
    print()
