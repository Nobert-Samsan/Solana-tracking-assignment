"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { formatCompact, formatPercent, formatPrice } from "@/lib/format";

function TokenImage({ token }) {
  const [broken, setBroken] = useState(false);
  if (!token.image || broken) {
    return <span className="avatar fallback" aria-hidden="true">{token.symbol.slice(0, 1).toUpperCase()}</span>;
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img className="avatar" src={token.image} alt="" loading="lazy" onError={() => setBroken(true)} />;
}

function Row({ token }) {
  const c = token.change24h;
  // Clicking the image or name opens /wallet/<pools[0].tokenAddress>
  const Wrapper = token.owner ? Link : "span";
  const linkProps = token.owner ? { href: `/wallet/${token.owner}`, title: `View wallet ${token.owner}` } : {};
  const tone = c == null ? "flat" : c > 0 ? "up" : c < 0 ? "down" : "flat";
  return (
    <li className="row">
      <Wrapper className="token" {...linkProps}>
        <TokenImage token={token} />
        <span className="names">
          <span className="name">{token.name}</span>
          <span className="symbol">{token.symbol}</span>
        </span>
      </Wrapper>
      <span className="cell price" data-label="Price">{formatPrice(token.price)}</span>
      <span className={`cell change ${tone}`} data-label="24h">{formatPercent(c)}</span>
      <span className="cell mcap" data-label="Market cap">{formatCompact(token.marketCap)}</span>
    </li>
  );
}

function SkeletonRows() {
  return Array.from({ length: 10 }, (_, i) => (
    <li className="row skeleton" key={i} aria-hidden="true">
      <span className="token"><span className="avatar fallback" /><span className="bar w1" /></span>
      <span className="bar w2" />
      <span className="bar w3" />
      <span className="bar w2 mcap" />
    </li>
  ));
}

export default function Home() {
  const [tokens, setTokens] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState(null);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const res = await fetch("/api/trending", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setTokens(data.tokens);
      setUpdatedAt(data.updatedAt);
      setStatus("ready");
    } catch (e) {
      setError(e.message || "Something went wrong.");
      setStatus("error");
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <main className="page">
      <header className="head">
        <div>
          <h1>Trending on Solana</h1>
          <p className="sub">
            {status === "ready" && updatedAt
              ? `${tokens.length} tokens, updated ${new Date(updatedAt).toLocaleTimeString()}`
              : "Tokens drawing the most activity right now"}
          </p>
        </div>
        <button className="refresh" onClick={load} disabled={status === "loading"}>
          {status === "loading" ? "Refreshing…" : "Refresh"}
        </button>
      </header>

      {status === "error" ? (
        <div className="notice" role="alert">
          <p className="notice-title">Couldn’t load trending tokens</p>
          <p>{error}</p>
          <button className="refresh" onClick={load}>Try again</button>
        </div>
      ) : (
        <section aria-busy={status === "loading"} aria-label="Trending tokens">
          <div className="row labels" aria-hidden="true">
            <span>Token</span><span>Price</span><span>24h</span><span className="mcap">Market cap</span>
          </div>
          <ul className="list">
            {status === "loading" && tokens.length === 0 ? (
              <SkeletonRows />
            ) : tokens.length === 0 ? (
              <li className="empty">No trending tokens right now. Check back in a minute.</li>
            ) : (
              tokens.map((t) => <Row key={t.mint} token={t} />)
            )}
          </ul>
        </section>
      )}

      <footer className="foot">Data from SolanaTracker. Not financial advice.</footer>
    </main>
  );
}
