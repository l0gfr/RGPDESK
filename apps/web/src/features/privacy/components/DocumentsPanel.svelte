<script lang="ts">
  import { unknown, putDocument, type EvidenceReference, type Workspace } from "@rgpdesk/privacy-core";
  import KnowledgeField from "./KnowledgeField.svelte";
  import Icon from "./Icon.svelte";
  let { workspace, busy, onSave }: { workspace: Workspace; busy: boolean; onSave: (next: Workspace) => Promise<void> } = $props();
  let draft = $state<EvidenceReference | null>(null); let reviewed = $state(false); let due = $state("");
  const categories = { contract: "Contrat / acte", notice: "Notice d’information", policy: "Politique", analysis: "Analyse", other: "Autre" };
  function create() { draft = { id: crypto.randomUUID(), workspaceId: workspace.id, title: "", category: "contract", activityIds: [], purposeIds: [], partyIds: [], scope: "", version: "", declaredAuthor: "", internalRef: "", publicReference: "", reservations: "", sensitivity: "internal", status: "declared", reviewedRevision: null, reviewedAt: null, reviewDue: null, audience: "", channel: "", availability: unknown() }; reviewed = false; due = ""; }
  function edit(doc: EvidenceReference) { draft = structuredClone($state.snapshot(doc)); reviewed = false; due = doc.reviewDue ?? ""; }
  function toggle(field: "activityIds" | "purposeIds" | "partyIds", id: string, checked: boolean) {
    if (!draft) return; draft[field] = checked ? [...draft[field], id] : draft[field].filter((v) => v !== id);
    if (field === "activityIds") { const allowed = new Set(workspace.activities.filter((a) => draft!.activityIds.includes(a.id)).flatMap((a) => a.role === "controller" ? a.purposes.map((p) => p.id) : [])); draft.purposeIds = draft.purposeIds.filter((id) => allowed.has(id)); }
  }
  async function save() {
    if (!draft) return; const now = new Date().toISOString();
    await onSave(putDocument(workspace, { ...$state.snapshot(draft), reviewDue: due || null, status: reviewed ? "reviewed" : "declared", reviewedAt: reviewed ? now : null, reviewedRevision: reviewed ? workspace.revision + 1 : null }, now));
  }
</script>
<section class="panel">
  <div class="section-heading"><div><p class="eyebrow">Bibliothèque de références</p><h2>Les documents, à leur place.</h2></div><button disabled={busy} onclick={create}><Icon name="plus" />Ajouter une référence</button></div>
  <p class="help">Rattachez un contrat, une notice ou une analyse. Le coffre conserve sa référence, jamais le fichier. Une référence disponible ne valide ni les clauses ni les faits déclarés.</p>
  {#if !workspace.documents.length && !draft}<div class="empty"><span class="icon-tile"><Icon name="documents" size={30} /></span><h3>Un dossier qui garde ses sources.</h3><p>Pour votre première activité, recherchez la notice remise aux personnes, le contrat du prestataire ou la procédure utilisée. Ajoutez leur titre, leur emplacement et le périmètre qu’ils couvrent.</p></div>{/if}
  <ul class="records">{#each workspace.documents as doc}<li><span class="record-icon"><Icon name="documents" /></span><div class="grow"><strong>{doc.title}</strong><p>{categories[doc.category]} · {doc.scope} · {doc.status === "reviewed" && doc.reviewedRevision === workspace.revision && (!doc.reviewDue || doc.reviewDue > new Date().toISOString().slice(0, 10)) ? "Revue déclarée" : "À réexaminer / déclaré"}</p></div><button class="secondary" disabled={busy} onclick={() => edit(doc)}>Examiner {doc.title}</button></li>{/each}</ul>
  {#if draft}<form class="subpanel" onsubmit={(e) => { e.preventDefault(); void save(); }}><fieldset disabled={busy}>
    <h3>Référence documentaire</h3><div class="grid-two"><label class="field">Titre interne<input required maxlength="160" bind:value={draft.title} /></label><label class="field">Catégorie<select aria-label="Catégorie" bind:value={draft.category}>{#each Object.entries(categories) as [value, label]}<option {value}>{label}</option>{/each}</select></label></div>
    <div class="grid-two"><label class="field">Périmètre de la référence<input required maxlength="160" bind:value={draft.scope} /></label><label class="field">Version déclarée<input maxlength="160" bind:value={draft.version} /></label></div>
    <div class="grid-two"><label class="field">Auteur déclaré<input maxlength="160" bind:value={draft.declaredAuthor} /></label><label class="field">Sensibilité interne<select aria-label="Sensibilité interne" bind:value={draft.sensitivity}><option value="internal">Interne</option><option value="restricted">Restreinte</option></select></label></div>
    <label class="field">Localisation / référence interne<textarea maxlength="4000" bind:value={draft.internalRef}></textarea><small>Indiquez où retrouver le document dans votre organisation. Cette information restera interne ; aucun lien ne sera ouvert automatiquement.</small></label>
    <fieldset class="choices"><legend>Activités couvertes</legend>{#each workspace.activities as a}<label><input type="checkbox" checked={draft.activityIds.includes(a.id)} onchange={(e) => toggle("activityIds", a.id, e.currentTarget.checked)} />{a.title}</label>{/each}</fieldset>
    {#if draft.category === "notice"}<fieldset class="choices"><legend>Finalités couvertes</legend>{#each workspace.activities.filter((a) => draft!.activityIds.includes(a.id)) as a}{#if a.role === "controller"}{#each a.purposes as p, i}<label><input type="checkbox" checked={draft.purposeIds.includes(p.id)} onchange={(e) => toggle("purposeIds", p.id, e.currentTarget.checked)} />{a.title} · finalité {i + 1}</label>{/each}{/if}{/each}</fieldset><div class="grid-two"><label class="field">Public concerné<input maxlength="160" bind:value={draft.audience} /></label><label class="field">Canal d’information<input maxlength="160" bind:value={draft.channel} /></label></div><KnowledgeField label="Disponibilité déclarée de la notice" bind:value={draft.availability} hint="La disponibilité n’est pas une preuve de remise. Aucune URL n’est appelée." />{/if}
    <fieldset class="choices"><legend>Intervenants concernés</legend>{#each workspace.parties as p}<label><input type="checkbox" checked={draft.partyIds.includes(p.id)} onchange={(e) => toggle("partyIds", p.id, e.currentTarget.checked)} />{p.name}</label>{/each}</fieldset>
    <label class="field">Réserves internes<textarea maxlength="4000" bind:value={draft.reservations}></textarea></label>
    <label class="field">Référence publique proposée (facultative)<textarea maxlength="4000" bind:value={draft.publicReference}></textarea><small>Seul ce texte peut être sélectionné dans une livraison, après examen explicite.</small></label>
    <label class="field">Prochaine revue interne<input type="date" bind:value={due} /></label>
    <label class="check"><input type="checkbox" bind:checked={reviewed} />Je déclare avoir examiné cette référence et son périmètre sur la révision actuelle. Cela ne certifie pas son contenu.</label>
    <div class="actions"><button type="submit">Enregistrer la référence</button><button type="button" class="secondary" onclick={() => draft = null}>Annuler la référence</button></div>
  </fieldset></form>{/if}
</section>
