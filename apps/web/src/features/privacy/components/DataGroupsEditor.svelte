<script lang="ts">
  import { createDataGroup, dataGroupOpenPoints, groupPurposeIds, knowledgeText, MINIMISATION_LABELS, type Activity, type Workspace } from "@rgpdesk/privacy-core";
  import KnowledgeField from "./KnowledgeField.svelte";
  import FlowEditor from "./FlowEditor.svelte";
  import Icon from "./Icon.svelte";
  let { activity = $bindable(), workspace }: { activity: Activity; workspace: Workspace } = $props();
  let expanded = $state<Record<string, boolean>>({});
  function add() {
    if ((activity.dataGroups?.length ?? 0) >= 20) return;
    const group = createDataGroup(crypto.randomUUID(), Math.max(0, ...(activity.dataGroups ?? []).map(g => g.code)) + 1);
    activity.dataGroups = [...(activity.dataGroups ?? []), group]; expanded[group.id] = true;
  }
</script>
<section class="data-groups" aria-label="Groupes de données et parcours">
  <header class="section-heading"><div><p class="eyebrow">Données · usages · circulation</p><h3>Un groupe, son parcours, ses limites.</h3></div><Icon name="flows" size={32} /></header>
  <p>Regroupez les catégories qui suivent les mêmes règles. D1, D2… sont vos repères dans ce seul ensemble de traitement. Reliez chaque groupe aux sous-finalités concernées, puis décrivez son parcours ici.</p>
  <p class="help">Un même groupe peut suivre plusieurs parcours, avec des usages et destinataires distincts. Séparez les catégories soumises à des règles de conservation différentes. Les champs vides restent des questions ouvertes. Ne saisissez aucune donnée individuelle.</p>
  {#each activity.dataGroups ?? [] as group (group.id)}
    {@const points = dataGroupOpenPoints(activity, group)}
    <details class="data-group-card" bind:open={expanded[group.id]}>
      <summary><span class="data-group-code">D{group.code}</span><span><strong>{knowledgeText(group.data).slice(0,110) || "Groupe à décrire"}</strong><small>{points.length ? `${points.length} point${points.length > 1 ? "s" : ""} de documentation à examiner` : "Rubriques renseignées, à apprécier"}</small></span><Icon name="plus" size={18}/></summary>
      <div class="data-group-body">
        <div class="grid-two"><KnowledgeField label={`D${group.code} · Catégories de données`} bind:value={group.data} reuse="data" hint="Ex. coordonnées professionnelles ; précisez les champs réellement utilisés." /><KnowledgeField label={`D${group.code} · Personnes concernées`} bind:value={group.people} reuse="people" /></div>
        {#if activity.role === "controller"}<fieldset class="choices"><legend>D{group.code} · Sous-finalités concernées</legend>{#each activity.purposes as p,i}<label><input type="checkbox" checked={groupPurposeIds(activity,group).includes(p.id)} disabled={!group.purposeIds.includes(p.id) && groupPurposeIds(activity,group).includes(p.id)} onchange={e => group.purposeIds = e.currentTarget.checked ? [...group.purposeIds,p.id] : group.purposeIds.filter(id => id !== p.id)} />{knowledgeText(p.description) || `Sous-finalité ${i+1} à décrire`}</label>{/each}{#if !activity.purposes.length}<p>Décrivez d’abord vos sous-finalités à l’étape « Les objectifs ».</p>{/if}</fieldset><p class="help">Les sous-finalités choisies dans les parcours sont reprises ici. Pour les modifier, ouvrez le parcours concerné.</p>{/if}
        <FlowEditor bind:activity {workspace} bind:flows={activity.flows} groupId={group.id} compact />
        <details class="group-examination"><summary><Icon name="clock" size={20}/><span>Conservation et effacement<small>Durée, point de départ et mise en œuvre</small></span></summary><div class="data-group-body"><div class="grid-two"><KnowledgeField label={`D${group.code} · Durée ou critère de conservation`} bind:value={group.retention.period} reuse="period" hint="Distinguez l’usage courant et l’archivage si nécessaire. Aucun délai n’est choisi par l’outil."/><KnowledgeField label={`D${group.code} · Événement de départ`} bind:value={group.retention.trigger} reuse="trigger"/></div><KnowledgeField label={`D${group.code} · Effacement et contrôle`} bind:value={group.retention.deletion} reuse="deletion" hint="Qui efface, sur quels supports et copies, à quel moment et avec quelle vérification ?"/></div></details>
        <details class="group-examination"><summary><Icon name="shield" size={20}/><span>Minimisation et garanties<small>Examiner chaque composante, pas seulement les données</small></span></summary><div class="data-group-body">{#each Object.entries(MINIMISATION_LABELS) as [key,label]}<KnowledgeField label={`D${group.code} · ${label}`} bind:value={group.minimisation[key as keyof typeof MINIMISATION_LABELS]} hint="Décrivez ce qui est utile à la sous-finalité, les réductions envisageables et la raison du choix. Une réponse saisie ne vaut pas validation."/>{/each}<KnowledgeField label={`D${group.code} · Garanties et vérification`} bind:value={group.guarantees} hint="Mesures concrètes, responsable, référence de preuve et façon de vérifier leur mise en œuvre. Distinguez prévu et effectif."/></div></details>
        {#if points.length}<details class="group-examination"><summary>Les points encore à examiner</summary><ul>{#each points as point}<li>{point}</li>{/each}</ul></details>{/if}
      </div>
    </details>
  {/each}
  <button type="button" class="secondary" disabled={(activity.dataGroups?.length ?? 0)>=20} onclick={add}><Icon name="plus"/>Ajouter un groupe de données</button>
  <p class="help">20 groupes maximum. La cartographie et les tableaux de l’AIPD reprennent ces mêmes déclarations, sans ressaisie. Référence : <a href="https://eur-lex.europa.eu/eli/reg/2016/679/oj?locale=fr" target="_blank" rel="noopener noreferrer">RGPD, articles 5, 25 et 30</a>.</p>
</section>
