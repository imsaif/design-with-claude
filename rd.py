import json,urllib.parse,urllib.request,os,time,sys
UA={"User-Agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36"}
OUT=os.path.join(os.path.dirname(os.path.abspath(__file__)),"reddit_out.txt")
def get(u):
    return urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=40).read().decode("utf-8","replace")
SUBS=["SaaS","startups","webdev","nocode","vibecoding","ClaudeAI","cursor","lovable","UXDesign","userexperience","Entrepreneur","indiehackers","SideProject"]
QS=['"not a designer"','"looks AI generated"','"design taste"','"make it look better"','"looks generic"','"can\'t tell if"  design','"AI slop" design','"my UI looks"']
lines=[]
for s in SUBS:
    for q in QS:
        u=f"https://old.reddit.com/r/{s}/search.json?q={urllib.parse.quote(q)}&restrict_sr=1&limit=50&sort=relevance&t=all"
        try:
            d=json.loads(get(u))
        except Exception as e:
            lines.append(f"ERR {s} {q} {e}"); time.sleep(1); continue
        ch=d.get("data",{}).get("children",[])
        lines.append(f"===== r/{s} {q} n={len(ch)}")
        for c in ch:
            p=c["data"]
            body=(p.get("selftext") or "").replace("\n"," ")
            if len(body)<80: continue
            lines.append(f"--- {p.get('title')} | https://www.reddit.com{p.get('permalink')} | {p.get('created_utc')}")
            lines.append(body[:2000])
        time.sleep(1.2)
open(OUT,"w").write("\n".join(lines))
print("wrote",OUT,len(lines))
