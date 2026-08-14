import re,sys,os
p=os.path.join(os.path.dirname(os.path.abspath(__file__)),"harvest_out.txt")
txt=open(p).read().split("\n")
recs=[];cur=None
for l in txt:
    if l.startswith("--- "):
        cur={"h":l,"b":""}; recs.append(cur)
    elif l.startswith("====="):
        cur=None
    elif cur is not None:
        cur["b"]+=l+" "
AI=re.compile(r"\b(AI|LLM|GPT|Claude|Cursor|v0|Lovable|Bolt|Replit|vibe.cod|vibe.design|shadcn|copilot|chatgpt)\b",re.I)
DES=re.compile(r"\b(design|UI|UX|layout|typograph|spacing|font|color|colour|aesthetic|taste|look|visual)\w*",re.I)
n=0
for r in recs:
    d=r["h"].split("|")[2].strip() if r["h"].count("|")>2 else ""
    if d[:4] not in ("2024","2025","2026"): continue
    if AI.search(r["b"]) and DES.search(r["b"]):
        n+=1
        print(r["h"]); print(r["b"][:1500]); print()
print("N=",n,file=sys.stderr)
