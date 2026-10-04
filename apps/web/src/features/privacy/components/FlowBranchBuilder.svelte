<script lang="ts">
  import { untrack } from "svelte";
  import { previewFlowBranches, splitFlow, unknown, type Activity, type DataFlow, type Knowledge } from "@rgpdesk/privacy-core";
  import KnowledgeField from "./KnowledgeField.svelte";
  import Icon from "./Icon.svelte";
  let { activity, flow, onChange }: { activity: Activity; flow: DataFlow; onChange: (next: Activity) => void } = $props();
  let stepId = $state(untrack(() => flow.journey?.steps[0]?.id ?? ""));
  const initial = untrack(() => flow.journey?.steps[0] ?? flow);
  let operations = $state<Knowledge[]>(untrack(() => [$state.snapshot(initial.operation)]));
  let channels = $state<Knowledge[]>(untrack(() => [$state.snapshot(initial.channel)]));
  let locations = $state<Knowledge[]>(untrack(() => [$state.snapshot(initial.location)]));
  let supportIds = $state<string[]>([]);
  let error = $state("");
  let opened = $state(false);
  let prepared = false;
  const preparations = new Map<string, { operations: Knowledge[]; channels: Knowledge[]; locations: Knowledge[]; supportIds: string[] }>();
  let options = $derived({ ...(stepId ? { stepId } : {}), operations, channels, locations, ...(supportIds.length ? { supportIds } : {}) });
  let count = $derived.by(() => { try { return previewFlowBranches(activity, flow.id, options); } catch { return 0; } });
  function refresh() {
    const source = flow.journey?.steps.find(s => s.id === stepId) ?? flow;
    operations = [$state.snapshot(source.operation)]; channels = [$state.snapshot(source.channel)]; locations = [$state.snapshot(source.location)]; supportIds = []; error = "";
  }
  function chooseStep(nextId: string) {
    preparations.set(stepId, $state.snapshot({ operations, channels, locations, supportIds }));
    stepId = nextId;
    const saved = preparations.get(stepId);
    if (saved) { operations = saved.operations; channels = saved.channels; locations = saved.locations; supportIds = saved.supportIds; error = ""; }
    else refresh();
  }
  function apply() {
    try { const next = splitFlow($state.snapshot(activity), flow.id, $state.snapshot(options), () => crypto.randomUUID()); onChange(next); preparations.clear(); prepared = false; opened = false; error = ""; }
    catch { error = "Les flux n’ont pas été modifiés. Vérifiez les alternatives et la limite de 20 flux par ensemble."; }
  }
</script>

<details class="flow-branches" bind:open={opened} ontoggle={e => { if (e.currentTarget.open && !prepared) { refresh(); prepared = true; } }}>
  <summary><Icon name="flows" size={22}/><span><strong>Plusieurs opérations, supports ou lieux ?</strong><small>Créez leurs flux parallèles sans ressaisir les faits communs.</small></span><Icon name="plus" size={18}/></summary>
  <div class="branch-body">
    <p>Déclarez les alternatives indépendantes. Chaque combinaison devient un flux distinct à relire : par exemple, deux canaux et trois lieux créent six flux. Pour des étapes successives, utilisez « Ajouter une étape » ou les liens précédent / suivant.</p>
    <p class="help">Cette préparation sera intégrée à la fiche après « Créer les flux parallèles ». Fermer ce volet conserve sa saisie tant que vous restez dans cette rubrique. Créez les flux avant de changer de rubrique.</p>
    {#if flow.journey && flow.journey.steps.length > 1}<label class="field">Étape à décliner<select aria-label="Étape à décliner" value={stepId} onchange={e => chooseStep(e.currentTarget.value)}>{#each flow.journey.steps as s,i}<option value={s.id}>Étape {i+1}</option>{/each}</select></label><p class="help">Les autres étapes sont conservées dans chaque parcours. Vérifiez ensuite que chacune s’applique à cette variante.</p>{/if}
    <div class="branch-columns">
      <section aria-label="Opérations alternatives"><h4><Icon name="analysis"/>Les opérations</h4>{#each operations as value,i}<div class="branch-input"><KnowledgeField label={`Opération alternative ${i+1}`} bind:value={operations[i]} reuse="operation"/>{#if operations.length>1}<button type="button" class="text-button" aria-label={`Retirer l’opération alternative ${i+1}`} onclick={()=>operations=operations.filter((_,n)=>n!==i)}>Retirer</button>{/if}</div>{/each}<button type="button" class="secondary" disabled={operations.length>=20} onclick={()=>operations=[...operations,unknown()]}><Icon name="plus"/>Autre opération</button></section>
      <section aria-label="Supports et canaux alternatifs"><h4><Icon name="systems"/>Les supports / canaux</h4>{#each channels as value,i}<div class="branch-input"><KnowledgeField label={`Canal ou support alternatif ${i+1}`} bind:value={channels[i]} reuse="channel"/>{#if channels.length>1}<button type="button" class="text-button" aria-label={`Retirer le canal alternatif ${i+1}`} onclick={()=>channels=channels.filter((_,n)=>n!==i)}>Retirer</button>{/if}</div>{/each}<button type="button" class="secondary" disabled={channels.length>=20} onclick={()=>channels=[...channels,unknown()]}><Icon name="plus"/>Autre canal ou support</button>
        {#if flow.journey && activity.flowSupports?.length}<fieldset class="choices"><legend>Ou décliner les supports déjà déclarés</legend>{#each activity.flowSupports as support}<label><input type="checkbox" checked={supportIds.includes(support.id)} onchange={e=>supportIds=e.currentTarget.checked?[...supportIds,support.id]:supportIds.filter(id=>id!==support.id)}/>Support {support.code} · {support.name}</label>{/each}</fieldset><p class="help">Chaque support coché crée une variante. Les supports associés aux origines et destinations restent liés à ces extrémités.</p>{/if}
      </section>
      <section aria-label="Lieux de stockage alternatifs"><h4><Icon name="register"/>Les lieux de stockage</h4>{#each locations as value,i}<div class="branch-input"><KnowledgeField label={`Lieu de stockage alternatif ${i+1}`} bind:value={locations[i]} reuse="location"/>{#if locations.length>1}<button type="button" class="text-button" aria-label={`Retirer le lieu alternatif ${i+1}`} onclick={()=>locations=locations.filter((_,n)=>n!==i)}>Retirer</button>{/if}</div>{/each}<button type="button" class="secondary" disabled={locations.length>=20} onclick={()=>locations=[...locations,unknown()]}><Icon name="plus"/>Autre lieu de stockage</button></section>
    </div>
    <div class="branch-result"><Icon name="flows" size={28}/><div><strong>{count ? `${count} flux distinct${count>1?"s":""}` : "Combinaisons à vérifier"}</strong><p>{count ? "Le premier reprend ce flux ; les autres sont ajoutés à la fiche. Les données et sous-finalités restent liées. Enregistrez la fiche pour les conserver." : "Renseignez chaque alternative ajoutée, évitez les doublons et gardez au maximum 20 flux dans cet ensemble."}</p></div><button type="button" disabled={!count} onclick={apply}>Créer les flux parallèles<Icon name="arrow"/></button></div>
    {#if error}<p role="alert">{error}</p>{/if}
  </div>
</details>

<style>
  .flow-branches { margin-block:1.25rem; border:1px solid #b9c9d6; border-radius:.8rem; background:linear-gradient(140deg,#e8f0f6,#f7f4ec); }
  summary { display:flex; gap:.9rem; align-items:center; padding:1.2rem; cursor:pointer; color:#2f4c64; } summary span { flex:1; } summary small { display:block; margin-top:.35rem; font-size:1rem; line-height:1.5; }
  .branch-body { padding:0 1.2rem 1.2rem; } .branch-columns { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:1rem; }
  .branch-columns section { min-width:0; padding:1rem; background:#f8fafb; border:1px solid #ccd6df; border-radius:.6rem; } h4 { display:flex; gap:.6rem; align-items:center; margin-top:0; }
  .branch-input { margin-bottom:1rem; } .branch-result { display:flex; align-items:center; gap:1rem; padding:1.1rem; margin-top:1.2rem; border-radius:.6rem; background:#dae7ee; color:#263e51; } .branch-result div { flex:1; } .branch-result p { font-size:1rem; margin:.35rem 0 0; }
  @media(max-width:1000px) { .branch-columns { grid-template-columns:1fr; } .branch-result { flex-wrap:wrap; } }
</style>
