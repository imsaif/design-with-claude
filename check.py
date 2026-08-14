import urllib.request,os
UA={"User-Agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/122 Safari/537.36"}
p=os.path.join(os.path.dirname(os.path.abspath(__file__)),"urls.txt")
for i in open(p).read().split():
    u=f"https://news.ycombinator.com/item?id={i}"
    try:
        r=urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=30)
        body=r.read().decode("utf-8","replace")
        print(i, r.status, "NOSUCH" if "No such item" in body else "ok")
    except Exception as e:
        print(i,"ERR",e)
