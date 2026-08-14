import json, sys, re, urllib.request, urllib.parse, time

UA = {'User-Agent': 'Mozilla/5.0 (research)'}

def get(url):
    req = urllib.request.Request(url, headers=UA)
    return json.load(urllib.request.urlopen(req, timeout=40))

def clean(t):
    t = re.sub('<[^>]+>', '', t or '')
    for a, b in [('&#x27;', "'"), ('&quot;', '"'), ('&gt;', '>'), ('&lt;', '<'), ('&amp;', '&'), ('&#x2F;', '/'), ('&#39;', "'")]:
        t = t.replace(a, b)
    return t

KW = re.compile(r'(visual regression|screenshot|breakpoint|responsive|hover|focus state|contrast|accessib|design token|spacing|typograph|looks the same|AI tell|generic|template|slop|dark mode|mobile|empty state|loading state|animation|figma|design system|pixel|layout|CSS|UI review|design review|QA)', re.I)

def walk(node, depth=0, out=None, root=None):
    if out is None: out = []
    t = clean(node.get('text'))
    if t and KW.search(t) and len(t) > 120:
        out.append((node.get('author'), node.get('id'), t[:1400]))
    for c in node.get('children') or []:
        walk(c, depth+1, out, root)
    return out

mode = sys.argv[1]
if mode == 'hn':
    for iid in sys.argv[2:]:
        try:
            d = get('https://hn.algolia.com/api/v1/items/%s' % iid)
        except Exception as e:
            print('ERR', iid, e); continue
        # climb to root
        print('===== THREAD', iid, 'title:', d.get('title') or d.get('story_title'))
        for a, cid, t in walk(d):
            print('--- https://news.ycombinator.com/item?id=%s (%s)' % (cid, a))
            print(t)
        time.sleep(1)
elif mode == 'reddit':
    for q in sys.argv[2:]:
        sub, query = q.split('|', 1)
        url = 'https://www.reddit.com/r/%s/search.json?q=%s&restrict_sr=1&sort=relevance&t=year&limit=15' % (sub, urllib.parse.quote(query))
        try:
            d = get(url)
        except Exception as e:
            print('ERR', q, e); continue
        print('===== r/%s : %s' % (sub, query))
        for c in d['data']['children']:
            p = c['data']
            print('POST: %s' % p['title'])
            print('URL: https://www.reddit.com%s' % p['permalink'])
            print((p.get('selftext') or '')[:900])
            print('---')
        time.sleep(2)
elif mode == 'rcomments':
    for path in sys.argv[2:]:
        url = 'https://www.reddit.com%s.json?limit=100&sort=top' % path.rstrip('/')
        try:
            d = get(url)
        except Exception as e:
            print('ERR', path, e); continue
        print('===== COMMENTS', path)
        def w(n):
            if not isinstance(n, dict): return
            dt = n.get('data', {})
            b = dt.get('body')
            if b and KW.search(b) and len(b) > 150:
                print('--- u/%s https://www.reddit.com%s%s/' % (dt.get('author'), path.rstrip('/'), dt.get('id')))
                print(b[:1400])
            r = dt.get('replies')
            if isinstance(r, dict):
                for ch in r['data']['children']: w(ch)
        for listing in d:
            for ch in listing['data']['children']: w(ch)
        time.sleep(2)
