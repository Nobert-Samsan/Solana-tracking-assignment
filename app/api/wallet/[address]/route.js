import { NextResponse } from "next/server";
import { ApiError, stFetch } from "@/lib/solanatracker";
import { SOL_MINT, isValidSolanaAddress } from "@/lib/solana";

export const dynamic = "force-dynamic";

// Public RPC, used only if SolanaTracker's list has no SOL entry.
const RPC = "https://api.mainnet-beta.solana.com";

async function rpcSolBalance(address) {
  try {
    const res = await fetch(RPC, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getBalance", params: [address] }),
      cache: "no-store",
    });
    const json = await res.json();
    const lamports = json?.result?.value;
    return typeof lamports === "number" ? lamports / 1e9 : null;
  } catch {
    return null;
  }
}

export async function GET(_request, { params }) {
  const { address } = await params; // Next 15: params is a Promise

  // 1) Validate input BEFORE spending an API call
  if (!isValidSolanaAddress(address)) {
    return NextResponse.json(
      { error: "That isn't a valid Solana wallet address. It should be 32–44 characters of letters and numbers." },
      { status: 400 }
    );
  }

  try {
    // 2) Call SolanaTracker: GET /wallet/{address}
    let raw;
    try {
      raw = await stFetch(`/wallet/${address}`);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) raw = { tokens: [], total: 0 }; // unknown / empty wallet
      else throw e;
    }

    // 3) Normalize the response into only what the UI needs
    const all = (Array.isArray(raw?.tokens) ? raw.tokens : [])
      .map((item) => ({
        mint: item?.token?.mint,
        name: item?.token?.name || "Unknown token",
        symbol: item?.token?.symbol || "",
        image: item?.token?.image || null,
        balance: Number(item?.balance ?? 0),
        valueUsd: item?.value ?? null,
      }))
      .filter((t) => t.mint);

    // 4) Split SOL from the other tokens
    const solEntry = all.find((t) => t.mint === SOL_MINT);
    const tokens = all
      .filter((t) => t.mint !== SOL_MINT)
      .sort((a, b) => (b.valueUsd ?? -1) - (a.valueUsd ?? -1));

    const solBalance = solEntry ? solEntry.balance : await rpcSolBalance(address);

    return NextResponse.json({
      address,
      solBalance,
      solValueUsd: solEntry?.valueUsd ?? null,
      totalUsd: raw?.total ?? null,
      tokens,
    });
  } catch (e) {
    const err = e instanceof ApiError ? e : new ApiError("Unexpected server error.", 500);
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
}
