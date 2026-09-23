<script lang="ts">
  import { tick } from "svelte";
  import { createDataFlow, knowledgeText, resolveFlow, resolvedFlows, unknown, type DataFlow, type Activity, type Workspace, type FlowReference } from "@rgpdesk/privacy-core";
  import KnowledgeField from "./KnowledgeField.svelte";
  import FlowMap from "./FlowMap.svelte";
  import Icon from "./Icon.svelte";
  let { flows = $bindable(), activity, workspace, compact = false }: { flows: DataFlow[]; activity: Activity; workspace: Workspace; compact?: boolean } = $props();
  let added = $state(""), removal = $state("");
  let root: HTMLDivElement | undefined = $state();
  async function edit(id: string) { added = id; await tick(); const el = root?.querySelector<HTMLDetailsElement>(`[data-flow-id="${id}"]`); if (el) { el.open = true; el.querySelector("summary")?.focus(); el.scrollIntoView({block:"nearest"}); } }
  function addFlow() { if (flows.length >= 20) return; const id = crypto.randomUUID(); flows = [...flows, createDataFlow(id)]; void edit(id); }
  function bindEndpoint(flow: DataFlow, field: "source" | "destination", ref: string) {
    const previous = resolveFlow(flow, activity, workspace)[field];
    if (ref) { flow[`${field}Ref`] = ref as FlowReference; flow[field] = unknown(); }
    else { delete flow[`${field}Ref`]; flow[field] = previous; }
  }
</script>
<div class="flow-editor" bind:this={root}>
  <div class="section-heading"><div><p class="eyebrow">Origine · opération · destination</p><h3>Suivez le parcours des données.</h3></div><button type="button" disabled={flows.length >= 20} onclick={addFlow}><Icon name="plus" />Ajouter un flux</button></div>
  <p>Choisissez les personnes, intervenants et outils déjà recensés. Leurs noms restent liés à l’inventaire. Décrivez uniquement le mouvement que vous connaissez.</p>
  {#if !flows.length}<div class="flow-empty"><Icon name="flows" size={40} /><h3>Commencez par un mouvement concret.</h3><p>Par exemple : des candidats transmettent leurs CV à l’équipe de recrutement par un formulaire. Ce flux est un exemple, à décrire selon votre situation.</p></div>{/if}
  {#each flows as flow, index (flow.id)}
    {@const resolved = resolveFlow(flow, activity, workspace)}
    <details class="analysis-question" data-flow-id={flow.id} open={added === flow.id || (!compact && index === 0)}><summary><span class="question-index">{String(index + 1).padStart(2, "0")}</span><span>Décrire le flux {index + 1}<small>{knowledgeText(resolved.source).slice(0,65) || "Origine à préciser"} → {knowledgeText(resolved.destination).slice(0,65) || "Destination à préciser"}</small></span><Icon name="plus" size={18} /></summary><div class="analysis-question-body">
      <div class="grid-two">{#each ["source", "destination"] as field}{@const endpoint = field as "source" | "destination"}
        <div><label class="field">Flux {index + 1} · {endpoint === "source" ? "Choisir l’origine" : "Choisir la destination"}<select aria-label={`Flux ${index + 1} · ${endpoint === "source" ? "Choisir l’origine" : "Choisir la destination"}`} value={flow[`${endpoint}Ref`] ?? ""} onchange={(e) => bindEndpoint(flow, endpoint, e.currentTarget.value)}><option value="">Description libre</option><option value="subjects">Personnes concernées de cette activité</option><optgroup label="Intervenants">{#each workspace.parties as p}<option value={`party:${p.id}`}>{p.name}</option>{/each}</optgroup><optgroup label="Systèmes">{#each workspace.systems as s}<option value={`system:${s.id}`}>{s.name}</option>{/each}</optgroup></select></label>
        {#if !flow[`${endpoint}Ref`]}<KnowledgeField label={`Flux ${index + 1} · ${endpoint === "source" ? "Origine" : "Destination"}`} bind:value={flow[endpoint]} hint="Catégorie de personnes, équipe, outil ou organisme. Évitez les noms de personnes." />{:else}<p class="linked-fact"><Icon name="flows" size={16} />{knowledgeText(resolved[endpoint]) || "À renseigner dans la fiche"}</p>{/if}</div>
      {/each}</div>
      <KnowledgeField label={`Flux ${index + 1} · Opération`} bind:value={flow.operation} hint="Collecte, consultation, transmission, archivage… Décrivez ce mouvement concret." />
      <label class="choice"><input type="checkbox" checked={flow.dataFromActivity ?? false} onchange={(e) => { const previous = resolved.data; flow.dataFromActivity = e.currentTarget.checked; flow.data = e.currentTarget.checked ? unknown() : previous; }} />Reprendre toutes les catégories de données de cette activité</label>
      {#if flow.dataFromActivity}<p class="linked-fact">{knowledgeText(activity.dataCategories) || "Catégories à renseigner dans la fiche"}</p>{:else}<KnowledgeField label={`Flux ${index + 1} · Données concernées`} bind:value={flow.data} hint="Seulement les catégories qui circulent dans ce flux, sans données individuelles." />{/if}
      <details class="flow-detail" open={flow.channel.state === "documented" || flow.location.state === "documented" || flow.access.state === "documented"}><summary>Préciser le canal, les pays et les habilitations</summary><KnowledgeField label={`Flux ${index + 1} · Canal ou support`} bind:value={flow.channel} hint="Formulaire, accès direct, fichier, papier…" /><KnowledgeField label={`Flux ${index + 1} · Lieux et accès à distance`} bind:value={flow.location} hint="Pays de stockage et d’accès connus. Cela ne qualifie pas automatiquement un transfert." /><KnowledgeField label={`Flux ${index + 1} · Accès et habilitations`} bind:value={flow.access} hint="Rôles autorisés, opérations permises et périmètre." /></details>
      {#if removal === flow.id}<p>Retirer ce flux de la fiche en cours ? L’enregistrement sera nécessaire.</p><div class="actions"><button type="button" class="secondary" onclick={() => { flows = flows.filter((f) => f.id !== flow.id); removal = ""; }}>Confirmer le retrait du flux {index + 1}</button><button type="button" class="text-button" onclick={() => removal = ""}>Conserver ce flux</button></div>{:else}<button type="button" class="text-button danger" onclick={() => removal = flow.id}>Retirer le flux {index + 1}</button>{/if}
    </div></details>
  {/each}
  {#if flows.length}<h3>Votre carte, d’après ces déclarations</h3><FlowMap flows={resolvedFlows({ ...activity, flows }, workspace)} onEdit={(id) => void edit(id)} />{/if}
  <p class="help">20 flux maximum par activité. Aucun flux n’est déduit automatiquement. Leur partage demande une sélection et une relecture explicites.</p>
</div>
