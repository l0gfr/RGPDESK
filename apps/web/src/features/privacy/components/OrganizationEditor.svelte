<script lang="ts">
  import { untrack } from "svelte";
  import type { Workspace } from "@rgpdesk/privacy-core";
  import KnowledgeField from "./KnowledgeField.svelte";
  let { workspace, busy, onSave }: { workspace: Workspace; busy: boolean; onSave: (changes: Pick<Workspace, "organization" | "scope" | "jurisdiction">) => Promise<void> } = $props();
  let draft = $state(untrack(() => structuredClone({ organization: workspace.organization, scope: workspace.scope, jurisdiction: workspace.jurisdiction })));
</script>
<section class="panel"><h2>Organisation et périmètre</h2>
  <form onsubmit={(event) => { event.preventDefault(); void onSave($state.snapshot(draft)); }}><fieldset disabled={busy}>
    <label class="field"><span>Nom de l’organisme</span><input required maxlength="160" bind:value={draft.organization.name} /></label>
    <KnowledgeField label="Coordonnées de l’organisme et représentant, le cas échéant" bind:value={draft.organization.contact} />
    <KnowledgeField label="Représentant et responsables conjoints (ou non-applicabilité motivée)" bind:value={draft.organization.representatives} />
    <KnowledgeField label="DPO, le cas échéant" bind:value={draft.organization.dpo} hint="Une inconnue ne vaut pas exemption." />
    <KnowledgeField label="Périmètre de la mission" bind:value={draft.scope} />
    <KnowledgeField label="Juridiction et régimes à examiner" bind:value={draft.jurisdiction} hint="Interface de travail France/UE ; aucun examen automatique du champ territorial ou sectoriel." />
    <button type="submit">Enregistrer l’organisation</button>
  </fieldset></form>
</section>
