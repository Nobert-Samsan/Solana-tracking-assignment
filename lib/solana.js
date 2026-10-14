const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

// Wrapped SOL mint: SolanaTracker lists native SOL under this mint.
export const SOL_MINT = "So11111111111111111111111111111111111111112";

/**
 * A Solana address is a base58 string that decodes to exactly 32 bytes.
 * 1) every character must be in the base58 alphabet
 * 2) the decoded value must be 32 bytes long
 */
export function isValidSolanaAddress(address) {
  if (typeof address !== "string" || address.length < 32 || address.length > 44) return false;

  let n = 0n;
  for (const ch of address) {
    const i = ALPHABET.indexOf(ch);
    if (i < 0) return false;
    n = n * 58n + BigInt(i);
  }
  let leadingZeros = 0;
  for (const ch of address) {
    if (ch === "1") leadingZeros++;
    else break;
  }
  const hexLen = n === 0n ? 0 : n.toString(16).length;
  return Math.ceil(hexLen / 2) + leadingZeros === 32;
}
