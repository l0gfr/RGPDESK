<script lang="ts">
  import { unknown, type Party, type System, type Workspace } from "@rgpdesk/privacy-core";
  import KnowledgeField from "./KnowledgeField.svelte";
  let { workspace, busy, kind, onSaveParty, onSaveSystem }: {
    workspace: Workspace; busy: boolean; kind: "parties" | "systems";
    onSaveParty: (party: Party) => Promise<void>; onSaveSystem: (system: System) => Promise<void>;
  } = $props();
  let party: Party | null = $state(null);
  let system: System | null = $state(null);
  function newEntity() {
    const base = { id: crypto.randomUUID(), workspaceId: workspace.id, name: "" };
    if (kind === "parties") party = { ...base, contact: unknown() };
    else system = { ...base, description: unknown() };
  }
</script>
<section class="panel">
  <h2>{kind === "parties" ? "Intervenants" : "Systèmes"}</h2>
  <p class="help">{kind === "parties" ? "Recensez les organismes avec lesquels vous travaillez : client, prestataire, partenaire. Vous préciserez leur rôle en les reliant à chaque fiche." : "Listez les outils, applications et supports utilisés par les équipes. Vous pourrez ensuite les relier aux activités du registre."}</p>
  <aside class="interview-card"><strong>{kind === "parties" ? "La question à poser" : "À demander à l’équipe"}</strong><p>{kind === "parties" ? "À quels organismes transmettez-vous des données, et qui intervient pour vous ? Retrouvez un contact professionnel et le contrat ou document qui décrit cette relation." : "Dans quels outils les informations sont-elles saisies, consultées ou conservées ? Pensez aussi aux tableurs, aux messageries et aux archives papier."}</p><p class="help">Après l’ajout, ouvrez la fiche concernée et sélectionnez ces liens dans Les précisions.</p></aside>
  <ul class="records">{#each workspace[kind] as item (item.id)}<li><span>{item.name}</span><button class="secondary" disabled={busy} onclick={() => { if (kind === "parties") party = structuredClone(item as Party); else system = structuredClone(item as System); }}>Modifier {item.name}</button></li>{/each}</ul>
  <button class="secondary" disabled={busy} onclick={newEntity}>{kind === "parties" ? "Ajouter un intervenant" : "Ajouter un système"}</button>
  {#if party}
    <form class="subpanel" onsubmit={(event) => { event.preventDefault(); if (party) void onSaveParty($state.snapshot(party)); }}><fieldset disabled={busy}>
      <label class="field"><span>Nom de l’intervenant</span><input required maxlength="160" bind:value={party.name} /></label>
      <KnowledgeField label="Coordonnées utiles" bind:value={party.contact} />
      <button type="submit">Enregistrer l’intervenant</button>
    </fieldset></form>
  {:else if system}
    <form class="subpanel" onsubmit={(event) => { event.preventDefault(); if (system) void onSaveSystem($state.snapshot(system)); }}><fieldset disabled={busy}>
      <label class="field"><span>Nom du système</span><input required maxlength="160" bind:value={system.name} /></label>
      <KnowledgeField label="Description du système" bind:value={system.description} />
      <button type="submit">Enregistrer le système</button>
    </fieldset></form>
  {/if}
</section>
