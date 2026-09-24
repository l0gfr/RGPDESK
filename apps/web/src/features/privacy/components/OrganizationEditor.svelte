<script lang="ts">
  import type { RecoveryForm } from "../persistence/recovery";
  import { untrack } from "svelte";
  import type { Workspace } from "@rgpdesk/privacy-core";
  import KnowledgeField from "./KnowledgeField.svelte";
  let { workspace, busy, onSave }: { workspace: Workspace; busy: boolean; onSave: (changes: Pick<Workspace, "organization" | "scope" | "jurisdiction">) => Promise<void> } = $props();
  let draft = $state(untrack(() => structuredClone({ organization: workspace.organization, scope: workspace.scope, jurisdiction: workspace.jurisdiction })));
  export function hasUnsavedChanges(){return JSON.stringify(draft)!==JSON.stringify({organization:workspace.organization,scope:workspace.scope,jurisdiction:workspace.jurisdiction});}
  export function getRecovery():RecoveryForm|null{return hasUnsavedChanges()?{kind:'organization',draft:$state.snapshot(draft)}:null;}
  export function restoreRecovery(f:RecoveryForm){if(f.kind==='organization')draft=structuredClone(f.draft);}
</script>
<section class="panel"><p class="eyebrow">Poser le cadre</p><h2>Organisation et périmètre</h2><p>Commencez par préciser pour qui vous travaillez et ce que couvre la mission. Ces informations serviront de contexte à toutes vos fiches.</p><aside class="interview-card"><strong>À préparer avec votre interlocuteur</strong><p>L’entité concernée, un contact de référence, les services accompagnés et les éventuelles limites de la mission. Un groupe ou un client peut demander plusieurs espaces distincts.</p></aside>
  <form onsubmit={(event) => { event.preventDefault(); void onSave($state.snapshot(draft)); }}><fieldset disabled={busy}>
    <label class="field"><span>Nom de l’organisme</span><input required maxlength="160" bind:value={draft.organization.name} /></label>
    <KnowledgeField label="Coordonnées de l’organisme et représentant, le cas échéant" bind:value={draft.organization.contact} />
    <KnowledgeField label="Représentant et responsables conjoints (ou non-applicabilité motivée)" bind:value={draft.organization.representatives} />
    <KnowledgeField label="DPO, le cas échéant" bind:value={draft.organization.dpo} hint="Renseignez les coordonnées de contact du DPO s’il est désigné, ou notez ce qui reste à examiner." />
    <KnowledgeField label="Périmètre de la mission" bind:value={draft.scope} hint="Quelles entités, équipes, activités et implantations sont incluses ? Notez aussi ce qui reste hors de votre mission." />
    <KnowledgeField label="Juridiction et régimes à examiner" bind:value={draft.jurisdiction} hint="Interface de travail France/UE ; aucun examen automatique du champ territorial ou sectoriel." />
    <button type="submit">Enregistrer l’organisation</button>
  </fieldset></form>
</section>
