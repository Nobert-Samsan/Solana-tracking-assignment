const sub = "₀₁₂₃₄₅₆₇₈₉";

export function formatPrice(n) {
  if (n == null || Number.isNaN(n)) return "—";
  if (n === 0) return "$0.00";
  if (n >= 1) return "$" + n.toLocaleString("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 2 });
  if (n >= 0.01) return "$" + n.toFixed(4);
  // Tiny prices: $0.0₅1234 (subscript = number of leading zeros)
  const [, frac = ""] = n.toFixed(20).split(".");
  const zeros = frac.match(/^0*/)[0].length;
  const digits = frac.slice(zeros, zeros + 4).replace(/0+$/, "") || "0";
  if (zeros < 4) return "$0." + "0".repeat(zeros) + digits;
  return "$0.0" + String(zeros).split("").map((d) => sub[d]).join("") + digits;
}

export function formatCompact(n) {
  if (n == null || Number.isNaN(n)) return "—";
  return "$" + Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 }).format(n);
}

export function formatPercent(n) {
  if (n == null || Number.isNaN(n)) return "—";
  const abs = Math.abs(n);
  const s = abs >= 1000 ? Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(abs) : abs.toFixed(2);
  return (n > 0 ? "+" : n < 0 ? "−" : "") + s + "%";
}

export function formatAmount(n) {
  if (n == null || Number.isNaN(n)) return "—";
  if (n === 0) return "0";
  if (Math.abs(n) >= 1e9) return Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 }).format(n);
  if (Math.abs(n) >= 1) return n.toLocaleString("en-US", { maximumFractionDigits: 4 });
  return n.toPrecision(3).replace(/\.?0+$/, "");
}

export function formatUsd(n) {
  if (n == null || Number.isNaN(n)) return "—";
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function shortAddress(a, left = 4, right = 4) {
  if (!a || a.length <= left + right + 1) return a || "";
  return `${a.slice(0, left)}…${a.slice(-right)}`;
}
