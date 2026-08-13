import sys, json, re, html, urllib.parse, urllib.request

def search(q, tags='comment', n=8):
    url = f"https://hn.algolia.com/api/v1/search?query={urllib.parse.quote(q)}&tags={tags}&hitsPerPage={n}"
    d = json.load(urllib.request.urlopen(url))
    out = []
    for h in d['hits']:
        t = re.sub('<[^>]+>', '', html.unescape(h.get('comment_text') or h.get('title') or ''))
        out.append((h['objectID'], h.get('author'), t))
    return out

for q in sys.argv[1:]:
    print("="*20, q)
    for oid, a, t in search(q):
        print(f"[{a}] https://news.ycombinator.com/item?id={oid}")
        print(t[:900])
        print("-"*8)
