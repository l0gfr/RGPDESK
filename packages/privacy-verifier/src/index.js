// Bounded ZIP preflight and stream adapter adapted from BLACKPROOF verifier at 211166d.
// Historical verifier is unchanged; differential regression tests cover shared ZIP properties.
import JSZip from "jszip";
import { assertShare, canonicalJson, renderShareFiles, SHARE_FILES, SHARE_LIMITATION } from "../../privacy-core/src/share-format.js";
import validateManifest from "../../privacy-core/src/generated/manifest-validator.js";
export const MAX_ZIP_BYTES = 2 * 1024 * 1024;
const MAX_DELIVERY_FILE_BYTES = 512 * 1024;
const MAX_DELIVERY_EXPANDED_BYTES = 2 * 1024 * 1024;
const DELIVERY_FILES = SHARE_FILES;
const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8", { fatal: true });
const zipError = () => new Error("INVALID_ZIP");
export async function sha256(bytes) {
  const copy = new Uint8Array(bytes);
  const hash = await globalThis.crypto.subtle.digest("SHA-256", copy);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
function parseJson(bytes) {
  if (bytes.byteLength > MAX_DELIVERY_FILE_BYTES) throw new Error("LIMIT");
  const text = decoder.decode(bytes); let depth = 0, nodes = 0; let quoted = false, escaped = false;
  for (const c of text) {
    if (quoted) { if (escaped) escaped = false; else if (c === "\\") escaped = true; else if (c === '"') quoted = false; }
    else if (c === '"') quoted = true;
    else if (c === "{" || c === "[") { if (++depth > 24 || ++nodes > 30000) throw new Error("LIMIT"); }
    else if (c === "}" || c === "]") depth--;
  }
  return JSON.parse(text);
}
const EOCD_SIGNATURE = 0x06054b50;
const CENTRAL_SIGNATURE = 0x02014b50;
const LOCAL_SIGNATURE = 0x04034b50;
const CRC32_TABLE = Uint32Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) value = (value & 1) !== 0 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});

function inspectDeliveryZip(bytes) {
  if (bytes.byteLength < 22) throw zipError("Delivery ZIP is truncated.");
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let eocd = -1;
  for (let offset = bytes.byteLength - 22, floor = Math.max(0, bytes.byteLength - 22 - 65_535); offset >= floor; offset -= 1) {
    if (view.getUint32(offset, true) === EOCD_SIGNATURE && offset + 22 + view.getUint16(offset + 20, true) === bytes.byteLength) { eocd = offset; break; }
  }
  if (eocd < 0 || view.getUint16(eocd + 20, true) !== 0) throw zipError("Delivery ZIP central directory is missing.");
  const disk = view.getUint16(eocd + 4, true);
  const centralDisk = view.getUint16(eocd + 6, true);
  const entriesOnDisk = view.getUint16(eocd + 8, true);
  const entryCount = view.getUint16(eocd + 10, true);
  const centralSize = view.getUint32(eocd + 12, true);
  const centralOffset = view.getUint32(eocd + 16, true);
  if (disk !== 0 || centralDisk !== 0 || entriesOnDisk !== entryCount || entryCount !== DELIVERY_FILES.length
    || entryCount === 0xffff || centralSize === 0xffffffff || centralOffset === 0xffffffff
    || centralOffset + centralSize !== eocd || centralOffset > eocd) throw zipError("Delivery ZIP central directory is unsafe.");
  const decoder = new TextDecoder("utf-8", { fatal: true });
  const names = new Set();
  const entries = new Map();
  const ranges = [];
  let totalExpanded = 0;
  let cursor = centralOffset;
  for (let index = 0; index < entryCount; index += 1) {
    if (cursor + 46 > eocd || view.getUint32(cursor, true) !== CENTRAL_SIGNATURE) throw zipError("Delivery ZIP central entry is invalid.");
    const flags = view.getUint16(cursor + 8, true);
    const method = view.getUint16(cursor + 10, true);
    const crc = view.getUint32(cursor + 16, true);
    const compressedSize = view.getUint32(cursor + 20, true);
    const expandedSize = view.getUint32(cursor + 24, true);
    const nameLength = view.getUint16(cursor + 28, true);
    const extraLength = view.getUint16(cursor + 30, true);
    const commentLength = view.getUint16(cursor + 32, true);
    const startDisk = view.getUint16(cursor + 34, true);
    const localOffset = view.getUint32(cursor + 42, true);
    if ((flags & ~0x0800) !== 0 || ![0, 8].includes(method) || startDisk !== 0 || extraLength !== 0 || commentLength !== 0
      || compressedSize === 0xffffffff || expandedSize === 0xffffffff || localOffset === 0xffffffff
      || expandedSize > MAX_DELIVERY_FILE_BYTES || nameLength < 1 || nameLength > 180 || cursor + 46 + nameLength > eocd) {
      throw zipError("Delivery ZIP entry metadata is unsafe.");
    }
    let name;
    try { name = decoder.decode(bytes.subarray(cursor + 46, cursor + 46 + nameLength)); } catch { throw zipError("Delivery ZIP entry name is invalid UTF-8."); }
    if (!DELIVERY_FILES.includes(name) || names.has(name)) throw zipError("Delivery ZIP contains an unsafe or duplicate entry name.");
    names.add(name);
    entries.set(name, { crc32: crc, compressedSize, uncompressedSize: expandedSize });
    totalExpanded += expandedSize;
    if (totalExpanded > MAX_DELIVERY_EXPANDED_BYTES) throw zipError("Delivery ZIP expanded size exceeds the limit.");
    if (localOffset + 30 > centralOffset || view.getUint32(localOffset, true) !== LOCAL_SIGNATURE) throw zipError("Delivery ZIP local entry is invalid.");
    const localFlags = view.getUint16(localOffset + 6, true);
    const localMethod = view.getUint16(localOffset + 8, true);
    const localCrc = view.getUint32(localOffset + 14, true);
    const localCompressed = view.getUint32(localOffset + 18, true);
    const localExpanded = view.getUint32(localOffset + 22, true);
    const localNameLength = view.getUint16(localOffset + 26, true);
    const localExtraLength = view.getUint16(localOffset + 28, true);
    const dataOffset = localOffset + 30 + localNameLength;
    if (localFlags !== flags || localMethod !== method || localCrc !== crc || localCompressed !== compressedSize || localExpanded !== expandedSize
      || localExtraLength !== 0 || localNameLength !== nameLength || dataOffset + compressedSize > centralOffset
      || decoder.decode(bytes.subarray(localOffset + 30, dataOffset)) !== name) throw zipError("Delivery ZIP local and central metadata differ.");
    ranges.push({ start: localOffset, end: dataOffset + compressedSize });
    cursor += 46 + nameLength;
  }
  if (cursor !== eocd || names.size !== DELIVERY_FILES.length || DELIVERY_FILES.some((name) => !names.has(name))) throw zipError("Delivery ZIP inventory is incomplete.");
  ranges.sort((left, right) => left.start - right.start);
  if (ranges[0]?.start !== 0 || ranges.at(-1)?.end !== centralOffset || ranges.some((range, index) => index > 0 && ranges[index - 1].end !== range.start)) {
    throw zipError("Delivery ZIP contains overlapping or hidden byte ranges.");
  }
  return entries;
}

function extractDeliveryZipEntry(entry, expected, expandedTotal) {
  // JSZip 3.10.1 exposes bounded decompression only through this pinned stream adapter.
  return new Promise((resolve, reject) => {
    const chunks = [];
    let fileBytes = 0;
    let crc = 0xffffffff;
    let settled = false;
    const stream = entry.internalStream("uint8array");
    const fail = (message) => {
      if (settled) return;
      settled = true;
      stream.pause();
      reject(zipError(message));
    };
    stream.on("data", (chunk) => {
      if (settled) return;
      fileBytes += chunk.byteLength;
      expandedTotal.value += chunk.byteLength;
      if (fileBytes > expected.uncompressedSize) return fail(`Delivery ZIP entry expands beyond its validated size: ${entry.name}.`);
      if (fileBytes > MAX_DELIVERY_FILE_BYTES) return fail(`Delivery ZIP entry exceeds the expanded size limit: ${entry.name}.`);
      if (expandedTotal.value > MAX_DELIVERY_EXPANDED_BYTES) return fail("Delivery ZIP expanded size exceeds the limit.");
      for (const byte of chunk) crc = CRC32_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
      chunks.push(new Uint8Array(chunk));
    });
    stream.on("error", () => fail(`Delivery ZIP entry cannot be decompressed safely: ${entry.name}.`));
    stream.on("end", () => {
      if (settled) return;
      if (fileBytes !== expected.uncompressedSize) return fail(`Delivery ZIP entry does not match its validated size: ${entry.name}.`);
      if (((crc ^ 0xffffffff) >>> 0) !== expected.crc32) return fail(`Delivery ZIP entry fails its CRC check: ${entry.name}.`);
      settled = true;
      const output = new Uint8Array(fileBytes); let offset = 0;
      for (const chunk of chunks) { output.set(chunk, offset); offset += chunk.length; }
      resolve(output);
    });
    stream.resume();
  });
}

export async function packageFiles(register) {
  assertShare(register);
  const files = renderShareFiles(register);
  const entries = [];
  for (const name of Object.keys(files).sort()) {
    const bytes = encoder.encode(files[name]);
    if (bytes.length > MAX_DELIVERY_FILE_BYTES) throw new Error("LIMIT");
    entries.push({ name, bytes: bytes.length, sha256: await sha256(bytes) });
  }
  const body = { format: "rgpd-manifest-v1", canonicalization: "rgpdesk-sorted-json-v1", deliveryId: register.id, files: entries };
  const manifest = { ...body, sha256: await sha256(encoder.encode(canonicalJson(body))) };
  files["manifest.json"] = canonicalJson(manifest) + "\n";
  return { files, manifestHash: manifest.sha256 };
}
export async function zipFiles(files) {
  if (canonicalJson(Object.keys(files).sort()) !== canonicalJson(SHARE_FILES)) throw new Error("INVALID_INVENTORY");
  const zip = new JSZip();
  for (const name of SHARE_FILES) zip.file(name, encoder.encode(files[name]), { date: new Date("2000-01-01T00:00:00.000Z"), createFolders: false });
  const bytes = await zip.generateAsync({ type: "uint8array", compression: "STORE", platform: "DOS", streamFiles: false });
  if (bytes.length > MAX_ZIP_BYTES) throw new Error("LIMIT");
  return bytes;
}
export async function verifyFiles(files) {
  if (canonicalJson(Object.keys(files).sort()) !== canonicalJson(SHARE_FILES)) throw new Error("INVALID_INVENTORY");
  let total = 0;
  const bytes = new Map();
  for (const name of SHARE_FILES) {
    if (typeof files[name] !== "string") throw new Error("INVALID_FILE");
    const value = encoder.encode(files[name]); total += value.length;
    if (value.length > MAX_DELIVERY_FILE_BYTES || total > MAX_DELIVERY_EXPANDED_BYTES) throw new Error("LIMIT");
    bytes.set(name, value);
  }
  const register = parseJson(bytes.get("register.json")); assertShare(register);
  const manifest = parseJson(bytes.get("manifest.json"));
  if (!validateManifest(manifest) || manifest.deliveryId !== register.id) throw new Error("INVALID_MANIFEST");
  const { sha256: expected, ...body } = manifest;
  if (await sha256(encoder.encode(canonicalJson(body))) !== expected) throw new Error("INVALID_HASH");
  if (canonicalJson(manifest.files.map((f) => f.name).sort()) !== canonicalJson(SHARE_FILES.filter((n) => n !== "manifest.json"))) throw new Error("INVALID_INVENTORY");
  for (const entry of manifest.files) {
    const content = bytes.get(entry.name);
    if (!content || content.length !== entry.bytes || await sha256(content) !== entry.sha256) throw new Error("INVALID_HASH");
  }
  const canonical = renderShareFiles(register);
  // Recomputed hashes cannot bless active HTML or divergent CSV/JSON sidecars.
  if (Object.entries(canonical).some(([name, content]) => content !== files[name]) || files["manifest.json"] !== canonicalJson(manifest) + "\n") throw new Error("INVALID_CANONICAL");
  return { register, manifestHash: expected };
}
export async function verifyPackage(input) {
  try {
    if (!(input instanceof Uint8Array) || input.byteLength > MAX_ZIP_BYTES) throw new Error("LIMIT");
    const bytes = new Uint8Array(input);
    const expected = inspectDeliveryZip(bytes);
    const zip = await JSZip.loadAsync(bytes, { checkCRC32: false, createFolders: false });
    if (canonicalJson(Object.keys(zip.files).sort()) !== canonicalJson(SHARE_FILES)) throw new Error("INVALID_INVENTORY");
    const total = { value: 0 }; const files = {};
    for (const name of SHARE_FILES) files[name] = decoder.decode(await extractDeliveryZipEntry(zip.file(name), expected.get(name), total));
    const { register, manifestHash } = await verifyFiles(files);
    return { valid: true, code: "INTEGRITY_OK", limitation: SHARE_LIMITATION, profile: register.profile, coverage: register.coverage, manifestHash };
  } catch { return { valid: false, code: "INVALID_PACKAGE", limitation: SHARE_LIMITATION }; }
}
