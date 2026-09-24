import { knowledge, knowledgeText, unknown, type Activity, type DataFlow, type DataGroup, type FlowStep, type StepReference, type Knowledge, type Workspace } from "./model";
import { flowSubjects } from "./data-groups";
import { PrivacyError } from "./validation";
type Inventory = Pick<Workspace, "parties" | "systems">;
export const createFlowStep = (id: string): FlowStep => ({ id, source: unknown(), destination: unknown(), operation: unknown(), channel: unknown(), location: unknown(), access: unknown(), when: unknown(), supportIds: [] });
export const flowSteps = (f: DataFlow): (FlowStep | DataFlow)[] => f.journey?.steps ?? [f];
export const flowReferences = (f: DataFlow): StepReference[] => flowSteps(f).flatMap(s => [s.sourceRef, s.destinationRef].filter((r): r is StepReference => r !== undefined));
export function groupPurposeIds(a: Activity, g: DataGroup): string[] { return [...new Set([...g.purposeIds, ...a.flows.filter(f => f.dataGroupIds?.includes(g.id)).flatMap(f => f.journey?.purposeIds ?? [])])]; }
export function journeyPurposeText(a: Activity, f: DataFlow): string {
  if (a.role !== "controller") return "Opérations pour le client";
  return (f.journey?.purposeIds ?? []).map(id => { const i = a.purposes.findIndex(p => p.id === id); return i < 0 ? "Sous-finalité à vérifier" : `SF${i + 1} · ${knowledgeText(a.purposes[i]!.description) || "À préciser"}`; }).join(" ; ") || "Sous-finalités à relier";
}
export function nextJourneyReference(a: Activity, groupId: string): string {
  const code = a.dataGroups?.find(g => g.id === groupId)?.code ?? 1;
  const used = new Set(a.flows.flatMap(f => f.journey ? [f.journey.reference] : []));
  for (const c of "abcdefghijklmnopqrstuvwxyz") if (!used.has(`${code}${c}`)) return `${code}${c}`;
  throw new PrivacyError("LIMIT");
}
export function resolveStepEndpoint(ref: StepReference | undefined, value: Knowledge, a: Activity, f: DataFlow, inventory: Inventory): Knowledge {
  if (!ref) return value;
  if (ref === "subjects") return flowSubjects(a, f);
  if (ref.startsWith("support:")) { const s=a.flowSupports?.find(x=>x.id===ref.slice(8));return s ? knowledge(`Support ${s.code} · ${s.name}`) : unknown(); }
  return knowledge((ref.startsWith("party:") ? inventory.parties : inventory.systems).find(e => e.id === ref.slice(ref.indexOf(":") + 1))?.name ?? "");
}
export interface JourneyStepView { id: string; source: string; destination: string; operation: string; channel: string; location: string; access: string; when: string; supports: string }
export function stepSupportIds(s: FlowStep): string[] { return [...new Set([...s.supportIds, ...[s.sourceRef,s.destinationRef].filter((r): r is `support:${string}` => r?.startsWith("support:") ?? false).map(r=>r.slice(8))])]; }
export function journeySteps(a: Activity, f: DataFlow, inventory: Inventory): JourneyStepView[] {
  const text = (k: Knowledge) => knowledgeText(k) || "À préciser";
  return (f.journey?.steps ?? []).map(s => ({ id:s.id,
    source:text(resolveStepEndpoint(s.sourceRef,s.source,a,f,inventory)),destination:text(resolveStepEndpoint(s.destinationRef,s.destination,a,f,inventory)),
    operation:text(s.operation),channel:text(s.channel),location:text(s.location),access:text(s.access),when:knowledgeText(s.when),
    supports:stepSupportIds(s).map(id=> {const support=a.flowSupports?.find(x=>x.id===id);return support ? `Support ${support.code} · ${support.name || "À nommer"}` : "Support à vérifier";}).join(" ; ") || "Supports à préciser"
  }));
}
/** Text-only projection for the existing share whitelist. No references or private IDs. */
export function resolveJourney(a: Activity, f: DataFlow, inventory: Inventory): DataFlow {
  const steps=journeySteps(a,f,inventory), j=f.journey!;
  const lines=(key:"channel"|"location"|"access")=>knowledge(steps.map((s,i)=>`${i+1}. ${s[key]}${key==="channel" ? ` · ${s.supports}` : ""}`).join("\n"));
  return {id:f.id,source:knowledge(steps[0]?.source ?? ""),destination:knowledge(steps.at(-1)?.destination ?? ""),
    operation:knowledge(`Parcours ${j.reference} · ${journeyPurposeText(a,f)}\n`+steps.map((s,i)=>`${i+1}. ${s.operation}${s.when ? ` · Quand / condition : ${s.when}` : ""}\n${s.source} → ${s.destination}`).join("\n")),
    data:knowledge((a.dataGroups ?? []).filter(g=>f.dataGroupIds?.includes(g.id)).map(g=>`D${g.code} : ${knowledgeText(g.data)||"À documenter"}`).join(" ; ")),
    channel:lines("channel"),location:lines("location"),access:lines("access")};
}
/** Called for current and frozen contexts. Existing flat flows remain valid. */
export function assertJourneys(a: Activity): void {
  const supports=a.flowSupports ?? [], supportIds=new Set(supports.map(s=>s.id));
  const ids=new Set([a.id,a.workspaceId,...a.flows.map(f=>f.id),...(a.dataGroups ?? []).map(g=>g.id),...(a.role==="controller" ? a.purposes.map(p=>p.id) : [])]);
  const unique=(id:string)=>{if(ids.has(id))throw new PrivacyError("INVALID");ids.add(id);};
  supports.forEach(s=>unique(s.id));
  if(new Set(supports.map(s=>s.code)).size!==supports.length)throw new PrivacyError("INVALID");
  const refs=new Set<string>();
  for(const f of a.flows){if(!f.journey)continue;
    if(!f.dataGroupIds?.length || f.sourceRef || f.destinationRef || f.dataFromActivity || [f.source,f.destination,f.data,f.operation,f.channel,f.location,f.access].some(k=>k.state!=="unknown"))throw new PrivacyError("INVALID");
    if(refs.has(f.journey.reference))throw new PrivacyError("INVALID");refs.add(f.journey.reference);
    if(f.journey.purposeIds.some(id=>a.role!=="controller" || !a.purposes.some(p=>p.id===id)))throw new PrivacyError("INVALID");
    for(const s of f.journey.steps){unique(s.id);if(stepSupportIds(s).some(id=>!supportIds.has(id)))throw new PrivacyError("INVALID");}
  }
}
