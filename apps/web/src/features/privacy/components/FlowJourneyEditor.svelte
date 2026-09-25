<script lang="ts">
  import { tick } from "svelte";
  import { createFlowStep, knowledgeText, resolveStepEndpoint, unknown, type Activity, type DataFlow, stepSupportIds, type StepReference, type FlowStep, type Workspace } from "@rgpdesk/privacy-core";
  import DeclarationPicker from "./DeclarationPicker.svelte";
  import KnowledgeField from "./KnowledgeField.svelte";
  import Icon from "./Icon.svelte";
  import JourneyMap from "./JourneyMap.svelte";
  let { flow = $bindable(), activity = $bindable(), workspace }: { flow: DataFlow; activity: Activity; workspace: Workspace } = $props();
  let root: HTMLDivElement | undefined = $state();
  let newSupport = $state("");
  let removeStep = $state("");
  async function addStep() {
    if (!flow.journey || flow.journey.steps.length >= 8) return;
    flow.journey.steps = [...flow.journey.steps, createFlowStep(crypto.randomUUID())];
    await tick();
    const last=root?.querySelector<HTMLDetailsElement>(".journey-step:last-child"); if(last){last.open=true;last.querySelector("textarea")?.focus();}
  }
  function support() {
    const name=newSupport.trim();if(!name || name.length>160 || (activity.flowSupports ?? []).some(s=>s.name.trim()===name) || (activity.flowSupports?.length ?? 0)>=20 || (activity.flowSupports ?? []).some(s=>s.code>=9999))return;
    activity.flowSupports=[...(activity.flowSupports ?? []),{id:crypto.randomUUID(),code:Math.max(0,...(activity.flowSupports ?? []).map(s=>s.code))+1,name}];newSupport="";
  }
  function link(s:FlowStep, field:"source"|"destination", ref:string) {
    const before=resolveStepEndpoint(s[`${field}Ref`],s[field],activity,flow,workspace);
    if(ref){s[`${field}Ref`]=ref as StepReference;s[field]=unknown();}else{delete s[`${field}Ref`];s[field]=before;}
  }
</script>
{#if flow.journey}
<div class="journey-editor" bind:this={root}>
  <p class="help">Un parcours décrit un usage du groupe. Ajoutez ses étapes dans l’ordre. Les autres parcours peuvent avoir d’autres destinataires et sous-finalités.</p>
  {#if activity.role === "controller"}<fieldset class="choices"><legend>Parcours {flow.journey.reference} · Sous-finalités</legend>{#each activity.purposes as p,i}<label><input type="checkbox" checked={flow.journey.purposeIds.includes(p.id)} onchange={e=>{if(flow.journey)flow.journey.purposeIds=e.currentTarget.checked?[...flow.journey.purposeIds,p.id]:flow.journey.purposeIds.filter(id=>id!==p.id);}}/>SF{i+1} · {knowledgeText(p.description)||"À décrire"}</label>{/each}{#if !activity.purposes.length}<p>Décrivez vos objectifs à l’étape « Les objectifs ».</p>{/if}</fieldset>{/if}
  <details class="journey-supports"><summary><Icon name="systems" size={20}/>Les supports de cet ensemble · {(activity.flowSupports ?? []).length}</summary><p class="help">Déclarez chaque fichier, boîte mail ou support une fois. Choisissez-le ensuite dans les étapes. Renommer un support met à jour ses liens dans cette fiche, après enregistrement.</p>{#each activity.flowSupports ?? [] as s}<label class="field">Support {s.code} · Nom<input maxlength="160" bind:value={s.name}/></label>{/each}<div class="journey-support-add"><label class="field">Nouveau support · parcours {flow.journey.reference}<input maxlength="160" bind:value={newSupport} onkeydown={e=>{if(e.key==="Enter"){e.preventDefault();support();}}} placeholder="Ex. fichier des inscriptions"/></label><button type="button" class="secondary" disabled={!newSupport.trim()||(activity.flowSupports ?? []).some(s=>s.name.trim()===newSupport.trim())||(activity.flowSupports?.length ?? 0)>=20||(activity.flowSupports ?? []).some(s=>s.code>=9999)} onclick={support}><Icon name="plus"/>Créer le support</button></div><DeclarationPicker kind="support" label="Nouveau support" current={newSupport} onUse={text=>newSupport=text}/><p class="help">Un nom repris reste à confirmer avec « Créer le support ». Cochez ensuite les supports utiles à chaque étape.</p></details>
  <div class="journey-steps">
  {#each flow.journey.steps as s,i (s.id)}
    {@const label=`Parcours ${flow.journey.reference} · Étape ${i+1}`}
    <details class="journey-step" open={i===flow.journey.steps.length-1}>
      <summary><span class="journey-number">{i+1}</span><span><strong>{knowledgeText(s.operation).slice(0,110)||"Décrire cette étape"}</strong><small>{stepSupportIds(s).map(id=>activity.flowSupports?.find(x=>x.id===id)).filter(Boolean).map(x=>`Support ${x!.code}`).join(" · ")||"Supports à choisir"}</small></span><Icon name="plus" size={18}/></summary>
      <div class="journey-step-body">
        <KnowledgeField label={`${label} · Opération`} bind:value={s.operation} reuse="operation" hint="Ex. recueillir, vérifier une inscription, enregistrer, consulter ou établir une liste. Une étape par opération."/>
        <fieldset class="choices"><legend>{label} · Supports utilisés</legend>{#each activity.flowSupports ?? [] as support}<label><input type="checkbox" checked={stepSupportIds(s).includes(support.id)} disabled={s.sourceRef===`support:${support.id}`||s.destinationRef===`support:${support.id}`} onchange={e=>s.supportIds=e.currentTarget.checked?[...s.supportIds,support.id]:s.supportIds.filter(id=>id!==support.id)}/>Support {support.code} · {support.name||"À nommer"}</label>{/each}{#if !activity.flowSupports?.length}<p>Ouvrez « Les supports de cet ensemble » ci-dessus pour en déclarer un.</p>{/if}</fieldset>
        <div class="grid-two"><KnowledgeField label={`${label} · Qui intervient et pour quoi`} bind:value={s.access} reuse="access" hint="Fonction autorisée et périmètre, sans nom de personne."/><KnowledgeField label={`${label} · Quand ou sous quelle condition`} bind:value={s.when} hint="Ex. après la clôture ; seulement si aucune inscription n’existe. Laisser vide si vous ne savez pas."/></div>
        <details class="journey-context"><summary>Origine, destination, canal et lieux</summary><div class="grid-two">{#each ["source","destination"] as key}{@const endpoint=key as "source"|"destination"}<div><label class="field">{label} · {key==="source" ? "Choisir l’origine" : "Choisir la destination"}<select value={s[`${endpoint}Ref`]??""} onchange={e=>link(s,endpoint,e.currentTarget.value)}><option value="">Description libre</option><option value="subjects">Personnes du groupe</option><optgroup label="Supports de cet ensemble">{#each activity.flowSupports ?? [] as support}<option value={`support:${support.id}`}>Support {support.code} · {support.name}</option>{/each}</optgroup><optgroup label="Intervenants">{#each workspace.parties as p}<option value={`party:${p.id}`}>{p.name}</option>{/each}</optgroup><optgroup label="Systèmes">{#each workspace.systems as sys}<option value={`system:${sys.id}`}>{sys.name}</option>{/each}</optgroup></select></label>{#if s[`${endpoint}Ref`]}<p class="linked-fact">{knowledgeText(resolveStepEndpoint(s[`${endpoint}Ref`],s[endpoint],activity,flow,workspace))||"À préciser"}</p>{:else}<KnowledgeField label={`${label} · ${key==="source" ? "Origine" : "Destination"}`} bind:value={s[endpoint]} reuse="endpoint"/>{/if}</div>{/each}</div><KnowledgeField label={`${label} · Canal`} bind:value={s.channel} reuse="channel" hint="Ex. au bureau ou par email. Plusieurs modalités alternatives peuvent être décrites."/><KnowledgeField label={`${label} · Lieux de stockage`} bind:value={s.location} reuse="location" hint="Pays ou sites où les données sont conservées. Précisez aussi les pays d’accès à distance, s’ils diffèrent. Les rôles autorisés se décrivent dans « Qui intervient et pour quoi »."/></details>
        <div class="actions journey-step-actions"><button type="button" class="text-button" disabled={i===0} onclick={()=>{if(flow.journey){const steps=[...flow.journey.steps];[steps[i-1],steps[i]]=[steps[i]!,steps[i-1]!];flow.journey.steps=steps;}}}>Monter l’étape {i+1}</button><button type="button" class="text-button" disabled={i===flow.journey.steps.length-1} onclick={()=>{if(flow.journey){const steps=[...flow.journey.steps];[steps[i+1],steps[i]]=[steps[i]!,steps[i+1]!];flow.journey.steps=steps;}}}>Descendre l’étape {i+1}</button>{#if flow.journey.steps.length>1}<button type="button" class="text-button danger" onclick={()=>removeStep=s.id}>Retirer l’étape {i+1}</button>{/if}</div>
        {#if removeStep===s.id}<p>Retirer cette étape et sa description du parcours ?</p><div class="actions"><button type="button" class="secondary" onclick={()=>{if(flow.journey)flow.journey.steps=flow.journey.steps.filter(x=>x.id!==s.id);removeStep="";}}>Confirmer le retrait de l’étape</button><button type="button" class="text-button" onclick={()=>removeStep=""}>Conserver l’étape</button></div>{/if}
      </div>
    </details>
  {/each}
  </div>
  <button type="button" class="secondary" disabled={flow.journey.steps.length>=8} onclick={()=>void addStep()}><Icon name="plus"/>Ajouter une étape au parcours {flow.journey.reference}</button>
  <details class="journey-preview"><summary><Icon name="eye"/>Relire le parcours {flow.journey.reference}</summary><JourneyMap {activity} {flow} inventory={workspace}/></details>
  <p class="help">8 étapes maximum par parcours. Les données restent celles du groupe lié ; aucune sous-finalité n’est choisie automatiquement.</p>
</div>
{/if}
