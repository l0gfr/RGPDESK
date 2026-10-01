import { closeSync, constants, fstatSync, lstatSync, openSync, readSync } from "node:fs";

// Build/audit inputs are local operator files. This protects the checked file
// and read budget; it does not sandbox a compromised same-UID checkout.
export function readBoundedRegularFile(path, maximumBytes, {
  skipBinary = false, skipNonRegular = false, skipOversized = false,
} = {}) {
  if (!Number.isSafeInteger(maximumBytes) || maximumBytes < 0
    || typeof constants.O_NOFOLLOW !== "number" || typeof constants.O_NONBLOCK !== "number") {
    throw new Error("Unsupported bounded regular-file read.");
  }
  let descriptor;
  try {
    descriptor = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
  } catch (error) {
    if (skipNonRegular && error.code === "ELOOP" && lstatSync(path).isSymbolicLink()) return null;
    throw error;
  }
  let content;
  let prefix;
  let completed = false;
  try {
    const before = fstatSync(descriptor, { bigint: true });
    if (!before.isFile()) {
      if (skipNonRegular) return null;
      throw new Error("Input must be a regular non-symlink file.");
    }
    function unchanged() {
      const after = fstatSync(descriptor, { bigint: true });
      const named = lstatSync(path, { bigint: true });
      if (!named.isFile() || named.dev !== before.dev || named.ino !== before.ino
        || after.size !== before.size || after.mode !== before.mode || after.uid !== before.uid
        || after.gid !== before.gid || after.nlink !== before.nlink
        || after.mtimeNs !== before.mtimeNs || after.ctimeNs !== before.ctimeNs) {
        throw new Error("Input changed during bounded regular-file read.");
      }
    }
    function readExactly(buffer) {
      let offset = 0;
      while (offset < buffer.length) {
        const count = readSync(descriptor, buffer, offset, Math.min(1_048_576, buffer.length - offset), offset);
        if (count === 0) throw new Error("Input ended during bounded regular-file read.");
        offset += count;
      }
    }
    if (skipBinary) {
      prefix = Buffer.alloc(Number(before.size < 8192n ? before.size : 8192n));
      readExactly(prefix);
      if (prefix.includes(0)) { unchanged(); return null; }
    }
    if (before.size < 0n || before.size > BigInt(maximumBytes)) {
      if (skipOversized) { unchanged(); return null; }
      const error = new Error("Input exceeds its bounded regular-file read limit.");
      error.code = "FILE_READ_LIMIT";
      throw error;
    }
    content = Buffer.alloc(Number(before.size));
    readExactly(content);
    const overflow = Buffer.alloc(1);
    if (readSync(descriptor, overflow, 0, 1, content.length) !== 0) {
      throw new Error("Input grew during bounded regular-file read.");
    }
    unchanged();
    completed = true;
    return content;
  } finally {
    prefix?.fill(0);
    if (!completed) content?.fill(0);
    closeSync(descriptor);
  }
}
