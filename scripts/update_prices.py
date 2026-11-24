"""Fetch the latest daily close for each tracked ticker and write investments/prices.json.

Run by the "Update prices" GitHub Action once a day; safe to run by hand too.
Add a symbol to SYMBOLS when you publish a new pitch (Yahoo Finance symbols).
"""
import json, urllib.request, datetime, pathlib

SYMBOLS = ["HGV", "051160.KQ", "KRW=X"]   # KRW=X is won per US dollar, for converting Korean prices
OUT = pathlib.Path(__file__).resolve().parent.parent / "investments" / "prices.json"

def latest_close(symbol):
    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}?range=10d&interval=1d"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (kenansakarcan.org price updater)"})
    with urllib.request.urlopen(req, timeout=30) as r:
        d = json.load(r)["chart"]["result"][0]
    meta, ts, closes = d["meta"], d["timestamp"], d["indicators"]["quote"][0]["close"]
    offset = meta.get("gmtoffset", 0)
    for t, c in reversed(list(zip(ts, closes))):
        if c is not None:
            day = datetime.datetime.fromtimestamp(t + offset, datetime.timezone.utc).date()
            return {"price": round(c, 4), "date": day.isoformat(), "currency": meta.get("currency")}
    raise RuntimeError(f"no close for {symbol}")

def main():
    old = json.loads(OUT.read_text()) if OUT.exists() else {"prices": {}}
    prices = dict(old.get("prices", {}))
    for s in SYMBOLS:
        try:
            prices[s] = latest_close(s)
        except Exception as e:  # keep yesterday's value rather than breaking the page
            print(f"warning: {s}: {e}")
    data = {"updated": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%MZ"), "prices": prices}
    if data["prices"] != old.get("prices"):
        OUT.write_text(json.dumps(data, indent=2) + "\n")
        print("updated", OUT)
    else:
        print("no change")

if __name__ == "__main__":
    main()
