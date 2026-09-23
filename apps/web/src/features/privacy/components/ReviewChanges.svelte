<script lang="ts">
  import { CHANGE_AREAS, type ReviewChange, type ChangeArea } from "@rgpdesk/privacy-core";
  import Icon from "./Icon.svelte";
  let { changes, review, dirty = false }: { changes: ReviewChange[]; review?: { at: string; author: string; reason: string }; dirty?: boolean } = $props();
  let visible = $state(12);
  let groups = $derived((Object.keys(CHANGE_AREAS) as ChangeArea[]).filter((key) => changes.some((c) => c.area === key)));
</script>
<details class="review-trace" open={changes.length > 0}>
  <summary><Icon name="analysis" size={23} /><span><strong>Ce qui a changé depuis votre revue</strong><small>{!review ? "Une première position reste à consigner" : changes.length ? `${changes.length} différence(s) à examiner dans ${groups.length} rubrique(s)` : "Aucun changement détecté dans les faits et arguments comparés"}</small></span><span class="review-trace-sign" aria-hidden="true">+</span></summary>
  <div class="review-trace-body">
    {#if review}<div class="review-trace-position"><p class="eyebrow">Votre position conservée · {review.at.slice(0,10)}</p><p>{review.reason}</p><small>Auteur déclaré : {review.author}</small></div>{:else}<p>Consignez une revue humaine après votre examen. Les faits, arguments et références à cette date serviront de point de comparaison.</p>{/if}
    {#if dirty}<p class="notice">La comparaison inclut vos saisies non enregistrées. Enregistrez-les avant de conserver une nouvelle revue.</p>{/if}
    {#if changes.length}
      <ul class="review-trace-questions">{#each groups as area}<li><strong>{CHANGE_AREAS[area].label}</strong><span>{CHANGE_AREAS[area].question}</span></li>{/each}</ul>
      <div class="review-trace-ledger">{#each changes.slice(0, visible) as change (change.key)}<details class="review-trace-change"><summary><span><small>{change.subject}</small><strong>{change.label}</strong></span><span class="review-trace-kind">{change.kind === "added" ? "Ajout" : change.kind === "removed" ? "Retrait" : "Modification"}</span></summary><dl><div><dt>Lors de la revue</dt><dd>{change.before}</dd></div><div><dt>Aujourd’hui{dirty ? " · brouillon" : ""}</dt><dd>{change.after}</dd></div></dl></details>{/each}</div>
      {#if changes.length > visible}<button type="button" class="secondary" onclick={() => visible += 12}>Afficher les différences suivantes ({changes.length - visible})</button>{/if}
    {/if}
    <p class="help">Ces repères vous aident à reprendre l’examen. Ils ne décident pas de la portée juridique d’un changement. Votre position conservée reste intacte jusqu’à une nouvelle revue, qui s’y ajoute.</p>
  </div>
</details>
