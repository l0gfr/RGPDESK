import { describe, expect, it } from "vitest";
import { createActivity, createDataFlow, createDataGroup, createPurpose, createWorkspace, knowledge, unknown } from "@rgpdesk/privacy-core";
import { appendDeclarations, containsDeclaration, DECLARATION_LIMIT, filterDeclarations, reusableDeclarations } from "./reusable-declarations";
const at = "2026-09-24T15:00:00.000Z";
function fixture() {
  const workspace = createWorkspace(crypto.randomUUID(), "Client fictif", at);
  const activity = createActivity(workspace.id, crypto.randomUUID(), "controller");
  if (activity.role !== "controller") throw new Error("Unexpected fixture role");
  activity.title = "Ensemble fictif";
  const group = createDataGroup(crypto.randomUUID(), 1);
  group.data = knowledge("Coordonnées professionnelles");
  group.people = knowledge("Contacts professionnels");
  group.retention.period = knowledge("Durée fictive à examiner");
  group.retention.trigger = knowledge("Fin de la relation fictive");
  activity.dataGroups = [group]; workspace.activities = [activity];
  return { workspace, activity, group };
}
describe("reusable declarations scoped to the open vault", () => {
  it("collects support names without importing their references or other clients", () => {
    const {workspace,activity}=fixture();
    activity.flowSupports=[{id:crypto.randomUUID(),code:1,name:"Support fictif <b>texte</b>"}];
    const found=reusableDeclarations(workspace,null,"support");
    expect(found).toEqual([{text:"Support fictif <b>texte</b>",sources:["Ensemble fictif · Support 1"],occurrences:1}]);
    expect(JSON.stringify(found)).not.toContain(activity.flowSupports[0]!.id);
    const other=createWorkspace(crypto.randomUUID(),"Autre client fictif",at);
    expect(reusableDeclarations(other,null,"support")).toEqual([]);
    expect(reusableDeclarations(null,activity,"support")).toEqual([]);
    activity.status="archived";expect(reusableDeclarations(workspace,null,"support")).toEqual([]);
  });
  it("adds whole declarations once without erasing, interpreting or truncating text", () => {
    const current="Mon texte à garder  ";
    expect(appendDeclarations(current,["Site A","Site B","Site A"])).toBe(current+"\nSite A\nSite B");
    expect(appendDeclarations("Site A\n",["Site A","<b>Site B</b>"])).toBe("Site A\n<b>Site B</b>");
    expect(appendDeclarations("Accès interdit au Site A",["Site A"])).toBe("Accès interdit au Site A\nSite A");
    expect(appendDeclarations("",["Rôle A\nSeulement en lecture"])).toBe("Rôle A\nSeulement en lecture");
    expect(containsDeclaration("Rôle A\nSeulement en lecture","Rôle A\nSeulement en lecture")).toBe(true);
    expect(appendDeclarations("x".repeat(3998),["y"])).toHaveLength(4000);
    expect(appendDeclarations("x".repeat(3999),["y"])).toBeNull();
    expect(appendDeclarations("",["x".repeat(4001)])).toBeNull();
  });
  it("only collects the requested category and current documented values", () => {
    const { workspace, activity, group } = fixture();
    activity.recipients = knowledge("Service fictif");
    const purpose = createPurpose(crypto.randomUUID()); purpose.description = knowledge("Usage fictif"); purpose.legalBasis = knowledge("AVIS_NON_REUTILISABLE"); activity.purposes = [purpose];
    expect(reusableDeclarations(workspace, null, "data").map(x=>x.text)).toEqual([group.data.state === "documented" ? group.data.value : ""]);
    expect(reusableDeclarations(workspace, null, "purpose").map(x=>x.text)).toEqual(["Usage fictif"]);
    expect(reusableDeclarations(workspace, null, "recipients").map(x=>x.text)).toEqual(["Service fictif"]);
    expect(JSON.stringify(reusableDeclarations(workspace, null, "period"))).toContain("Fin de la relation fictive");
    activity.dataGroups=[]; activity.dataCategories=unknown();
    expect(reusableDeclarations(workspace, null, "data")).toEqual([]);
  });
  it("replaces the saved activity with its draft without mutating either", () => {
    const { workspace, activity } = fixture(); const draft = structuredClone(activity);
    draft.dataGroups![0]!.data=knowledge("Nouvelle déclaration fictive");
    const before=JSON.stringify({workspace,draft});
    const found=reusableDeclarations(workspace,draft,"data");
    expect(found.map(x=>x.text)).toEqual(["Nouvelle déclaration fictive"]);
    expect(found[0]!.sources[0]).toContain("saisie en cours");
    expect(JSON.stringify({workspace,draft})).toBe(before);
  });
  it("keeps vaults isolated, returns nothing after lock and retains no previous content", () => {
    const {workspace,activity}=fixture(); const other=createWorkspace(crypto.randomUUID(),"Autre client fictif",at);
    expect(reusableDeclarations(other,null,"data")).toEqual([]);
    expect(reusableDeclarations(other,activity,"data")).toEqual([]);
    expect(reusableDeclarations(null,activity,"data")).toEqual([]);
    other.activities=[activity]; expect(reusableDeclarations(other,null,"data")).toEqual([]);
    expect(reusableDeclarations(workspace,null,"data")).toHaveLength(1);
    workspace.activities=[]; expect(reusableDeclarations(workspace,null,"data")).toEqual([]);
  });
  it("deduplicates identical text, preserves differing durations and limits provenance", () => {
    const {workspace,activity}=fixture(); activity.dataCategories=knowledge("Coordonnées professionnelles");
    for(let i=2;i<=6;i++){const g=createDataGroup(crypto.randomUUID(),i);g.data=knowledge("Coordonnées professionnelles");activity.dataGroups!.push(g);}
    const data=reusableDeclarations(workspace,null,"data");expect(data).toHaveLength(1);expect(data[0]!.occurrences).toBe(7);expect(data[0]!.sources).toHaveLength(3);
    activity.dataGroups![1]!.retention.period=knowledge("Autre durée à examiner");
    expect(reusableDeclarations(workspace,null,"period")).toHaveLength(2);
  });
  it("does not propose archived records, opinions, notes, linked endpoint copies or stale flow data", () => {
    const {workspace,activity}=fixture();activity.internalNotes="NOTE_NON_REUTILISABLE";
    const f=createDataFlow(crypto.randomUUID()); f.channel=knowledge("Canal fictif"); f.source=knowledge("ORIGINE_PERIMEE");f.sourceRef="subjects";f.data=knowledge("DONNEES_PERIMEES");f.dataGroupIds=[activity.dataGroups![0]!.id];activity.flows=[f];
    expect(reusableDeclarations(workspace,null,"endpoint")).toEqual([]);
    expect(reusableDeclarations(workspace,null,"channel")[0]!.text).toBe("Canal fictif");
    expect(JSON.stringify(reusableDeclarations(workspace,null,"data"))).not.toContain("PERIMEES");
    activity.status="archived";expect(reusableDeclarations(workspace,null,"data")).toEqual([]);
  });
  it("searches accents and source names literally and never interprets text or queries", () => {
    const entries=[{text:"<em>Équipe [a+b]</em>",sources:["Origine fictive"],occurrences:1}];
    expect(filterDeclarations(entries,"equipe [a+b]","").items).toEqual(entries);
    expect(filterDeclarations(entries,"origine","").total).toBe(1);
    expect(filterDeclarations(entries,".*","").total).toBe(0);
    expect(filterDeclarations(entries,"",entries[0]!.text).total).toBe(0);
  });
  it("bounds visible results while keeping later declarations searchable and full values intact", () => {
    const entries=Array.from({length:30},(_,i)=>({text:`Texte fictif ${i}`,sources:["Fiche fictive"],occurrences:1}));
    expect(filterDeclarations(entries,"","").items).toHaveLength(DECLARATION_LIMIT);
    expect(filterDeclarations(entries,"","").total).toBe(30);
    expect(filterDeclarations(entries,"29","").items).toEqual([entries[29]]);
    const {workspace,activity}=fixture();activity.dataCategories=knowledge("x".repeat(4001));
    expect(reusableDeclarations(workspace,null,"data")).toHaveLength(1);
  });
});
