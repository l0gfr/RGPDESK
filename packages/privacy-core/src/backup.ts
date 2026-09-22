import validate from "./generated/backup-validator.js";
import { PrivacyError } from "./validation";

export interface PrivacyEnvelope {
  version: 2;
  algorithm: "AES-GCM";
  keyDerivation: "PBKDF2-SHA-256";
  iterations: number;
  salt: string;
  iv: string;
  aad: string;
  ciphertext: string;
}
export interface PrivacyBackup {
  format: "rgpd-backup-v1";
  workspaceId: string;
  revision: number;
  envelope: PrivacyEnvelope;
}
export function assertBackup(value: unknown): asserts value is PrivacyBackup {
  if (!validate(value)) throw new PrivacyError("INVALID");
}
