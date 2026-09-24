<script lang="ts">
  import { citeEvidence, reviewTargets, type Workspace } from '@rgpdesk/privacy-core';
  import type { RecoveryForm } from '../persistence/recovery';
  import Icon from './Icon.svelte';
  let {workspace,documentId,busy,onSave,onClose}:{workspace:Workspace;documentId:string;busy:boolean;onSave:(w:Workspace)=>Promise<boolean>;onClose:()=>void}=$props();
  let keys=$state<string[]>([]),locator=$state(''),meaning=$state(''),filter=$state(''),confirmed=$state(false),error=$state('');
  let doc=$derived(workspace.documents.find(d=>d.id===documentId));
  let targets=$derived(reviewTargets(workspace).filter(t=>(!t.key.startsWith('document/')||t.key.startsWith(`document/${documentId}/`))&&(!filter||t.activityIds.includes(filter))));
  export function getRecovery():RecoveryForm|null{return keys.length||locator||meaning?{kind:'evidence-links',documentId,keys:$state.snapshot(keys),locator,meaning}:null;}
  export function restoreRecovery(f:RecoveryForm){if(f.kind!=='evidence-links')return;keys=f.keys;locator=f.locator;meaning=f.meaning;confirmed=false;}
  async function save(){if(!confirmed)return;try{await onSave(citeEvidence(workspace,documentId,$state.snapshot(keys),locator,meaning,workspace.revision,new Date().toISOString()));}catch{error='Liens non enregistrés. Vérifiez le passage, les questions choisies et les citations déjà présentes.';}}
</script>
<form class="subpanel evidence-linker" onsubmit={e=>{e.preventDefault();void save();}} oninput={()=>confirmed=false}><fieldset disabled={busy||!doc}>
  <h3 data-draft-heading><Icon name="evidence"/> Une référence, plusieurs arguments</h3><p><strong>{doc?.documentCode} · {doc?.title}</strong> · version {doc?.version||'à préciser'}</p>
  <p>Choisissez les questions auxquelles ce passage répond. Les activités associées seront reliées à la même référence, sans recopier la pièce ni changer vos appréciations.</p>
  <label class="field">Filtrer les questions par activité<select aria-label="Filtrer les questions par activité" bind:value={filter}><option value="">Toutes les activités</option>{#each workspace.activities as a}<option value={a.id}>{a.title}</option>{/each}</select></label>
  <fieldset class="choices"><legend>Questions à relier (20 maximum)</legend>{#each targets as t}<label><input type="checkbox" checked={keys.includes(t.key)} disabled={!keys.includes(t.key)&&keys.length>=20} onchange={e=>{confirmed=false;keys=e.currentTarget.checked?[...keys,t.key]:keys.filter(k=>k!==t.key);}}/>{t.title}</label>{/each}</fieldset>
  <label class="field">Passage à retrouver<input required maxlength="1000" bind:value={locator} placeholder="Page, clause ou section"/></label>
  <label class="field">Ce que ce passage permet d’établir<textarea required maxlength="3000" bind:value={meaning}></textarea></label>
  <p class="help">Le passage et son sens seront identiques dans ces {keys.length} questions. Choisissez uniquement les arguments auxquels ils s’appliquent. Les anciennes revues ne sont pas réécrites.</p>
  <label class="check"><input type="checkbox" checked={confirmed} onchange={e=>confirmed=e.currentTarget.checked}/>J’ai relu ces liens et la portée de ce passage pour chaque question.</label>
  {#if error}<p role="alert">{error}</p>{/if}<div class="actions"><button disabled={!confirmed||!keys.length||!doc?.version.trim()}>Relier cette preuve aux questions</button><button class="secondary" type="button" onclick={onClose}>Fermer les liens</button></div>
</fieldset></form>
