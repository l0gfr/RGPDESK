#!/usr/bin/env node
import { open } from "node:fs/promises";
import { constants } from "node:fs";
import { MAX_ZIP_BYTES, verifyPackage } from "../src/index.js";
if (process.argv.length !== 3) {
  process.stderr.write("Usage: rgpdesk-verify dossier.zip\n"); process.exitCode = 2;
} else {
  let handle;
  try {
    handle = await open(process.argv[2], constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
    const before = await handle.stat({ bigint: true });
    if (!before.isFile() || before.size > BigInt(MAX_ZIP_BYTES)) throw new Error("INVALID_FILE");
    const bytes = new Uint8Array(Number(before.size)); let offset = 0;
    while (offset < bytes.length) {
      const { bytesRead } = await handle.read(bytes, offset, bytes.length - offset, offset);
      if (!bytesRead) throw new Error("CHANGED_FILE"); offset += bytesRead;
    }
    const after = await handle.stat({ bigint: true });
    if (after.size !== before.size || after.mtimeNs !== before.mtimeNs || after.ctimeNs !== before.ctimeNs) throw new Error("CHANGED_FILE");
    const result = await verifyPackage(bytes);
    process.stdout.write(JSON.stringify(result) + "\n"); process.exitCode = result.valid ? 0 : 1;
  } catch { process.stdout.write('{"valid":false,"code":"UNREADABLE_OR_UNSAFE_FILE"}\n'); process.exitCode = 1; }
  finally { await handle?.close(); }
}
