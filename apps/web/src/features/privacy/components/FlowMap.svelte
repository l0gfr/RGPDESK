<script lang="ts">
  import { knowledgeText, type Activity, type Workspace, type DataFlow } from "@rgpdesk/privacy-core";
  import JourneyMap from "./JourneyMap.svelte";
  import Icon from "./Icon.svelte";
  let { flows, onEdit, activity, inventory }: { flows: DataFlow[]; onEdit?: (id: string) => void; activity?:Activity; inventory?:Pick<Workspace,"parties"|"systems"> } = $props();
</script>
<ol class="flow-map" aria-label="Carte des flux déclarés">
  {#each flows as flow, index (flow.id)}
    {@const original=activity?.flows.find(f=>f.id===flow.id)}
    <li class="flow-route">
      <div class="flow-route-bar"><span>{original?.journey ? `PARCOURS ${original.journey.reference}` : `FLUX ${String(index + 1).padStart(2, "0")}`}</span>{#if onEdit}<button type="button" class="text-button" onclick={() => onEdit?.(flow.id)}>Modifier {original?.journey ? `le parcours ${original.journey.reference}` : `le flux ${index + 1}`}</button>{:else}<span>Déclaration de votre organisation</span>{/if}</div>
      {#if original?.journey && activity && inventory}<JourneyMap {activity} flow={original} {inventory}/>{:else}
      <div class="flow-route-nodes">
        <div class="flow-endpoint"><span class="flow-node-icon"><Icon name="systems" size={25} /></span><small>ORIGINE</small><strong>{knowledgeText(flow.source) || "Origine à préciser"}</strong></div>
        <div class="flow-operation"><span class="flow-line" aria-hidden="true"></span><Icon name="arrow" size={25} /><p>{knowledgeText(flow.operation) || "Opération à préciser"}</p></div>
        <div class="flow-endpoint flow-destination"><span class="flow-node-icon"><Icon name="parties" size={25} /></span><small>DESTINATION</small><strong>{knowledgeText(flow.destination) || "Destination à préciser"}</strong></div>
      </div>
      <dl class="flow-facts"><div><dt>Données</dt><dd>{knowledgeText(flow.data) || "À examiner"}</dd></div><div><dt>Canal / support</dt><dd>{knowledgeText(flow.channel) || "À examiner"}</dd></div><div><dt>Lieux et accès à distance</dt><dd>{knowledgeText(flow.location) || "À examiner"}</dd></div><div><dt>Qui peut accéder, pour faire quoi</dt><dd>{knowledgeText(flow.access) || "À examiner"}</dd></div></dl>
      {/if}
    </li>
  {/each}
</ol>
