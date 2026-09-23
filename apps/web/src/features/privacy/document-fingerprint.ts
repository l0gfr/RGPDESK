export const MAX_DOCUMENT_BYTES = 20 * 1024 * 1024;
export class FingerprintError extends Error {
  constructor(public readonly code: "LIMIT" | "CANCELLED" | "READ") { super(code); }
}
const check = (signal: AbortSignal) => { if (signal.aborted) throw new FingerprintError("CANCELLED"); };

/** Explicitly selected bytes only. No parsing, name, path, preview, network or persistence. */
export async function fingerprintDocument(file: Blob, signal: AbortSignal): Promise<{ sha256: string; bytes: number }> {
  check(signal);
  if (!Number.isSafeInteger(file.size) || file.size < 0 || file.size > MAX_DOCUMENT_BYTES) throw new FingerprintError("LIMIT");
  let data: Uint8Array<ArrayBuffer> | undefined;
  try {
    data = new Uint8Array(await file.arrayBuffer());
    check(signal);
    if (data.byteLength !== file.size || data.byteLength > MAX_DOCUMENT_BYTES) throw new FingerprintError("LIMIT");
    const digest = await crypto.subtle.digest("SHA-256", data);
    check(signal);
    return { sha256: Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, "0")).join(""), bytes: data.byteLength };
  } catch (error) {
    if (error instanceof FingerprintError) throw error;
    throw new FingerprintError("READ");
  } finally {
    // Best effort on our owned buffer; JS and WebCrypto cannot guarantee memory erasure.
    data?.fill(0);
  }
}
