<script lang="ts">
  import type { RecoveryForm } from "../persistence/recovery";
  import { tick } from "svelte";
  import { canonicalJson, evidenceUses, unknown, createContractReview, putDocument, type EvidenceReference, type Workspace } from "@rgpdesk/privacy-core";
  import EvidenceLinker from "./EvidenceLinker.svelte";
  import DocumentOrganization from "./DocumentOrganization.svelte";
  import DocumentFiling from "./DocumentFiling.svelte";
  import KnowledgeField from "./KnowledgeField.svelte";
  import ReviewNotebook from "./ReviewNotebook.svelte";
  import { CONTRACT_METHOD } from "../review-methods";
  import Icon from "./Icon.svelte";
  import Emblem from "./Emblem.svelte";
  let { workspace, busy, onSave, onLeave, initialDocumentId = "", initialActivityId = "" }: { onLeave:(action:()=>void)=>void; initialActivityId?: string; initialDocumentId?: string; workspace: Workspace; busy: boolean; onSave: (next: Workspace) => Promise<boolean> } = $props();
  let linkDocumentId=$state('');
  let linker:EvidenceLinker|undefined=$state();
  let draft = $state<EvidenceReference | null>(null); let reviewed = $state(false); let due = $state("");
  export function hasUnsavedChanges(){if(linkDocumentId)return !!linker?.getRecovery();return !!draft&&(canonicalJson(draft)!==canonicalJson(workspace.documents.find(d=>d.id===draft!.id)??null)||reviewed||due!==(draft.reviewDue??""));}
  export function getCheckpoint(){return draft?{kind:"document" as const,id:draft.id}:undefined;}
  const fingerprintVersionPending = $derived(!!draft?.fingerprint && canonicalJson(draft.fingerprint) !== canonicalJson(workspace.documents.find(d => d.id === draft!.id)?.fingerprint ?? null) && draft.fingerprint.version !== draft.version);
  let consumedSearch = $state("");
  let referenceHeading: HTMLHeadingElement | undefined = $state();
  async function focusReference(id: string) {
    await tick();
    if (draft?.id === id && referenceHeading?.isConnected) {
      referenceHeading.focus({ preventScroll: true });
      referenceHeading.scrollIntoView({ block: "start" });
    }
  }
  $effect(() => { if (initialDocumentId && consumedSearch !== initialDocumentId) { consumedSearch = initialDocumentId; const doc = workspace.documents.find((d) => d.id === initialDocumentId); if (doc) edit(doc); } });
  $effect(() => { if (!initialDocumentId && initialActivityId && consumedSearch !== initialActivityId && workspace.activities.some((a) => a.id === initialActivityId)) { consumedSearch = initialActivityId; create(); } });
  const categories = { contract: "Contrat / acte", notice: "Notice d’information", policy: "Politique", analysis: "Analyse", other: "Autre" };
  function create() { linkDocumentId=''; draft = { id: crypto.randomUUID(), workspaceId: workspace.id, title: "", category: "contract", contractReview: null, activityIds: initialActivityId && workspace.activities.some((a) => a.id === initialActivityId) ? [initialActivityId] : [], purposeIds: [], partyIds: [], scope: "", version: "", declaredAuthor: "", internalRef: "", publicReference: "", reservations: "", sensitivity: "internal", status: "declared", reviewedRevision: null, reviewedAt: null, reviewDue: null, audience: "", channel: "", availability: unknown() }; reviewed = false; due = ""; void focusReference(draft.id); }
  function edit(doc: EvidenceReference) { linkDocumentId=''; draft = structuredClone($state.snapshot(doc)); reviewed = false; due = doc.reviewDue ?? ""; void focusReference(draft.id); }
  function toggle(field: "activityIds" | "purposeIds" | "partyIds", id: string, checked: boolean) {
    if (!draft) return; draft[field] = checked ? [...draft[field], id] : draft[field].filter((v) => v !== id);
    if (field === "activityIds") { const allowed = new Set(workspace.activities.filter((a) => draft!.activityIds.includes(a.id)).flatMap((a) => a.role === "controller" ? a.purposes.map((p) => p.id) : [])); draft.purposeIds = draft.purposeIds.filter((id) => allowed.has(id)); }
  }
  async function save() {
    if (!draft || fingerprintVersionPending) return; const now = new Date().toISOString();
    const saved = await onSave(putDocument(workspace, { ...$state.snapshot(draft), reviewDue: due || null, status: reviewed ? "reviewed" : "declared", reviewedAt: reviewed ? now : null, reviewedRevision: reviewed ? workspace.revision + 1 : null }, now));
    if (saved) draft = null;
  }
  export function getRecovery():RecoveryForm|null{if(linkDocumentId)return linker?.getRecovery()??null;return draft&&hasUnsavedChanges()?{kind:'document',draft:$state.snapshot(draft),due}:null;}
  export async function restoreRecovery(f:RecoveryForm){if(f.kind==='evidence-links'){draft=null;linkDocumentId=f.documentId;await tick();linker?.restoreRecovery(f);return;}if(f.kind!=='document')return;draft=structuredClone(f.draft);due=f.due;reviewed=false;}
</script>
<section class="panel">
  <div class="section-heading"><div><p class="eyebrow">Bibliothèque de références</p><h2>Les documents, à leur place.</h2></div><Emblem name="evidence" /><button disabled={busy} onclick={()=>onLeave(create)}><Icon name="plus" />Ajouter une référence</button></div>
  <p class="help">Rattachez un contrat, une notice ou une analyse. Le dossier conserve sa référence, jamais le fichier. Une référence disponible ne valide ni les clauses ni les faits déclarés.</p>
  {#if !workspace.documents.length && !draft}<div class="empty"><span class="icon-tile"><Icon name="documents" size={30} /></span><h3>Un dossier qui garde ses sources.</h3><p>Pour votre première activité, recherchez la notice remise aux personnes, le contrat du prestataire ou la procédure utilisée. Ajoutez leur titre, leur emplacement et le périmètre qu’ils couvrent.</p></div>{/if}
  <DocumentOrganization />
  <ul class="records">{#each workspace.documents as doc}<li><span class="record-icon"><Icon name="documents" /></span><div class="grow"><strong>{doc.title}</strong>{#if doc.documentCode}<span class="document-code">{doc.documentCode}</span>{/if}<p>{categories[doc.category]} · {doc.scope} · {doc.status === "reviewed" && doc.reviewedRevision === workspace.revision && (!doc.reviewDue || doc.reviewDue > new Date().toISOString().slice(0, 10)) ? "Revue déclarée" : "À réexaminer / déclaré"}</p></div><button class="secondary" disabled={busy} onclick={() => onLeave(()=>edit(doc))}>Examiner {doc.title}</button><button class="secondary" disabled={busy||!doc.version.trim()} onclick={()=>onLeave(()=>{draft=null;linkDocumentId=doc.id;})}>Citer {doc.title}</button></li>{/each}</ul>
  {#if linkDocumentId}<EvidenceLinker bind:this={linker} {workspace} documentId={linkDocumentId} {busy} onSave={async next=>{const saved=await onSave(next);if(saved)linkDocumentId="";return saved;}} onClose={()=>onLeave(()=>linkDocumentId='')}/>{/if}
  {#if draft}<form class="subpanel" onsubmit={(e) => { e.preventDefault(); void save(); }}><fieldset disabled={busy}>
    <h3 class="reference-editor-title" data-draft-heading bind:this={referenceHeading} tabindex="-1">Référence documentaire</h3><div class="grid-two"><label class="field">Titre interne<input required maxlength="160" bind:value={draft.title} /></label><label class="field">Catégorie<select aria-label="Catégorie" disabled={draft.contractReview !== null} bind:value={draft.category}>{#each Object.entries(categories) as [value, label]}<option {value}>{label}</option>{/each}</select></label></div>
    <div class="grid-two"><label class="field">Périmètre de la référence<input required maxlength="160" bind:value={draft.scope} /></label><label class="field">Version déclarée<input maxlength="160" bind:value={draft.version} /></label></div>
    <div class="grid-two"><label class="field">Auteur déclaré<input maxlength="160" bind:value={draft.declaredAuthor} /></label><label class="field">Sensibilité interne<select aria-label="Sensibilité interne" bind:value={draft.sensitivity}><option value="internal">Interne</option><option value="restricted">Restreinte</option></select></label></div>
    <label class="field">Localisation / référence interne<textarea aria-label="Localisation / référence interne" aria-describedby="document-location-hint" maxlength="4000" bind:value={draft.internalRef}></textarea><small id="document-location-hint">Indiquez où retrouver le document dans votre organisation. Cette information restera interne ; aucun lien ne sera ouvert automatiquement.</small></label>
    {#key draft.id}<DocumentFiling bind:draft documents={workspace.documents} onReuse={doc=>onLeave(()=>edit(doc))} />{/key}
    <fieldset class="choices"><legend>Activités couvertes</legend>{#each workspace.activities as a}<label><input type="checkbox" checked={draft.activityIds.includes(a.id)} onchange={(e) => toggle("activityIds", a.id, e.currentTarget.checked)} />{a.title}</label>{/each}</fieldset>
    {#if draft.category === "notice"}<fieldset class="choices"><legend>Finalités couvertes</legend>{#each workspace.activities.filter((a) => draft!.activityIds.includes(a.id)) as a}{#if a.role === "controller"}{#each a.purposes as p, i}<label><input type="checkbox" checked={draft.purposeIds.includes(p.id)} onchange={(e) => toggle("purposeIds", p.id, e.currentTarget.checked)} />{a.title} · finalité {i + 1}</label>{/each}{/if}{/each}</fieldset><div class="grid-two"><label class="field">Public concerné<input maxlength="160" bind:value={draft.audience} /></label><label class="field">Canal d’information<input maxlength="160" bind:value={draft.channel} /></label></div><KnowledgeField label="Disponibilité déclarée de la notice" bind:value={draft.availability} hint="La disponibilité n’est pas une preuve de remise. Aucune URL n’est appelée." />{/if}
    <fieldset class="choices"><legend>Intervenants concernés</legend>{#each workspace.parties as p}<label><input type="checkbox" checked={draft.partyIds.includes(p.id)} onchange={(e) => toggle("partyIds", p.id, e.currentTarget.checked)} />{p.name}</label>{/each}</fieldset>
    {#if draft.category === "contract"}<section class="contract-workbench"><p class="eyebrow">Sous-traitance · article 28</p><h3>Un contrat référencé n’est pas un contrat examiné.</h3><p>Pour une prestation relevant de la sous-traitance, retrouvez les clauses et vérifiez les garanties avec des éléments concrets. Cette trame accompagne votre examen ; elle ne qualifie pas automatiquement le rôle du prestataire.</p>
      {#if draft.contractReview}<ReviewNotebook documents={[draft]} bind:notes={draft.contractReview.notes} questions={CONTRACT_METHOD} prefix="Contrat" /><p class="help">La catégorie est conservée avec cette revue contractuelle. Enregistrez la référence pour conserver les notes.</p>{:else}<button type="button" class="secondary" onclick={() => { if (draft) draft.contractReview = createContractReview(); }}>Commencer la revue article 28<Icon name="arrow" /></button>{/if}
    </section>{/if}
    {#if evidenceUses(workspace,draft.id).length}<aside class="inventory-context"><strong>Cette référence soutient ces questions</strong><ul>{#each evidenceUses(workspace,draft.id) as use}<li>{use.subject} · question {use.question} · version citée {use.version || "non précisée"}</li>{/each}</ul><p class="help">Une nouvelle version sera signalée dans ces citations. Les anciennes revues resteront intactes. Pour retirer un lien d’activité, retirez d’abord les citations actuelles qui en dépendent.</p></aside>{/if}
    <label class="field">Réserves internes<textarea maxlength="4000" bind:value={draft.reservations}></textarea></label>
    <label class="field">Référence publique proposée (facultative)<textarea maxlength="4000" bind:value={draft.publicReference}></textarea><small>Seul ce texte peut être sélectionné dans une livraison, après examen explicite.</small></label>
    <label class="field">Prochaine revue interne<input type="date" bind:value={due} /></label>
    <label class="check"><input type="checkbox" bind:checked={reviewed} />Je déclare avoir examiné cette référence et son périmètre sur la révision actuelle. Cela ne certifie pas son contenu.</label>
    {#if fingerprintVersionPending}<p class="notice">La version déclarée a changé après le calcul. Sélectionnez le fichier correspondant dans « Classer et reconnaître cette pièce », puis conservez sa nouvelle empreinte.</p>{/if}
    <div class="actions"><button type="submit" disabled={fingerprintVersionPending}>Enregistrer la référence</button><button type="button" class="secondary" onclick={() => draft = null}>Annuler la référence</button></div>
  </fieldset></form>{/if}
</section>

<style>
  .document-code { display:inline-block; margin:.3rem .6rem; padding:.15rem .5rem; font-size:.875rem; color:#2f475b; border:1px solid #b5c7d4; border-radius:4px; background:#e7eef4; }
</style>
