<script lang="ts">
  import { knowledgeText, type Activity, type Workspace } from "@rgpdesk/privacy-core";
  import { hasNotes } from "../review-methods";
  import FlowMap from "./FlowMap.svelte";
  import Icon from "./Icon.svelte";
  let { workspace, mode, busy, onEdit, onRegister }: { workspace: Workspace; mode: "analysis" | "flows"; busy: boolean; onEdit: (activity: Activity, section: "analysis" | "flows") => void; onRegister: () => void } = $props();
  let selected = $state("");
  let activity = $derived(workspace.activities.find((item) => item.id === selected) ?? workspace.activities[0]);
</script>
<section class="panel analysis-overview">
  <div class="section-heading"><div><p class="eyebrow">{mode === "flows" ? "Voir les usages réels" : "Argumenter vos choix"}</p><h2>{mode === "flows" ? "Les données ont un parcours." : "Une appréciation se construit."}</h2></div><span class="icon-tile"><Icon name={mode} size={34} /></span></div>
  <p>{mode === "flows" ? "Pour chaque activité, décrivez d’où viennent les données, ce qui leur arrive et qui y accède. Cette carte représente uniquement les flux que vous avez saisis." : "Rassemblez les faits, confrontez les arguments et documentez vos appréciations. La grille distingue les preuves des hypothèses et les garanties prévues des mesures appliquées."}</p>
  {#if activity}
    <label class="field">Activité à examiner<select aria-label="Activité à examiner" value={activity.id} onchange={(event) => selected = event.currentTarget.value}>{#each workspace.activities as item}<option value={item.id}>{item.title}</option>{/each}</select></label>
    <div class="analysis-context"><div><span class="eyebrow">{activity.role === "controller" ? "Responsable de traitement" : "Sous-traitant"}</span><h3>{activity.title}</h3><p>{mode === "flows" ? `${activity.flows.length} flux déclaré(s)` : `${activity.analysis.notes.filter(hasNotes).length} question(s) avec des notes de travail`}</p></div><button disabled={busy} onclick={() => onEdit(activity!, mode)}>{mode === "flows" ? "Compléter la cartographie" : "Travailler l’analyse"}<Icon name="arrow" /></button></div>
    {#if mode === "flows"}
      {#if activity.flows.length}<FlowMap flows={activity.flows} />{:else}<div class="flow-empty"><Icon name="flows" size={54} /><h3>Les flux de cette activité restent à décrire.</h3><p>Le lien avec un prestataire ou un logiciel ne renseigne pas, à lui seul, la circulation des données.</p></div>{/if}
    {:else}
      <dl class="analysis-summary"><div><dt>Opérations détaillées</dt><dd>{knowledgeText(activity.analysis.operations) || "À documenter"}</dd></div><div><dt>Accès et habilitations</dt><dd>{knowledgeText(activity.analysis.access) || "À documenter"}</dd></div></dl>
      <aside class="method-boundary"><strong>Cette grille contribue à l’analyse. Elle ne constitue pas, seule, une AIPD.</strong><p>Une AIPD comprend aussi l’évaluation des risques, les mesures pour y faire face et les autres éléments exigés par l’article 35. L’appréciation reste humaine, sans note ni conclusion automatique.</p><a href="https://www.cnil.fr/fr/reglement-europeen-protection-donnees/chapitre4" target="_blank" rel="noopener noreferrer">RGPD, article 35</a></aside>
    {/if}
  {:else}<div class="flow-empty"><Icon name={mode} size={54} /><h3>Choisissez d’abord une activité.</h3><p>L’analyse et les flux seront conservés dans sa fiche, avec le reste de votre travail.</p><button disabled={busy} onclick={onRegister}>Ouvrir le registre<Icon name="arrow" /></button></div>{/if}
</section>
