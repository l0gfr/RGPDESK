<script lang="ts">
  import type { Activity } from "@rgpdesk/privacy-core";
  import { startingPoints, type StartingPoint } from "../guidance";
  import Icon from "./Icon.svelte";
  import InterviewPlaybook from "./InterviewPlaybook.svelte";
  let { busy, onStart }: { busy: boolean; onStart: (role: Activity["role"], example?: StartingPoint) => void } = $props();
  import { normalizeSearch } from "../search";
  let filter = $state("");
  let visible = $derived(startingPoints.filter((entry) => normalizeSearch(`${entry.title} ${entry.team} ${entry.prompt}`).includes(normalizeSearch(filter.slice(0, 160)))));
  let selected: StartingPoint | null = $state(null);
</script>

<section class="panel activity-starter" aria-labelledby="starter-title">
  <p class="eyebrow">Un point de départ pour votre entretien</p>
  <h2 id="starter-title">Quelle activité souhaitez-vous décrire ?</h2>
  <p>Partez d’une activité que vous connaissez. Ces trames vous aident à préparer les questions ; vous remplirez la fiche avec les réponses de votre organisation.</p>
  <label class="field catalogue-filter">Trouver une activité<input type="search" bind:value={filter} maxlength="160" autocomplete="off" placeholder="RH, fournisseurs, sécurité…" /></label>
  <p class="help" role="status">{visible.length} trame(s) disponible(s). Vous pouvez aussi partir d’une fiche libre.</p>
  <div class="starter-grid" role="group" aria-label="Points de départ métier">
    {#each visible as example}
      <button class="starter-card secondary" class:selected={selected?.id === example.id} aria-pressed={selected?.id === example.id} disabled={busy} onclick={() => selected = example}><Icon name={example.icon} size={22} /><span>{example.title}</span></button>
    {/each}
  </div>
  {#if selected}
    <div class="interview-card"><h3>{selected.question}</h3><InterviewPlaybook example={selected} /></div>
  {/if}
  <div class="role-choice"><h3>Quel est le rôle de votre organisme pour cette activité ?</h3><p>Le rôle peut changer d’une activité à l’autre. Choisissez-le après examen ; il détermine les rubriques de la fiche.</p>
    <div class="grid-two">
      <div><h4>Vous déterminez pourquoi et comment les données sont traitées</h4><p>Votre organisme agit comme responsable de traitement, seul ou avec d’autres.</p><button disabled={busy} onclick={() => onStart("controller", selected ?? undefined)}>Créer une fiche responsable</button></div>
      <div><h4>Vous traitez les données pour le compte d’un client</h4><p>Votre organisme agit comme sous-traitant dans le cadre des instructions du responsable.</p><button class="secondary" disabled={busy} onclick={() => onStart("processor", selected ?? undefined)}>Créer une fiche sous-traitante</button></div>
    </div>
    <details><summary>J’hésite sur le rôle</summary><p>Reprenez les décisions prises dans la pratique et les engagements contractuels avec l’interlocuteur concerné. Ne choisissez pas un rôle à partir du seul intitulé d’un logiciel ou d’un fournisseur. Vous pouvez poursuivre le cadrage dans Organisation avant de créer la fiche.</p><a href="https://www.cnil.fr/fr/reglement-europeen-protection-donnees/chapitre1" target="_blank" rel="noopener noreferrer">Comprendre les définitions de l’article 4</a></details>
  </div>
</section>
