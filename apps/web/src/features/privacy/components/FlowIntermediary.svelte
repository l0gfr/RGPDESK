<script lang="ts">
  import { untrack } from "svelte";
  import { insertFlowIntermediary, knowledgeText, unknown, type Activity, type DataFlow } from "@rgpdesk/privacy-core";
  import KnowledgeField from "./KnowledgeField.svelte";
  import Icon from "./Icon.svelte";
  let { activity, flow, onChange }: { activity: Activity; flow: DataFlow; onChange: (next: Activity) => void } = $props();
  let intermediary = $state(unknown());
  let stepId = $state(untrack(() => flow.journey?.steps[0]?.id ?? ""));
  let opened = $state(false);
  let error = $state("");
  function apply() {
    try { onChange(insertFlowIntermediary($state.snapshot(activity), flow.id, { intermediary: $state.snapshot(intermediary), ...(stepId ? { stepId } : {}) }, () => crypto.randomUUID())); intermediary = unknown(); opened = false; error = ""; }
    catch { error = "Le flux n’a pas été scindé. Précisez l’intermédiaire et vérifiez la limite de 20 flux."; }
  }
</script>

<details class="flow-intermediary" bind:open={opened}>
  <summary><Icon name="parties" size={22}/><span><strong>Y a-t-il un intermédiaire ?</strong><small>Une personne ou une équipe reçoit les données avant leur destination.</small></span><Icon name="plus" size={18}/></summary>
  <div class="intermediary-body">
    <p>Par exemple : un étudiant chargé de collecter les formulaires dans les amphithéâtres, puis de les remettre aux organisateurs. Décrivez sa fonction, sans nom de personne.</p>
    {#if flow.journey && flow.journey.steps.length>1}<label class="field">Passage avec un intermédiaire<select aria-label="Passage avec un intermédiaire" bind:value={stepId}>{#each flow.journey.steps as step,i}<option value={step.id}>Étape {i+1} · {knowledgeText(step.operation).slice(0,100) || "Opération à préciser"}</option>{/each}</select></label>{/if}
    <KnowledgeField label="Intermédiaire · fonction ou groupe" bind:value={intermediary} reuse="endpoint" hint="Ex. équipe chargée de collecter les formulaires dans les amphithéâtres."/>
    <ol class="intermediary-preview" aria-label="Les deux passages"><li><span>01</span>Origine<Icon name="arrow" size={18}/><strong>{knowledgeText(intermediary)||"Intermédiaire à préciser"}</strong></li><li><span>02</span><strong>{knowledgeText(intermediary)||"Intermédiaire à préciser"}</strong><Icon name="arrow" size={18}/>Destination</li></ol>
    <p class="help">Deux flux liés seront créés. Les données et sous-finalités sont conservées. Vérifiez ensuite l’opération, les supports, le stockage et les habilitations de chaque passage ; les éléments non connus restent à renseigner.</p>
    <p class="help">Cette préparation sera intégrée à la fiche après « Scinder le flux avec cet intermédiaire ». Enregistrez ensuite la fiche pour conserver les deux flux.</p>
    <button type="button" disabled={!knowledgeText(intermediary).trim() || activity.flows.length>=20} onclick={apply}>Scinder le flux avec cet intermédiaire<Icon name="arrow"/></button>
    {#if error}<p role="alert">{error}</p>{/if}
  </div>
</details>

<style>
  .flow-intermediary { border:1px solid #c3cbd3; border-radius:.8rem; margin-block:1rem; background:linear-gradient(125deg,#f6f1e9,#eef3f7); }
  summary { display:flex; align-items:center; gap:.9rem; padding:1.2rem; color:#344e62; cursor:pointer; } summary span { flex:1; } summary small { display:block; font-size:1rem; line-height:1.5; margin-top:.35rem; }
  .intermediary-body { padding:0 1.2rem 1.2rem; } .intermediary-preview { list-style:none; display:grid; gap:.6rem; padding:0; } .intermediary-preview li { display:flex; gap:.8rem; align-items:center; flex-wrap:wrap; padding:.9rem; border-radius:.6rem; border:1px solid #c3ced7; background:#f9fafb; overflow-wrap:anywhere; } .intermediary-preview span { color:#5b7183; font-variant-numeric:tabular-nums; }
</style>
