import json, sys, re, urllib.request, urllib.parse, time

queries = sys.argv[1:]
for q in queries:
    url = "https://hn.algolia.com/api/v1/search?query=%s&tags=comment&hitsPerPage=10" % urllib.parse.quote(q)
    try:
        d = json.load(urllib.request.urlopen(url, timeout=30))
    except Exception as e:
        print("ERR", q, e); continue
    print("========== QUERY:", q)
    for h in d['hits']:
        t = re.sub('<[^>]+>', '', h.get('comment_text') or '')
        t = t.replace('&#x27;', "'").replace('&quot;', '"').replace('&gt;', '>').replace('&lt;', '<').replace('&amp;', '&').replace('&#x2F;', '/')
        print("URL: https://news.ycombinator.com/item?id=%s" % h['objectID'])
        print(t[:1100])
        print("---")
    time.sleep(1)
