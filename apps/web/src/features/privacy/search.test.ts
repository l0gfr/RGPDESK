import { describe, expect, it } from "vitest";
import { createActivity, createDataFlow, createWorkspace, knowledge } from "@rgpdesk/privacy-core";
import { createDemoWorkspace } from "./demo";
import { normalizeSearch, SEARCH_LIMIT, searchWorkspace } from "./search";
import { startingPoints } from "./guidance";
import { businessGuides, businessSources } from "./business-guides";

const at = "2026-09-23T12:00:00.000Z";
const demo = () => createDemoWorkspace(() => crypto.randomUUID(), at);
describe("volatile search of the current client's saved content", () => {
  it("returns nothing for a locked workspace, blank or one-character search", () => {
    expect(searchWorkspace(null, "recrutement").total).toBe(0);
    for (const query of ["", " ", "r", "é"]) expect(searchWorkspace(demo(), query).results).toEqual([]);
  });
  it("normalizes accents, ligatures and case without treating input as code", () => {
    expect(normalizeSearch("  ŒUVRE Éclairée  ")).toBe("oeuvre eclairee");
    const w = demo(); w.activities[0]!.title = "Équipe [a+b] <img src=x onerror=alert(1)>";
    expect(searchWorkspace(w, "equipe [a+b]").results[0]?.title).toBe(w.activities[0]!.title);
    expect(searchWorkspace(w, "(.*)").total).toBe(0);
  });
  it("finds flows and related providers even when they are not in the activity title", () => {
    const w = demo(); const a = w.activities[0]!;
    a.flows = [{ ...createDataFlow(crypto.randomUUID()), destination: knowledge("Prestataire fictif Orchidée") }];
    expect(searchWorkspace(w, "orchidee", "activity").results.map((r) => r.id)).toContain(a.id);
    w.parties[0]!.name = "Fournisseur fictif Jasmin"; a.participantIds = [w.parties[0]!.id];
    expect(searchWorkspace(w, "jasmin", "activity").results.map((r) => r.id)).toContain(a.id);
  });
  it("finds current document, DPO and PIA content, with deterministic navigation targets", () => {
    const w = demo();
    w.documents[0]!.reservations = "DOCUMENT_FICTIF_AZUR";
    w.dpoCases[0]!.content.notes[0]!.facts = knowledge("DOSSIER_FICTIF_IRIS");
    w.impactAssessments[0]!.content.dpoAdvice = knowledge("IMPACT_FICTIF_PIVOINE");
    for (const [query, kind] of [["DOCUMENT_FICTIF_AZUR", "document"], ["DOSSIER_FICTIF_IRIS", "dpo"], ["IMPACT_FICTIF_PIVOINE", "pia"]] as const) {
      expect(searchWorkspace(w, query).results.map((r) => r.kind)).toEqual([kind]);
      expect(searchWorkspace(w, query, "activity").total).toBe(0);
    }
  });
  it("requires every term and prefers title matches over incidental mentions", () => {
    const w = demo(); w.activities[0]!.title = "Atelier fictif comptable";
    w.activities[1]!.internalNotes = "Atelier fictif comptable";
    const results = searchWorkspace(w, "comptable atelier", "activity").results;
    expect(results.map((r) => r.id)).toEqual([w.activities[0]!.id, w.activities[1]!.id]);
    expect(searchWorkspace(w, "comptable introuvable").total).toBe(0);
  });
  it("does not search IDs, historical reviews or another client's workspace", () => {
    const w = demo(); w.dpoCases[0]!.reviews[0]!.reason = "HISTORIQUE_FICTIF_291";
    expect(searchWorkspace(w, "HISTORIQUE_FICTIF_291").total).toBe(0);
    expect(searchWorkspace(w, w.id).total).toBe(0);
    expect(searchWorkspace(w, w.activities[0]!.id).total).toBe(0);
    const other = createWorkspace(crypto.randomUUID(), "Autre client fictif", at);
    expect(searchWorkspace(other, "recrutement").total).toBe(0);
  });
  it("does not mutate or retain the master; updates replace previous searchable content", () => {
    const w = demo(), before = JSON.stringify(w);
    searchWorkspace(w, "fictif"); expect(JSON.stringify(w)).toBe(before);
    w.activities[0]!.title = "Titre fictif unique RUBIS";
    expect(searchWorkspace(w, "RUBIS").total).toBe(1);
    w.activities[0]!.title = "Titre fictif unique TOPAZE";
    expect(searchWorkspace(w, "RUBIS").total).toBe(0);
    expect(searchWorkspace(null, "TOPAZE").total).toBe(0);
  });
  it("bounds query, excerpts and displayed results while retaining the actual count", () => {
    const w = createWorkspace(crypto.randomUUID(), "Volume fictif", at);
    for (let i = 0; i < 200; i++) { const a = createActivity(w.id, crypto.randomUUID(), "controller"); a.title = `Test fictif ${i}`; a.internalNotes = "Longueur ".repeat(450); w.activities.push(a); }
    expect(searchWorkspace(w, "test").total).toBe(200);
    expect(searchWorkspace(w, "test").results).toHaveLength(SEARCH_LIMIT);
    expect(searchWorkspace(w, "longueur").results.every((r) => r.excerpt.length <= 221)).toBe(true);
    expect(searchWorkspace(w, "test" + " ".repeat(156) + "missing").total).toBe(200);
  });
});

describe("sourced interview catalogue", () => {
  it("provides twelve unique starters, each linked to six sourced questions", () => {
    expect(startingPoints).toHaveLength(12);
    expect(new Set(startingPoints.map((p) => p.id)).size).toBe(12);
    for (const starter of startingPoints) {
      const guide = businessGuides[starter.id];
      expect(guide.questions).toHaveLength(6);
      for (const question of guide.questions) {
        expect(question.location.length).toBeGreaterThan(3);
        const url = new URL(businessSources[question.source].url);
        expect(url.protocol).toBe("https:");
        expect(["www.cnil.fr", "eur-lex.europa.eu"]).toContain(url.hostname);
      }
      // Editorial prompts never set legal facts in a new record.
      const a = createActivity(crypto.randomUUID(), crypto.randomUUID(), "controller"); a.title = starter.title;
      expect(a.role).toBe("controller");
      if (a.role === "controller") expect(a.purposes).toEqual([]);
      expect(a.review.transferStatus).toBe("unknown");
    }
  });
});
