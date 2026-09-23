<script lang="ts">
  import { knowledgeText, type Activity } from "@rgpdesk/privacy-core";
  let { activities }: { activities: Activity[] } = $props();
</script>
<details class="inventory-context"><summary>Les faits déjà décrits · {activities.length} activité(s) liée(s)</summary>
  <p class="help">Ces faits viennent de votre inventaire. Complétez ici seulement ce qui est propre à l’analyse ; corrigez un fait commun dans la fiche du registre.</p>
  {#each activities as a}<article><h4>{a.title}</h4><dl class="analysis-summary"><div><dt>Personnes</dt><dd>{knowledgeText(a.dataSubjects) || "À documenter"}</dd></div><div><dt>Données</dt><dd>{knowledgeText(a.dataCategories) || "À documenter"}</dd></div><div><dt>Opérations</dt><dd>{knowledgeText(a.analysis.operations) || (a.role === "processor" ? knowledgeText(a.operations) : "") || "À documenter"}</dd></div><div><dt>Accès</dt><dd>{knowledgeText(a.analysis.access) || "À documenter"}</dd></div></dl></article>{/each}
</details>
