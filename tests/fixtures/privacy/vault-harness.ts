// Bundled only by Playwright and served through an intercepted test-only route.
// Never imported by the application or copied into the static build.
import * as verifier from "../../../packages/privacy-verifier/src/index.js";
import * as domain from "../../../packages/privacy-core/src/index";
import * as persistence from "../../../apps/web/src/features/privacy/persistence/vault";
import * as encryption from "../../../apps/web/src/features/privacy/persistence/crypto";
import { encryptLocalPayloadBatch } from "../../../apps/web/src/lib/local-encryption";

const api = { ...verifier, ...domain, ...persistence, ...encryption, encryptLocalPayloadBatch };
declare global { interface Window { privacyTest: typeof api } }
window.privacyTest = api;
