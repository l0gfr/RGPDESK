<script lang="ts">
  import { knowledgeText, type DataFlow } from "@rgpdesk/privacy-core";
  import Icon from "./Icon.svelte";
  let { flows }: { flows: DataFlow[] } = $props();
</script>
<ol class="flow-map" aria-label="Carte des flux déclarés">
  {#each flows as flow, index (flow.id)}
    <li class="flow-route">
      <div class="flow-route-bar"><span>FLUX {String(index + 1).padStart(2, "0")}</span><span>Déclaration de votre organisation</span></div>
      <div class="flow-route-nodes">
        <div class="flow-endpoint"><span class="flow-node-icon"><Icon name="systems" size={25} /></span><small>ORIGINE</small><strong>{knowledgeText(flow.source) || "Origine à préciser"}</strong></div>
        <div class="flow-operation"><span class="flow-line" aria-hidden="true"></span><Icon name="arrow" size={25} /><p>{knowledgeText(flow.operation) || "Opération à préciser"}</p></div>
        <div class="flow-endpoint flow-destination"><span class="flow-node-icon"><Icon name="parties" size={25} /></span><small>DESTINATION</small><strong>{knowledgeText(flow.destination) || "Destination à préciser"}</strong></div>
      </div>
      <dl class="flow-facts"><div><dt>Données</dt><dd>{knowledgeText(flow.data) || "À examiner"}</dd></div><div><dt>Canal / support</dt><dd>{knowledgeText(flow.channel) || "À examiner"}</dd></div><div><dt>Lieux et accès à distance</dt><dd>{knowledgeText(flow.location) || "À examiner"}</dd></div><div><dt>Qui peut accéder, pour faire quoi</dt><dd>{knowledgeText(flow.access) || "À examiner"}</dd></div></dl>
    </li>
  {/each}
</ol>
