<script lang="ts">
  import { journeySteps, journeyPurposeText, type Activity, type DataFlow, type Workspace } from "@rgpdesk/privacy-core";
  import Icon from "./Icon.svelte";
  let {activity,flow,inventory}:{activity:Activity;flow:DataFlow;inventory:Pick<Workspace,"parties"|"systems">}=$props();
  let steps=$derived(journeySteps(activity,flow,inventory));
</script>
<section class="journey-map" aria-label={`Parcours ${flow.journey?.reference}`}>
 <header><span class="journey-reference">{flow.journey?.reference}</span><div><strong>{(activity.dataGroups??[]).filter(g=>flow.dataGroupIds?.includes(g.id)).map(g=>`D${g.code}`).join(" · ")}</strong><p>{journeyPurposeText(activity,flow)}</p></div></header>
 <ol>{#each steps as s,i}<li><span class="journey-number">{i+1}</span><div><h4>{s.operation}</h4>{#if s.when}<p class="journey-when"><Icon name="clock" size={17}/>{s.when}</p>{/if}<p class="journey-support-tag"><Icon name="systems" size={18}/>{s.supports}</p><p><Icon name="parties" size={18}/>{s.access}</p><p class="journey-direction"><span>{s.source}</span><Icon name="arrow" size={20}/><span>{s.destination}</span></p><p>Canal : {s.channel}</p><details><summary>Lieux de stockage</summary><p>{s.location}</p></details></div></li>{/each}</ol>
</section>
