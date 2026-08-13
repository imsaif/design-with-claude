import json,sys,re,html
def walk(n,out):
    t=n.get("text") or ""
    t=re.sub(r"<[^>]+>"," ",t)
    t=html.unescape(t)
    t=re.sub(r"\s+"," ",t).strip()
    if t: out.append((n.get("id"),n.get("author"),t))
    for c in n.get("children",[]) or []: walk(c,out)
for f in sys.argv[1:]:
    d=json.load(open(f))
    out=[];walk(d,out)
    print("=== ",f, d.get("title"), " comments:",len(out))
    for i,a,t in out:
        print(f"[{i}|{a}] {t}")
