<script lang="ts">
  import { dataGroupRows, type Activity, type Workspace } from "@rgpdesk/privacy-core";
  import Icon from "./Icon.svelte";
  let { activity, inventory }: { activity: Activity; inventory: Pick<Workspace,"parties"|"systems"> } = $props();
  let groups = $derived(dataGroupRows(activity, inventory));
</script>
{#if groups.length}<section class="data-groups" aria-label="Tableaux de l’inventaire"><header class="section-heading"><div><p class="eyebrow">Les faits saisis une fois</p><h3>Des sous-finalités aux garanties.</h3></div><Icon name="flows" size={30}/></header><p class="help">Les faits et les examens de minimisation viennent du registre. Ces tableaux décrivent votre travail ; ils ne concluent pas à sa conformité.</p>{#each groups as group}<details class="data-group-card"><summary><span class="data-group-code">{group.group}</span><strong>{group.rows[0]?.value}</strong><Icon name="plus" size={18}/></summary><dl class="group-facts">{#each group.rows as row}<div><dt>{row.label}</dt><dd>{row.value}</dd></div>{/each}</dl></details>{/each}</section>{/if}
