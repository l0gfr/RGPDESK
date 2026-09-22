<script lang="ts">
  import { createDataFlow, type DataFlow } from "@rgpdesk/privacy-core";
  import KnowledgeField from "./KnowledgeField.svelte";
  import FlowMap from "./FlowMap.svelte";
  import Icon from "./Icon.svelte";
  let { flows = $bindable() }: { flows: DataFlow[] } = $props();
  let removal = $state("");
</script>
<div class="flow-editor">
  <div class="section-heading"><div><p class="eyebrow">Origine · opération · destination</p><h3>Suivez le parcours des données.</h3></div><button type="button" disabled={flows.length >= 20} onclick={() => flows = [...flows, createDataFlow(crypto.randomUUID())]}><Icon name="plus" />Ajouter un flux</button></div>
  <p>Un flux décrit une collecte, un accès, une transmission ou une autre opération. Ajoutez uniquement les relations que vous avez identifiées. Un outil relié à une fiche ne crée aucun flux automatiquement.</p>
  {#if !flows.length}<div class="flow-empty"><Icon name="flows" size={48} /><h3>Commencez par un mouvement concret.</h3><p>Dans un exemple fictif : un candidat transmet son CV à l’équipe de recrutement par un formulaire. Documentez ensuite les accès à ce CV et les transmissions, s’ils existent dans votre organisation.</p></div>{/if}
  {#each flows as flow, index (flow.id)}
    <details class="analysis-question" open><summary><span class="question-index">{String(index + 1).padStart(2, "0")}</span><span>Décrire le flux {index + 1}</span><Icon name="plus" size={18} /></summary><div class="analysis-question-body">
      <div class="grid-two"><KnowledgeField label={`Flux ${index + 1} · Origine`} bind:value={flow.source} hint="Catégorie de personnes, équipe, outil ou organisme à l’origine. Aucun nom de personne nécessaire." /><KnowledgeField label={`Flux ${index + 1} · Destination`} bind:value={flow.destination} hint="Outil, équipe ou organisme destinataire de cette opération." /></div>
      <KnowledgeField label={`Flux ${index + 1} · Opération`} bind:value={flow.operation} hint="Décrivez ce qui se passe : collecte, consultation, rapprochement, transmission, archivage, effacement…" />
      <div class="grid-two"><KnowledgeField label={`Flux ${index + 1} · Données concernées`} bind:value={flow.data} hint="Catégories utiles à cette opération, sans liste de personnes ni données individuelles." /><KnowledgeField label={`Flux ${index + 1} · Canal ou support`} bind:value={flow.channel} hint="Formulaire, interface entre outils, accès direct, fichier, support papier…" /></div>
      <KnowledgeField label={`Flux ${index + 1} · Lieux et accès à distance`} bind:value={flow.location} hint="Pays de stockage et pays depuis lesquels les données sont accessibles, s’ils sont connus. Cela ne qualifie pas automatiquement un transfert." />
      <KnowledgeField label={`Flux ${index + 1} · Accès et habilitations`} bind:value={flow.access} hint="Rôles qui peuvent consulter, modifier, extraire ou supprimer ; périmètre et modalités d’autorisation." />
      {#if removal === flow.id}<p>Retirer ce flux de la fiche en cours ? L’enregistrement sera nécessaire pour conserver ce retrait.</p><div class="actions"><button type="button" class="secondary" onclick={() => { flows = flows.filter((item) => item.id !== flow.id); removal = ""; }}>Confirmer le retrait du flux {index + 1}</button><button type="button" class="text-button" onclick={() => removal = ""}>Conserver ce flux</button></div>{:else}<button type="button" class="text-button danger" onclick={() => removal = flow.id}>Retirer le flux {index + 1}</button>{/if}
    </div></details>
  {/each}
  {#if flows.length}<h3>Votre carte, d’après ces déclarations</h3><FlowMap {flows} />{/if}
  <p class="help">20 flux maximum par activité. La carte et les notes d’analyse restent dans le coffre et sa sauvegarde chiffrée. Elles ne sont pas incluses dans les dossiers partageables actuels.</p>
</div>
