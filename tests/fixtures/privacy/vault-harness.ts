// Bundled only by Playwright and served through an intercepted test-only route.
// Never imported by the application or copied into the static build.
import * as verifier from "../../../packages/privacy-verifier/src/index.js";
import * as domain from "../../../packages/privacy-core/src/index";
import * as persistence from "../../../apps/web/src/features/privacy/persistence/vault";
import * as encryption from "../../../apps/web/src/features/privacy/persistence/crypto";
import { encryptLocalPayloadBatch } from "../../../apps/web/src/lib/local-encryption";

import { RecoveryWriter } from "../../../apps/web/src/features/privacy/persistence/recovery-writer";

import { reportBody } from "../../../apps/web/src/features/privacy/report-preview";
import { createDemoWorkspace } from "../../../apps/web/src/features/privacy/demo";

const api = { reportBody, createDemoWorkspace, RecoveryWriter, ...verifier, ...domain, ...persistence, ...encryption, encryptLocalPayloadBatch };
declare global { interface Window { privacyTest: typeof api } }
window.privacyTest = api;
