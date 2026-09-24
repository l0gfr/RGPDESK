<script lang="ts">
  import { registerProgress, PROGRESS_STATES, PROGRESS_NOTE, type Activity, type ProgressState } from "@rgpdesk/privacy-core";
  import Icon from "./Icon.svelte";
  import "../assets/register-progress.css";
  let { activities, compact = false, onComplete }: {activities:Activity[]; compact?:boolean; onComplete?:(step:number)=>void} = $props();
  let progress = $derived(registerProgress(activities));
  const states:ProgressState[] = ["documented", "partial", "missing"];
</script>
<section class="document-progress" class:dp-compact={compact} aria-label={compact ? "Repères de la fiche" : "Avancement documentaire"}>
  {#if !compact}
    <p class="dp-kicker">Les faits de votre registre</p><h2>Où en est la documentation ?</h2>
    <p class="dp-subtitle">{activities.length} activités enregistrées, y compris les activités archivées. Six rubriques par fiche, calculées à partir des faits saisis.</p>
    {#if activities.length}<div class="dp-totals">{#each states as state}<div class="dp-total dp-{state}"><span class="dp-symbol" aria-hidden="true">{PROGRESS_STATES[state].symbol}</span><strong>{progress.counts[state]}</strong><span>{PROGRESS_STATES[state].plural}</span></div>{/each}</div>{:else}<p class="dp-subtitle">Votre avancement apparaîtra avec votre première activité.</p>{/if}
    <details><summary>Comment lire ces repères ?</summary><p class="dp-note">{PROGRESS_NOTE} « Protections » regroupe les mesures de sécurité et les transferts déclarés. « Conservation » regroupe la durée ou le critère et son point de départ pour chaque finalité.</p></details>
  {:else}
    {#each progress.rows as row}<p class="dp-caption">{row.checkpoints.filter(p=>p.state==='documented').length} / 6 rubriques renseignées</p><ul class="dp-points">{#each row.checkpoints as point}<li class="dp-point dp-{point.state}"><span aria-hidden="true"><Icon name={point.icon} size={20}/></span><div>{#if onComplete && point.state!=='documented'}<strong><button class="text-button dp-link" onclick={()=>onComplete?.(point.step)}>{point.label}</button></strong>{:else}<strong>{point.label}</strong>{/if}<small>{PROGRESS_STATES[point.state].symbol} {PROGRESS_STATES[point.state].label} · {point.documented}/{point.total}</small></div></li>{/each}</ul>{/each}
  {/if}
</section>
