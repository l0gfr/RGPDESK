<script lang="ts">
 import {activityFacts,purposeRetention,knowledgeText,resolvedFlows,type PiaContext} from '@rgpdesk/privacy-core';
 import FlowMap from './FlowMap.svelte';
 import DataGroupsTable from './DataGroupsTable.svelte';
 let {context,version,preview=false}:{context:PiaContext;version:number;preview?:boolean}=$props();
 let facts=$derived(activityFacts(context.activity,context));
 const text=knowledgeText;
</script>
<article class="corrective-snapshot" aria-label={preview?"Aperçu après application":`Description conservée v${version}`}>
 <header><p class="eyebrow">{preview?"Aperçu après application":"Description conservée"} · v{version}</p><h4>{context.activity.title}</h4><p>{preview?"Aucun fait n’est encore modifié. Relisez notamment les descriptions générales et les données de chaque groupe.":"Les faits de cette version restent dans votre coffre. Les références internes ne sont pas incluses automatiquement dans les exports."}</p></header>
 <dl class="reader-facts"><div><dt>Personnes</dt><dd>{text(facts.dataSubjects)||'À documenter'}</dd></div><div><dt>Données</dt><dd>{text(facts.dataCategories)||'À documenter'}</dd></div><div><dt>Destinataires</dt><dd>{text(facts.recipients)||'À documenter'}</dd></div><div><dt>Mesures de sécurité</dt><dd>{text(context.activity.securityMeasures)||'À documenter'}</dd></div><div><dt>Transferts</dt><dd>{text(context.activity.transfers)||'À documenter'}</dd></div></dl>
 {#if context.activity.role==='controller'}{#each context.activity.purposes as p}<section><h5>{text(p.description)||'Sous-finalité à préciser'}</h5><dl class="reader-facts"><div><dt>Fondement déclaré</dt><dd>{text(p.legalBasis)||'À examiner'}</dd></div><div><dt>Conservation</dt><dd>{text(purposeRetention(context.activity,p).period)||'À documenter'}</dd></div><div><dt>Point de départ</dt><dd>{text(purposeRetention(context.activity,p).trigger)||'À documenter'}</dd></div></dl></section>{/each}{:else}<p>Opérations : {text(context.activity.operations)||'À documenter'}</p>{/if}
 <DataGroupsTable activity={context.activity} inventory={context}/>
 <FlowMap activity={context.activity} inventory={context} flows={resolvedFlows(context.activity,context)}/>
</article>
