<script lang="ts">
  import { tick, untrack } from "svelte";
  import { createDataFlow, createFlowStep, nextJourneyReference, knowledgeText, resolveFlow, resolvedFlows, unknown, type DataFlow, type Activity, type Workspace, type FlowReference } from "@rgpdesk/privacy-core";
  import KnowledgeField from "./KnowledgeField.svelte";
  import FlowJourneyEditor from "./FlowJourneyEditor.svelte";
  import FlowMap from "./FlowMap.svelte";
  import Icon from "./Icon.svelte";
  let { flows = $bindable(), activity = $bindable(), workspace, compact = false, groupId = "" }: { flows: DataFlow[]; activity: Activity; workspace: Workspace; compact?: boolean; groupId?: string } = $props();
  let expanded = $state<string[]>(untrack(() => !compact && flows[0] ? [flows[0].id] : []));
  let removal = $state("");
  let root: HTMLDivElement | undefined = $state();
  async function edit(id: string) { expanded = [...new Set([...expanded,id])]; await tick(); const el = root?.querySelector<HTMLDetailsElement>(`[data-flow-id="${id}"]`); if (el) { el.open = true; el.querySelector("summary")?.focus(); el.scrollIntoView({block:"nearest"}); } }
  function addFlow() { if (flows.length >= 20) return; const id = crypto.randomUUID(); flows = [...flows, { ...createDataFlow(id), ...(groupId ? { dataGroupIds: [groupId], journey: { reference:nextJourneyReference({...activity,flows},groupId),purposeIds:[],steps:[createFlowStep(crypto.randomUUID())] } } : {}) }]; void edit(id); }
  function bindEndpoint(flow: DataFlow, field: "source" | "destination", ref: string) {
    const previous = resolveFlow(flow, activity, workspace)[field];
    if (ref) { flow[`${field}Ref`] = ref as FlowReference; flow[field] = unknown(); }
    else { delete flow[`${field}Ref`]; flow[field] = previous; }
  }
</script>
<div class="flow-editor" bind:this={root}>
  <div class="section-heading"><div><p class="eyebrow">Origine · opération · destination</p><h3>Suivez le parcours des données.</h3></div><button type="button" disabled={flows.length >= 20} onclick={addFlow}><Icon name="plus" />{groupId ? "Ajouter un parcours" : "Ajouter un flux"}</button></div>
  <p>Choisissez les personnes, intervenants et outils déjà recensés. Leurs noms restent liés à l’inventaire. Décrivez uniquement le mouvement que vous connaissez.</p>
  {#if !flows.some(f => !groupId || f.dataGroupIds?.includes(groupId))}<div class="flow-empty"><Icon name="flows" size={40} /><h3>Commencez par un mouvement concret.</h3><p>Par exemple : des candidats transmettent leurs CV à l’équipe de recrutement par un formulaire. Ce flux est un exemple, à décrire selon votre situation.</p></div>{/if}
  {#each flows as flow, index (flow.id)}
    {#if !groupId || flow.dataGroupIds?.includes(groupId)}
    {@const resolved = resolveFlow(flow, activity, workspace)}
    <details class="analysis-question" data-flow-id={flow.id} open={expanded.includes(flow.id)} ontoggle={e => { expanded = e.currentTarget.open ? [...new Set([...expanded,flow.id])] : expanded.filter(id => id !== flow.id); }}><summary><span class="question-index">{flow.journey?.reference ?? String(index + 1).padStart(2, "0")}</span><span>{flow.journey ? `Parcours ${flow.journey.reference}` : `Décrire le flux ${index + 1}`}<small>{knowledgeText(resolved.source).slice(0,65) || "Origine à préciser"} → {knowledgeText(resolved.destination).slice(0,65) || "Destination à préciser"}</small></span><Icon name="plus" size={18} /></summary><div class="analysis-question-body">
      {#if flow.journey}<FlowJourneyEditor bind:flow={flows[index]} bind:activity {workspace}/>{:else}
      <div class="grid-two">{#each ["source", "destination"] as field}{@const endpoint = field as "source" | "destination"}
        <div><label class="field">Flux {index + 1} · {endpoint === "source" ? "Choisir l’origine" : "Choisir la destination"}<select aria-label={`Flux ${index + 1} · ${endpoint === "source" ? "Choisir l’origine" : "Choisir la destination"}`} value={flow[`${endpoint}Ref`] ?? ""} onchange={(e) => bindEndpoint(flow, endpoint, e.currentTarget.value)}><option value="">Description libre</option><option value="subjects">Personnes concernées de cette activité</option><optgroup label="Intervenants">{#each workspace.parties as p}<option value={`party:${p.id}`}>{p.name}</option>{/each}</optgroup><optgroup label="Systèmes">{#each workspace.systems as s}<option value={`system:${s.id}`}>{s.name}</option>{/each}</optgroup></select></label>
        {#if !flow[`${endpoint}Ref`]}<KnowledgeField label={`Flux ${index + 1} · ${endpoint === "source" ? "Origine" : "Destination"}`} bind:value={flow[endpoint]} reuse="endpoint" hint="Catégorie de personnes, équipe, outil ou organisme. Évitez les noms de personnes." />{:else}<p class="linked-fact"><Icon name="flows" size={16} />{knowledgeText(resolved[endpoint]) || "À renseigner dans la fiche"}</p>{/if}</div>
      {/each}</div>
      <KnowledgeField label={`Flux ${index + 1} · Opération`} bind:value={flow.operation} reuse="operation" hint="Collecte, consultation, transmission, archivage… Décrivez ce mouvement concret." />
      {#if activity.dataGroups?.length}<fieldset class="choices"><legend>Flux {index + 1} · Groupes qui circulent</legend>{#each activity.dataGroups as g}<label><input type="checkbox" checked={flow.dataGroupIds?.includes(g.id) ?? false} disabled={g.id === groupId} onchange={e => { flow.dataGroupIds = e.currentTarget.checked ? [...(flow.dataGroupIds ?? []),g.id] : (flow.dataGroupIds ?? []).filter(id => id !== g.id); if(flow.dataGroupIds.length){ flow.data = unknown(); delete flow.dataFromActivity; } }} />D{g.code} · {knowledgeText(g.data) || "À décrire"}</label>{/each}</fieldset>{/if}
      {#if flow.dataGroupIds?.length}<p class="linked-fact">{knowledgeText(resolved.data)}</p>{:else}
      <label class="choice"><input type="checkbox" checked={flow.dataFromActivity ?? false} onchange={(e) => { const previous = resolved.data; flow.dataFromActivity = e.currentTarget.checked; flow.data = e.currentTarget.checked ? unknown() : previous; }} />Reprendre toutes les catégories de données de cette activité</label>
      {#if flow.dataFromActivity}<p class="linked-fact">{knowledgeText(activity.dataCategories) || "Catégories à renseigner dans la fiche"}</p>{:else}<KnowledgeField label={`Flux ${index + 1} · Données concernées`} bind:value={flow.data} reuse="data" hint="Seulement les catégories qui circulent dans ce flux, sans données individuelles." />{/if}
      {/if}
      <details class="flow-detail" open={flow.channel.state === "documented" || flow.location.state === "documented" || flow.access.state === "documented"}><summary>Préciser le canal, les pays et les habilitations</summary><KnowledgeField label={`Flux ${index + 1} · Canal ou support`} bind:value={flow.channel} reuse="channel" hint="Formulaire, accès direct, fichier, papier…" /><KnowledgeField label={`Flux ${index + 1} · Lieux de stockage`} bind:value={flow.location} reuse="location" hint="Pays ou sites où les données sont conservées. Précisez aussi les pays d’accès à distance, s’ils diffèrent. Les rôles autorisés se décrivent dans « Accès et habilitations »." /><KnowledgeField label={`Flux ${index + 1} · Accès et habilitations`} bind:value={flow.access} reuse="access" hint="Rôles autorisés, opérations permises et périmètre." /></details>
      {/if}
      {#if removal === flow.id}<p>Retirer {flow.journey ? "ce parcours et ses étapes" : "ce flux"} de la fiche en cours ? L’enregistrement sera nécessaire.</p><div class="actions"><button type="button" class="secondary" onclick={() => { flows = flows.filter((f) => f.id !== flow.id); removal = ""; }}>Confirmer le retrait {flow.journey ? `du parcours ${flow.journey.reference}` : `du flux ${index + 1}`}</button><button type="button" class="text-button" onclick={() => removal = ""}>Conserver {flow.journey ? "ce parcours" : "ce flux"}</button></div>{:else}<button type="button" class="text-button danger" onclick={() => removal = flow.id}>Retirer {flow.journey ? `le parcours ${flow.journey.reference}` : `le flux ${index + 1}`}</button>{/if}
    </div></details>
    {/if}
  {/each}
  {#if !groupId && flows.length}<h3>Votre carte, d’après ces déclarations</h3><FlowMap activity={{...activity,flows}} inventory={workspace} flows={resolvedFlows({ ...activity, flows }, workspace)} onEdit={(id) => void edit(id)} />{/if}
  <p class="help">La carte se dessine à partir des étapes et des liens que vous renseignez. Plusieurs supports cochés décrivent une même opération ; ajoutez une étape si l’opération ou les personnes autorisées changent. Limite : 20 flux ou parcours par ensemble. Leur partage demande une sélection et une relecture explicites.</p>
</div>
