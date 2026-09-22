import type { SharedRegister } from "../../privacy-core/src/share";
export const MAX_ZIP_BYTES: number;
export function sha256(bytes: Uint8Array): Promise<string>;
export function packageFiles(value: SharedRegister): Promise<{ files: Record<string, string>; manifestHash: string }>;
export function zipFiles(files: Record<string, string>): Promise<Uint8Array<ArrayBuffer>>;
export function verifyFiles(files: Record<string, string>): Promise<{ register: SharedRegister; manifestHash: string }>;
export interface VerificationResult { valid: boolean; code: string; limitation: string; profile?: string; coverage?: string; manifestHash?: string }
export function verifyPackage(input: Uint8Array): Promise<VerificationResult>;
