<script lang="ts">
  import { untrack } from "svelte";
  import { createPurpose, type Activity, type Workspace } from "@rgpdesk/privacy-core";
  import KnowledgeField from "./KnowledgeField.svelte";
  let { initial, workspace, busy, onSave, onCancel }: {
    initial: Activity; workspace: Workspace; busy: boolean;
    onSave: (activity: Activity) => Promise<void>; onCancel: () => void;
  } = $props();
  let draft: Activity = $state(untrack(() => structuredClone(initial)));
  function toggle(field: "systemIds" | "participantIds" | "controllerIds", id: string, checked: boolean) {
    if (field === "controllerIds") {
      if (draft.role === "processor") draft.controllerIds = checked ? [...draft.controllerIds, id] : draft.controllerIds.filter((item) => item !== id);
    } else draft[field] = checked ? [...draft[field], id] : draft[field].filter((item) => item !== id);
  }
</script>

<section class="panel" aria-labelledby="activity-editor-title">
  <div class="section-heading">
    <div><p class="eyebrow">{draft.role === "controller" ? "Registre responsable" : "Registre sous-traitant"}</p><h2 id="activity-editor-title">Fiche de traitement</h2></div>
    <span class="tag">Brouillon incomplet autorisé</span>
  </div>
  <form onsubmit={(event) => { event.preventDefault(); void onSave($state.snapshot(draft)); }}>
    <fieldset disabled={busy}>
      <div class="grid-two">
        <label class="field"><span>Nom de l’activité</span><input required maxlength="160" bind:value={draft.title} /></label>
        <label class="field"><span>État de la fiche</span><select bind:value={draft.status}><option value="draft">Brouillon</option><option value="active">Active, état déclaré</option><option value="archived">Archivée, conservée dans le coffre</option></select></label>
      </div>
      <p class="help">Le rôle est fixé à la création de cette fiche. Un organisme peut avoir des activités dans les deux registres.</p>
      {#if draft.role === "controller"}
        <h3>Finalités et conservation</h3>
        <p class="help">Les finalités et la conservation relèvent des rubriques du registre responsable. La base légale est un complément de documentation, à examiner séparément.</p>
        {#each draft.purposes as purpose, index (purpose.id)}
          <div class="subpanel">
            <h4>Finalité {index + 1}</h4>
            <KnowledgeField label={`Finalité ${index + 1}`} bind:value={purpose.description} />
            <KnowledgeField label={`Base légale documentée ${index + 1} (complément)`} bind:value={purpose.legalBasis} hint="Aucun choix automatique ; indiquez la base et sa justification." />
            <div class="grid-two">
              <KnowledgeField label={`Durée ou critère de conservation ${index + 1}`} bind:value={purpose.retention.period} />
              <KnowledgeField label={`Événement de départ ${index + 1}`} bind:value={purpose.retention.trigger} />
            </div>
          </div>
        {/each}
        {#if draft.purposes.length === 0}<p class="empty">Finalités inconnues. Vous pouvez enregistrer ce brouillon.</p>{/if}
        <button type="button" class="secondary" disabled={draft.purposes.length >= 20} onclick={() => { if (draft.role === "controller") draft.purposes = [...draft.purposes, createPurpose(crypto.randomUUID())]; }}>Ajouter une finalité</button>
      {:else}
        <h3>Opérations réalisées pour les clients responsables</h3>
        <KnowledgeField label="Catégories d’opérations" bind:value={draft.operations} />
        <KnowledgeField label="Instructions documentées (complément)" bind:value={draft.instructions} />
        <fieldset class="choices"><legend>Clients responsables identifiés</legend>
          {#each workspace.parties as party (party.id)}
            <label><input type="checkbox" checked={draft.controllerIds.includes(party.id)} onchange={(event) => toggle("controllerIds", party.id, event.currentTarget.checked)} />{party.name}</label>
          {/each}
          {#if workspace.parties.length === 0}<p class="help">Inconnus. Enregistrez le brouillon, puis ajoutez un intervenant.</p>{/if}
        </fieldset>
        <p class="help">Cette fiche ne vous demande pas de choisir une base légale pour une opération réalisée sur instruction. Vos propres finalités relèvent d’une fiche responsable distincte.</p>
      {/if}
      <h3>Personnes, données et destinataires</h3>
      <p class="help">Rubriques article 30 pour le responsable ; compléments de documentation pour le sous-traitant.</p>
      <div class="grid-two">
        <KnowledgeField label="Catégories de personnes" bind:value={draft.dataSubjects} />
        <KnowledgeField label="Catégories de données" bind:value={draft.dataCategories} />
      </div>
      <KnowledgeField label="Catégories de destinataires" bind:value={draft.recipients} />
      <h3>Transferts et mesures générales</h3>
      <KnowledgeField label="Transferts documentés" bind:value={draft.transfers} hint="Un champ vide signifie non examiné. Indiquez les pays, accès et garanties examinés, ou les raisons d’aucun transfert identifié." />
      <KnowledgeField label="Mesures techniques et organisationnelles" bind:value={draft.securityMeasures} />
      <h3>Examens documentaires (compléments)</h3>
      <div class="grid-two"><label class="field">État de l’examen des transferts<select aria-label="État de l’examen des transferts" bind:value={draft.review.transferStatus}><option value="unknown">Non examiné</option><option value="none-reviewed">Aucun transfert identifié après examen déclaré</option><option value="identified">Transfert identifié, analyse à documenter</option></select></label><label class="field">Mode de collecte déclaré<select aria-label="Mode de collecte déclaré" bind:value={draft.review.collection}><option value="unknown">Inconnu</option><option value="direct">Directe</option><option value="indirect">Indirecte</option><option value="both">Directe et indirecte</option></select></label></div>
      {#if draft.role === "controller"}<div class="grid-two"><KnowledgeField label="Examen des catégories particulières (article 9)" bind:value={draft.review.article9} hint="Documentez la condition examinée, ou la non-applicabilité motivée. Aucun classement automatique." /><KnowledgeField label="Examen des données pénales (article 10)" bind:value={draft.review.article10} hint="Examen distinct de la base légale de l’article 6." /></div>{/if}
      <fieldset class="choices"><legend>Sous-traitants déclarés de cette activité</legend>{#each workspace.parties as party}<label><input type="checkbox" checked={draft.review.subcontractorIds.includes(party.id)} onchange={(e) => draft.review.subcontractorIds = e.currentTarget.checked ? [...draft.review.subcontractorIds, party.id] : draft.review.subcontractorIds.filter((id) => id !== party.id)} />{party.name}</label>{/each}</fieldset>
      <h3>Moyens et relations (compléments)</h3>
      <div class="grid-two">
        <fieldset class="choices"><legend>Systèmes utilisés</legend>
          {#each workspace.systems as system (system.id)}<label><input type="checkbox" checked={draft.systemIds.includes(system.id)} onchange={(event) => toggle("systemIds", system.id, event.currentTarget.checked)} />{system.name}</label>{/each}
          {#if workspace.systems.length === 0}<p class="help">Aucun système documenté.</p>{/if}
        </fieldset>
        <fieldset class="choices"><legend>Autres intervenants liés</legend>
          {#each workspace.parties as party (party.id)}<label><input type="checkbox" checked={draft.participantIds.includes(party.id)} onchange={(event) => toggle("participantIds", party.id, event.currentTarget.checked)} />{party.name}</label>{/each}
          {#if workspace.parties.length === 0}<p class="help">Aucun intervenant documenté.</p>{/if}
        </fieldset>
      </div>
      <div class="field"><label for="privacy-notes">Notes internes</label><textarea id="privacy-notes" aria-describedby="privacy-notes-hint" rows="3" maxlength="4000" bind:value={draft.internalNotes}></textarea><small id="privacy-notes-hint">Évitez les données individuelles, secrets et pièces justificatives.</small></div>
      <div class="actions"><button type="submit">{busy ? "Chiffrement en cours…" : "Enregistrer la fiche"}</button><button type="button" class="secondary" onclick={onCancel}>Annuler l’édition</button></div>
    </fieldset>
  </form>
</section>
