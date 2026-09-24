<script lang="ts">
  import { tick } from 'svelte';
  import { addCollectionReply, applyCollectionReply, closeCollection, knowledgeText, RESPONSE_FIELDS, type ResponseField, type Workspace, type CollectionRequest } from '@rgpdesk/privacy-core';
  import type { RecoveryForm } from '../persistence/recovery';
  import {requestText} from '../request-brief';
  import RequestBrief from './RequestBrief.svelte';
  import Icon from './Icon.svelte';
  let {workspace,busy,onSave,onLeave}:{workspace:Workspace;busy:boolean;onSave:(w:Workspace)=>Promise<void>;onLeave:(fn:()=>void)=>void}=$props();
  let brief:RequestBrief|undefined=$state();
  let reviewedRequest=$state('');
  function requestCopy(r:CollectionRequest){return requestText(r.recipient,r.items.map(i=>({key:i.id,activityId:i.activityId,activity:i.activity,question:i.question,evidence:i.evidenceHint,owner:'',due:r.due??''})));}
  function downloadRequest(r:CollectionRequest){if(reviewedRequest!==r.id)return;const url=URL.createObjectURL(new Blob([requestCopy(r)],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');try{a.href=url;a.download='rgpdesk-demande.txt';a.click();}finally{URL.revokeObjectURL(url);}}
  let requestId=$state(''),itemId=$state(''),replyId=$state(''),mode=$state<'reply'|'apply'|'close'>('reply'),text=$state(''),author=$state(''),documentIds=$state<string[]>([]),field=$state<ResponseField|''>(''),confirmed=$state(false),error=$state('');
  let formHeading:HTMLHeadingElement|undefined=$state();
  const labels:Record<ResponseField,string>={dataSubjects:'Personnes concernées',dataCategories:'Catégories de données',recipients:'Destinataires',securityMeasures:'Mesures de sécurité',transfers:'Transferts déclarés'};
  let request=$derived(workspace.collections?.find(r=>r.id===requestId));
  let item=$derived(request?.items.find(i=>i.id===itemId));
  let reply=$derived(item?.replies.find(r=>r.id===replyId));
  let activity=$derived(workspace.activities.find(a=>a.id===item?.activityId));
  export function getRecovery():RecoveryForm|null{return requestId?{kind:'request-reply',requestId,itemId,replyId,mode,text,author,documentIds:$state.snapshot(documentIds),field}:brief?.getRecovery()??null;}
  export async function restoreRecovery(f:RecoveryForm){if(f.kind==='request-prepare'){requestId='';await tick();brief?.restoreRecovery(f);return;}if(f.kind!=='request-reply')return;requestId=f.requestId;itemId=f.itemId;replyId=f.replyId;mode=f.mode;text=f.text;author=f.author;documentIds=f.documentIds;field=RESPONSE_FIELDS.includes(f.field as ResponseField)?f.field as ResponseField:'';confirmed=false;}
  function start(r:string,i:string,next:typeof mode,answer=''){onLeave(async()=>{requestId=r;itemId=i;replyId=answer;mode=next;text='';author='';documentIds=[];field='';confirmed=false;error='';await tick();formHeading?.focus();formHeading?.scrollIntoView({block:'center'});});}
  async function save(){
    error='';try{
      const at=new Date().toISOString();
      if(mode==='reply')await onSave(addCollectionReply(workspace,requestId,itemId,{id:crypto.randomUUID(),author:author.trim(),text:text.trim(),documentIds:$state.snapshot(documentIds)},workspace.revision,at));
      else if(mode==='close'&&confirmed)await onSave(closeCollection(workspace,requestId,author.trim(),text.trim(),workspace.revision,at));
      else if(mode==='apply'&&confirmed&&field&&activity)await onSave(applyCollectionReply(workspace,requestId,itemId,replyId,field,activity[field],author.trim(),workspace.revision,at));
    }catch{error='Enregistrement refusé. Vérifiez les champs, la version du dossier et les limites de la demande.';}
  }
</script>
<section class="panel collection-requests">
  <div class="section-heading"><div><p class="eyebrow">Le fil de vos échanges</p><h2>Une demande. Des réponses retrouvées.</h2></div><Icon name="interview" size={32}/></div>
  <p>Préparez les questions, gardez les réponses et choisissez les faits à reprendre dans le registre. Rien n’est envoyé depuis RGPDESK.</p>
  {#if !requestId}<RequestBrief bind:this={brief} {workspace} {busy} {onSave}/>{/if}
  {#if !(workspace.collections?.length)}<p class="empty">Votre première demande apparaîtra ici après « Conserver le suivi dans le coffre ».</p>{/if}
  {#each workspace.collections??[] as r}
    <details class="request-record"><summary><Icon name="interview"/><span><strong>{r.recipient}</strong><small>{r.items.length} question{r.items.length>1?'s':''} · {r.items.filter(i=>i.replies.length).length} avec réponse · {r.due?`échéance choisie : ${r.due}`:'sans échéance'} · {r.closed?'Clôture déclarée':'Suivi ouvert'}</small></span></summary>
      <div class="request-body"><p class="help">Créée le {r.createdAt.slice(0,10)}. L’enregistrement de la demande ne prouve ni son envoi ni sa réception.</p>
      <details class="saved-request-copy"><summary>Relire le texte à transmettre</summary><pre class="request-text">{requestCopy(r)}</pre><label class="check"><input type="checkbox" checked={reviewedRequest===r.id} onchange={e=>reviewedRequest=e.currentTarget.checked?r.id:''}/>J’ai relu cette demande conservée et son destinataire avant de la télécharger en clair.</label><button class="secondary" disabled={busy||reviewedRequest!==r.id} onclick={()=>downloadRequest(r)}>Télécharger cette demande</button></details>
      {#each r.items as i,index}<article class="request-question"><p class="eyebrow">{String(index+1).padStart(2,'0')} / {i.activity}</p><h3>{i.question}</h3>{#if i.evidenceHint}<p>À retrouver : {i.evidenceHint}</p>{/if}
        {#if !i.replies.length}<p class="tag">Réponse à recueillir</p>{/if}
        {#each i.replies as answer}<div class="subpanel"><p class="help">Réponse consignée le {answer.receivedAt.slice(0,10)} · auteur déclaré : {answer.author}</p><p class="answer-text">{answer.text}</p>
          {#if answer.documentIds.length}<ul>{#each answer.documentIds as id}<li>{workspace.documents.find(d=>d.id===id)?.title}</li>{/each}</ul>{/if}
          {#if answer.application}<p class="notice">Reprise dans « {labels[answer.application.field]} » par {answer.application.reviewer}, révision {answer.application.revision}. Cette trace décrit la reprise à cette date.</p>{:else if !r.closed&&i.activityId}<button class="secondary" disabled={busy} onclick={()=>start(r.id,i.id,'apply',answer.id)}>Relire pour compléter la fiche</button>{/if}
        </div>{/each}
        {#if !r.closed}<button class="secondary" disabled={busy||i.replies.length>=8} onclick={()=>start(r.id,i.id,'reply')}>Consigner une réponse à la question {index+1}</button>{/if}
      </article>{/each}
      {#if r.closed}<p class="notice">Clôture déclarée par {r.closed.author} : {r.closed.reason}</p>{:else}<button class="text-button" disabled={busy} onclick={()=>start(r.id,'','close')}>Clôturer cette demande</button>{/if}</div>
    </details>
  {/each}
  {#if requestId}<form class="subpanel collection-form" onsubmit={e=>{e.preventDefault();void save();}} oninput={()=>confirmed=false}><fieldset disabled={busy||!request||!!request.closed}>
    <h3 tabindex="-1" data-draft-heading bind:this={formHeading}>{mode==='reply'?'Consigner une réponse':mode==='apply'?'Relire avant de reprendre un fait':'Clôturer le suivi'}</h3><p>{request?.recipient} · {item?.question??'Demande complète'}</p>
    {#if mode==='apply'}<p class="answer-text">{reply?.text}</p><label class="field">Champ factuel à compléter<select aria-label="Champ factuel à compléter" required bind:value={field} onchange={()=>confirmed=false}><option value="">Choisir explicitement</option>{#each RESPONSE_FIELDS as f}<option value={f}>{labels[f]}</option>{/each}</select></label>
      {#if field&&activity}<div class="grid-two"><div><h4>Avant</h4><p>{knowledgeText(activity[field])||'À documenter'}</p></div><div><h4>Après</h4><p>{reply?.text}</p></div></div>{/if}<p class="help">La réponse remplacera ce champ, pour {activity?.title}. Les autres champs, les avis et les conclusions restent à examiner. Aucune base légale ni durée n’est choisie ici.</p>
    {:else}<label class="field">{mode==='reply'?'Réponse reçue à consigner':'Motif et points restant ouverts'}<textarea required maxlength="4000" bind:value={text}></textarea></label>{/if}
    <label class="field">{mode==='reply'?'Auteur déclaré de la réponse':'Auteur déclaré de la relecture'}<input required maxlength="160" bind:value={author}/></label>
    {#if mode==='reply'}<details><summary>Références déjà disponibles dans ce coffre</summary><fieldset class="choices"><legend>Pièces associées à la réponse (20 maximum)</legend>{#each workspace.documents as d}<label><input type="checkbox" checked={documentIds.includes(d.id)} disabled={!documentIds.includes(d.id)&&documentIds.length>=20} onchange={e=>documentIds=e.currentTarget.checked?[...documentIds,d.id]:documentIds.filter(id=>id!==d.id)}/>{d.title}</label>{/each}</fieldset></details><p class="help">La réponse est une déclaration, pas une validation. Elle ne modifie pas la fiche tant que vous ne l’avez pas reprise explicitement.</p>
    {:else}<label class="check"><input type="checkbox" checked={confirmed} onchange={e=>confirmed=e.currentTarget.checked}/>{mode==='apply'?'J’ai relu le champ avant et après, et je confirme cette reprise.':'Je conserve ce motif de clôture, sans présumer que les points ouverts sont résolus.'}</label>{/if}
    {#if error}<p role="alert">{error}</p>{/if}<div class="actions"><button disabled={mode!=='reply'&&!confirmed||mode==='apply'&&(!field||!reply||!!reply.application)}>{mode==='reply'?'Conserver la réponse':mode==='apply'?'Reprendre ce fait dans la fiche':'Conserver la clôture'}</button><button class="secondary" type="button" onclick={()=>onLeave(()=>requestId='')}>Fermer cette saisie</button></div>
  </fieldset></form>{/if}
</section>
<style>
.request-record{border:1px solid #b5c5d2;border-radius:6px 20px 6px 6px;margin:1.2rem 0;background:linear-gradient(125deg,#e6eef4,#f7f9fa)}summary{display:flex;gap:1rem;align-items:center;padding:1.25rem;cursor:pointer}summary span{flex:1}summary small{display:block;font-size:.9375rem;margin-top:.4rem}.request-body{padding:0 1.3rem 1.3rem}.request-question{padding:1.2rem 0;border-top:1px solid #bdccd6}.answer-text{white-space:pre-wrap;overflow-wrap:anywhere}.collection-form{border-left:3px solid #526e86}.request-question h3{font-size:1.1rem}
</style>
