<script lang="ts">
  import {tick} from "svelte";
  import { createPurpose, type Activity, type Workspace } from "@rgpdesk/privacy-core";
  import KnowledgeField from "./KnowledgeField.svelte";
  import FlowEditor from "./FlowEditor.svelte";
  let { draft = $bindable(), documentIds = $bindable(), step = $bindable(0), workspace }: {draft: Activity; documentIds: string[]; step: number; workspace: Workspace} = $props();
  const labels=["L’usage", "Les personnes et données", "Les outils et acteurs", "Le trajet", "Les justificatifs", "Les réponses attendues"];
  let heading: HTMLHeadingElement | undefined = $state();
  async function go(i: number) { step=i; await tick(); heading?.focus(); }
</script>
<nav class="editor-steps" aria-label="Étapes de l’entretien">{#each labels as label,i}<button type="button" class="secondary" aria-current={step===i ? "step" : undefined} onclick={()=>void go(i)}><span>{i+1}</span>{label}</button>{/each}</nav>
<div class="step-heading"><p class="eyebrow">Entretien · {step+1} / 6</p><h3 tabindex="-1" bind:this={heading}>{labels[step]}</h3><p>Les réponses alimentent directement votre fiche. Une réponse inconnue peut attendre : rien n’est déduit à votre place.</p></div>
{#if step===0}
  <label class="field">Comment appelez-vous cette activité ?<input required maxlength="160" bind:value={draft.title} /></label>
  {#if draft.role==='controller'}{#each draft.purposes as purpose,i}<KnowledgeField label={`À quoi servent ces données ? Objectif ${i+1}`} bind:value={purpose.description} />{/each}<button type="button" class="secondary" disabled={draft.purposes.length>=20} onclick={()=>{if(draft.role==='controller')draft.purposes=[...draft.purposes,createPurpose(crypto.randomUUID())];}}>Ajouter un objectif</button>{:else}<KnowledgeField label="Que faites-vous pour le compte du client ?" bind:value={draft.operations} />{/if}
{:else if step===1}
  <KnowledgeField label="De quelles personnes parle-t-on ?" bind:value={draft.dataSubjects} hint="Des catégories de personnes, sans noms individuels." />
  <KnowledgeField label="Quelles informations utilisez-vous ?" bind:value={draft.dataCategories} hint="Des catégories de données, jamais les dossiers réels des personnes." />
  <KnowledgeField label="Qui reçoit ou consulte ces informations ?" bind:value={draft.recipients} />
{:else if step===2}
  <p>Retrouvez les outils et organismes déjà recensés. Leur rôle juridique se documente dans la fiche complète.</p>
  <fieldset class="choices"><legend>Outils utilisés</legend>{#each workspace.systems as item}<label><input type="checkbox" checked={draft.systemIds.includes(item.id)} onchange={e=>draft.systemIds=e.currentTarget.checked?[...draft.systemIds,item.id]:draft.systemIds.filter(id=>id!==item.id)} />{item.name}</label>{/each}{#if !workspace.systems.length}<p>Aucun outil recensé. Notez la question à l’étape 6, puis ajoutez l’outil dans Systèmes après enregistrement.</p>{/if}</fieldset>
  <fieldset class="choices"><legend>Intervenants liés, sans préjuger de leur rôle</legend>{#each workspace.parties as item}<label><input type="checkbox" checked={draft.participantIds.includes(item.id)} onchange={e=>draft.participantIds=e.currentTarget.checked?[...draft.participantIds,item.id]:draft.participantIds.filter(id=>id!==item.id)} />{item.name}</label>{/each}{#if !workspace.parties.length}<p>Aucun organisme recensé. Vous pourrez l’ajouter dans Intervenants.</p>{/if}</fieldset>
{:else if step===3}<FlowEditor activity={draft} {workspace} bind:flows={draft.flows} compact />
{:else if step===4}
  <p>Quels documents permettront de vérifier ces déclarations ? Reliez une référence existante. Les fichiers originaux restent dans votre organisation.</p>
  <fieldset class="choices"><legend>Références utiles à cet entretien</legend>{#each workspace.documents as doc}<label><input type="checkbox" checked={documentIds.includes(doc.id)} onchange={e=>documentIds=e.currentTarget.checked?[...documentIds,doc.id]:documentIds.filter(id=>id!==doc.id)} />{doc.title} · {doc.version || "Version à préciser"}</label>{/each}{#if !workspace.documents.length}<p>Aucune référence recensée. Enregistrez la fiche, puis ajoutez une référence dans Documents.</p>{/if}</fieldset>
{:else}
  <p>Gardez uniquement les questions sans réponse. Quand vous obtenez une réponse, complétez le champ concerné et retirez la question de cette liste.</p>
  {#each draft.interviewQuestions ?? [] as question,i}<div class="interview-question"><label class="field">À demander au métier · {i+1}<input required maxlength="500" value={question} oninput={e=>{if(draft.interviewQuestions)draft.interviewQuestions[i]=e.currentTarget.value;}} /></label><button type="button" class="secondary" onclick={()=>draft.interviewQuestions=draft.interviewQuestions?.filter((_,n)=>n!==i)}>Retirer la question {i+1}</button></div>{/each}
  <button type="button" class="secondary" disabled={(draft.interviewQuestions?.length ?? 0)>=12} onclick={()=>draft.interviewQuestions=[...(draft.interviewQuestions ?? []),""]}>Ajouter une question à poser</button>
  <aside class="notice"><strong>Votre entretien alimente le registre, sans le terminer à votre place.</strong><p>Les fondements, durées, rôles et mesures se travaillent ensuite dans la fiche et l’analyse. Enregistrez pour retrouver ces réponses et cette étape à votre prochaine séance.</p></aside>
{/if}
<div class="step-navigation">{#if step>0}<button type="button" class="secondary" onclick={()=>void go(step-1)}>Question précédente</button>{/if}{#if step<5}<button type="button" onclick={()=>void go(step+1)}>Continuer l’entretien</button>{/if}</div>
