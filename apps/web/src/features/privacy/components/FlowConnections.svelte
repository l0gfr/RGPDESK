<script lang="ts">
  import { connectionText, knowledgeText, setFlowConnection, type Activity, type DataFlow, type FlowConnection } from "@rgpdesk/privacy-core";
  import Icon from "./Icon.svelte";
  let { activity, flow, onChange }: { activity: Activity; flow: DataFlow; onChange: (next: Activity) => void } = $props();
  let error = $state("");
  function change(direction: "previous" | "next", value: FlowConnection) {
    try { onChange(setFlowConnection($state.snapshot(activity), flow.id, direction, value)); choosing = ""; error = ""; }
    catch { error = "Ce lien n’a pas été modifié. Vérifiez les flux sélectionnés."; }
  }
  function select(direction: "previous" | "next", state: string) {
    if (state !== "linked") change(direction, { state: state as "unknown" | "none" | "pending" });
  }
  let choosing = $state<"previous" | "next" | "">("");
  function toggle(direction: "previous" | "next", id: string, checked: boolean) {
    const value = flow.sequence?.[direction];
    const ids = value?.state === "linked" ? value.flowIds : [];
    const next = checked ? [...ids, id] : ids.filter(item => item !== id);
    change(direction, next.length ? { state: "linked", flowIds: next } : { state: "unknown" });
  }
</script>

<section class="flow-connections" aria-label="Enchaînement du flux">
  <header><Icon name="flows" size={22}/><div><h4>Où se situe ce flux ?</h4><p>Indiquez son point de départ et sa suite. Vous pouvez compléter les liens plus tard.</p></div></header>
  <div class="grid-two">
    {#each ["previous", "next"] as key}
      {@const direction = key as "previous" | "next"}
      {@const value = flow.sequence?.[direction] ?? { state: "unknown" as const }}
      <div>
        <label class="field">{direction === "previous" ? "Flux précédent" : "Flux suivant"}
          <select aria-label={direction === "previous" ? "Flux précédent" : "Flux suivant"} value={choosing === direction ? "linked" : value.state} onchange={e => { const state = e.currentTarget.value; choosing = state === "linked" ? direction : ""; select(direction, state); }}>
            <option value="unknown">À examiner</option>
            <option value="none">{direction === "previous" ? "Néant · point de départ / traitement 0" : "Néant · fin du parcours"}</option>
            <option value="pending">Flux à renseigner plus tard</option>
            <option value="linked">Choisir des flux déjà renseignés</option>
          </select>
        </label>
        {#if value.state === "linked" || choosing === direction}
          <fieldset class="choices"><legend>{direction === "previous" ? "Ce qui précède" : "Ce qui suit"}</legend>
            {#each activity.flows.filter(f => f.id !== flow.id) as other (other.id)}
              <label><input type="checkbox" checked={value.state === "linked" && value.flowIds.includes(other.id)} onchange={e => toggle(direction, other.id, e.currentTarget.checked)}/><span><strong>{other.journey ? `Parcours ${other.journey.reference}` : `Flux ${activity.flows.findIndex(f => f.id === other.id) + 1}`}</strong> · {knowledgeText(other.journey?.steps[0]?.operation ?? other.operation).slice(0,100) || "Opération à préciser"}</span></label>
            {/each}
            {#if activity.flows.length < 2}<p>Ajoutez ou déclinez un autre flux pour le choisir ici.</p>{/if}
          </fieldset>
        {/if}
        <p class="connection-summary">{connectionText(activity, value, direction)}</p>
      </div>
    {/each}
  </div>
  <p class="help">Un lien est repris dans l’autre flux. Plusieurs flux peuvent se rejoindre. Les liens ne choisissent aucune opération à votre place.</p>
  {#if error}<p role="alert">{error}</p>{/if}
</section>

<style>
  .flow-connections { padding: 1.25rem; margin-block: 1rem 1.5rem; border: 1px solid #becbd5; border-radius: .8rem; background: linear-gradient(125deg,#edf3f7,#f8f5ef); }
  header { display:flex; gap:.8rem; align-items:flex-start; margin-bottom:1rem; color:#334f65; }
  header h4 { margin:0; } header p { margin:.35rem 0 0; font-size:1rem; }
  .connection-summary { font-size:1rem; color:#405b70; margin:.5rem 0; }
  .choices { max-height:18rem; overflow-y:auto; }
</style>
