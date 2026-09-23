import { expect, test } from "vitest";
import { PRIVACY_ROUTES, privacyAnchor, parsePrivacyAnchor, type PrivacyPanel } from "./navigation";
test("section links accept only exact generic routes with an explicit demonstration namespace", () => {
  for (const panel of Object.keys(PRIVACY_ROUTES) as PrivacyPanel[]) for (const demo of [false,true]) {
    expect(parsePrivacyAnchor(privacyAnchor(panel,demo))).toEqual({panel,demo});
  }
  for (const hash of ["", "#main", "#demo", "#demo/registre/client-secret", "#registre?client=secret", "#%72egistre", "#https://example.invalid", "#demo/constructor", "#demo/__proto__"]) expect(parsePrivacyAnchor(hash)).toBeNull();
});
