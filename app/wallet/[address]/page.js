"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { isValidSolanaAddress } from "@/lib/solana";
import { formatAmount, formatUsd, shortAddress } from "@/lib/format";

function Avatar({ token }) {
  const [broken, setBroken] = useState(false);
  if (!token.image || broken) {
    return <span className="avatar fallback" aria-hidden="true">{(token.symbol || token.name).slice(0, 1).toUpperCase()}</span>;
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img className="avatar" src={token.image} alt="" loading="lazy" onError={() => setBroken(true)} />;
}

function TokenRow({ token }) {
  return (
    <li className="row">
      <a className="token" href={`https://solscan.io/token/${token.mint}`} target="_blank" rel="noopener noreferrer">
        <Avatar token={token} />
        <span className="names">
          <span className="name">{token.name}</span>
          <span className="symbol">{token.symbol || "no symbol"}</span>
        </span>
      </a>
      <span className="cell" data-label="Amount">{formatAmount(token.balance)}</span>
      <span className="cell" data-label="Value">{formatUsd(token.valueUsd)}</span>
      <span className="cell mcap mint" data-label="Mint" title={token.mint}>{shortAddress(token.mint, 5, 5)}</span>
    </li>
  );
}

function Skeleton() {
  return (
    <>
      <div className="hero skeleton" aria-hidden="true">
        <span className="bar w1" style={{ height: 40, width: 200 }} />
      </div>
      <ul className="list" aria-hidden="true">
        {Array.from({ length: 5 }, (_, i) => (
          <li className="row skeleton" key={i}>
            <span className="token"><span className="avatar fallback" /><span className="bar w1" /></span>
            <span className="bar w2" /><span className="bar w3" /><span className="bar w2 mcap" />
          </li>
        ))}
      </ul>
    </>
  );
}

export default function WalletPage() {
  const { address: rawParam } = useParams();
  const address = decodeURIComponent(rawParam || "").trim();
  const valid = isValidSolanaAddress(address);

  const [state, setState] = useState({ status: "loading" }); // loading | ready | error

  const load = useCallback(async () => {
    if (!valid) return;
    setState({ status: "loading" });
    try {
      const res = await fetch(`/api/wallet/${address}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setState({ status: "ready", data });
    } catch (e) {
      setState({ status: "error", message: e.message || "Something went wrong." });
    }
  }, [address, valid]);

  useEffect(() => { load(); }, [load]);

  const data = state.data;

  return (
    <main className="page">
      <Link className="back" href="/">← Trending tokens</Link>
      <header className="head">
        <div>
          <h1>Wallet</h1>
          <p className="sub addr" title={address}>{valid ? address : "No valid address"}</p>
        </div>
      </header>

      {!valid ? (
        <div className="notice" role="alert">
          <p className="notice-title">Invalid wallet address</p>
          <p>“{shortAddress(address, 8, 6)}” isn’t a Solana address. Check for missing or extra characters and try again.</p>
        </div>
      ) : state.status === "loading" ? (
        <Skeleton />
      ) : state.status === "error" ? (
        <div className="notice" role="alert">
          <p className="notice-title">Couldn’t load this wallet</p>
          <p>{state.message}</p>
          <button className="refresh" onClick={load}>Try again</button>
        </div>
      ) : (
        <>
          <section className="hero" aria-label="Balances">
            <div className="stat">
              <span className="stat-label">SOL balance</span>
              <span className="stat-value">{data.solBalance == null ? "—" : `${formatAmount(data.solBalance)} SOL`}</span>
              {data.solValueUsd != null && <span className="stat-sub">{formatUsd(data.solValueUsd)}</span>}
            </div>
            <div className="stat">
              <span className="stat-label">Total value</span>
              <span className="stat-value">{formatUsd(data.totalUsd)}</span>
              <span className="stat-sub">{data.tokens.length} other {data.tokens.length === 1 ? "token" : "tokens"}</span>
            </div>
          </section>

          <h2 className="section-title">Token balances</h2>
          <div className="row labels" aria-hidden="true">
            <span>Token</span><span>Amount</span><span>Value</span><span className="mcap">Mint</span>
          </div>
          <ul className="list">
            {data.tokens.length === 0 ? (
              <li className="empty">This wallet holds no tokens besides SOL.</li>
            ) : (
              data.tokens.map((t) => <TokenRow key={t.mint} token={t} />)
            )}
          </ul>
        </>
      )}
    </main>
  );
}
