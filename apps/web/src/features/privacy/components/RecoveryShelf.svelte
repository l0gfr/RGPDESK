<script lang="ts">
  import { RECOVERY_LABELS, recoveryTitle, type RecoveryDraft } from "../persistence/recovery";
  import Icon from "./Icon.svelte";
  let {drafts,revision,busy,onResume,onDiscard}:{drafts:RecoveryDraft[];revision:number;busy:boolean;onResume:(d:RecoveryDraft)=>void;onDiscard:(d:RecoveryDraft)=>void}=$props();
  let removing=$state('');
  // Stale content remains inspectable, but can never be applied to a newer dossier.
  function texts(value:unknown):string[]{
    if(typeof value==='string')return value.trim()&&!/^[a-f0-9-]{36}$/.test(value)?[value]:[];
    if(!value||typeof value!=='object')return [];
    if(Array.isArray(value))return value.flatMap(texts);
    return Object.entries(value).filter(([k])=>!['id','workspaceId','methodVersion','kind','state','status','reviews','events','fingerprint'].includes(k)).flatMap(([,v])=>texts(v));
  }
</script>
{#if drafts.length}<aside class="panel recovery-shelf" aria-label="Saisies à reprendre"><div class="section-heading"><div><p class="eyebrow">Votre travail interrompu</p><h2><Icon name="history"/> {drafts.length} brouillon(s) à retrouver</h2></div></div><p>Ces copies chiffrées n’ont modifié ni le dossier enregistré ni ses décisions. Reprenez une saisie, puis enregistrez-la lorsque vous êtes prêt.</p><ul class="records">{#each drafts as d}<li><div class="grow"><strong>{recoveryTitle(d.form)||RECOVERY_LABELS[d.form.kind]}</strong><p>{RECOVERY_LABELS[d.form.kind]} · copie du {d.updatedAt.slice(0,16).replace('T',' ')} UTC</p>{#if d.revision!==revision}<p class="notice">Le dossier a changé depuis cette saisie. La reprise automatique est bloquée pour préserver le travail enregistré.</p><details><summary>Relire les textes de cette ancienne saisie</summary><p class="help">Textes du brouillon uniquement, sans application au dossier actuel. Rapprochez-les des informations enregistrées avant toute reprise manuelle.</p>{#each texts(d.form) as text}<p class="recovery-text">{text}</p>{/each}</details>{/if}</div><div class="actions"><button disabled={busy||d.revision!==revision} onclick={()=>onResume(d)}>Reprendre ce brouillon</button><button class="text-button" disabled={busy} onclick={()=>removing=d.id}>Abandonner cette copie</button></div>{#if removing===d.id}<div><p>Abandonner définitivement cette saisie ? Le dossier enregistré sera conservé.</p><button class="secondary" disabled={busy} onclick={()=>{removing='';onDiscard(d);}}>Confirmer l’abandon du brouillon</button><button class="text-button" onclick={()=>removing=''}>Conserver cette copie</button></div>{/if}</li>{/each}</ul></aside>{/if}
