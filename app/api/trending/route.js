import { NextResponse } from "next/server";
import { ApiError, stFetch } from "@/lib/solanatracker";

export const dynamic = "force-dynamic";

function normalize(raw) {
  const list = Array.isArray(raw) ? raw : [];
  return list
    .map((item) => {
      const t = item?.token ?? {};
      const pool = item?.pools?.[0] ?? {};
      if (!t.mint) return null;
      return {
        mint: t.mint,
        owner: pool.tokenAddress ?? null, // pools[0].tokenAddress, used for /wallet/<owner>
        name: t.name || "Unnamed",
        symbol: t.symbol || "?",
        image: t.image || null,
        price: pool.price?.usd ?? null,
        change24h: item?.events?.["24h"]?.priceChangePercentage ?? null,
        marketCap: pool.marketCap?.usd ?? null,
        liquidity: pool.liquidity?.usd ?? null,
      };
    })
    .filter(Boolean);
}

export async function GET() {
  try {
    const raw = await stFetch("/tokens/trending");
    return NextResponse.json({ tokens: normalize(raw), updatedAt: Date.now() });
  } catch (e) {
    const err = e instanceof ApiError ? e : new ApiError("Unexpected server error.", 500);
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
}
