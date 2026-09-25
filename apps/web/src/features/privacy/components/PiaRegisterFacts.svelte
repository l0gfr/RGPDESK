<script lang="ts">
  import { knowledgeText, purposeRetention, type Activity, type PiaContext } from "@rgpdesk/privacy-core";
  import DataGroupsTable from "./DataGroupsTable.svelte";
  import Icon from "./Icon.svelte";
  let { activity, inventory }: { activity: Activity; inventory: PiaContext } = $props();
</script>
<section class="pia-register-facts" aria-label="Faits du registre pour les principes fondamentaux">
  <header><Icon name="register" size={28}/><div><p class="eyebrow">Principes fondamentaux · base factuelle</p><h4>Déjà décrit dans votre registre.</h4></div></header>
  <p>Les sous-finalités, données, destinataires, supports et durées sont repris de l’inventaire. Les justifications et garanties déjà saisies restent consultables. Complétez seulement l’analyse : ces déclarations ne valent pas validation de conformité.</p>
  <details><summary>Finalités, fondements et conservation</summary>
    {#if activity.role === "controller"}{#each activity.purposes as purpose,index}<article><h5>Sous-finalité {index+1}</h5><dl class="analysis-summary"><div><dt>Finalité déclarée</dt><dd>{knowledgeText(purpose.description)||"À documenter dans le registre"}</dd></div><div><dt>Fondement déclaré</dt><dd>{knowledgeText(purpose.legalBasis)||"À documenter dans le registre"}</dd></div><div><dt>Durée ou critère</dt><dd>{knowledgeText(purposeRetention(activity,purpose).period)||"À documenter dans le registre"}</dd></div><div><dt>Événement de départ</dt><dd>{knowledgeText(purposeRetention(activity,purpose).trigger)||"À documenter dans le registre"}</dd></div></dl></article>{/each}
    {:else}<dl class="analysis-summary"><div><dt>Opérations confiées</dt><dd>{knowledgeText(activity.operations)||"À documenter dans le registre"}</dd></div><div><dt>Instructions du responsable</dt><dd>{knowledgeText(activity.instructions)||"À documenter dans le registre"}</dd></div></dl>{/if}
  </details>
  <DataGroupsTable {activity} {inventory}/>
  <p class="help">Corrigez un fait commun dans la fiche du registre. Les décisions historiques conservent le contexte de leur date. Organisation inspirée des <a href="https://www.cnil.fr/sites/default/files/atoms/files/cnil-pia-2-fr-modeles.pdf#page=5" target="_blank" rel="noopener noreferrer">modèles CNIL, février 2018, contexte et principes fondamentaux</a> ; aucun export au format du logiciel CNIL n’est revendiqué.</p>
</section>
<style>
  .pia-register-facts { border:1px solid #b9cbd8; background:linear-gradient(120deg,#f4f7f8,#e6eef4); padding:clamp(1rem,3vw,1.75rem); margin:1rem 0 1.5rem; border-radius:6px 22px 6px 6px; }
  header { display:flex; align-items:center; gap:1rem; }
  header h4 { margin:.4rem 0; font-size:1.3rem; }
  header p { margin:0; }
  summary { cursor:pointer; padding:1rem 0; }
  dd { white-space:pre-wrap; overflow-wrap:anywhere; }
</style>
