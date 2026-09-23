<script lang="ts">
  import { REFERENCE_CASES, REFERENCE_SOURCE } from "../reference-cases";
  let { onChoose, busy }: { onChoose: (id: string) => void; busy: boolean } = $props();
  let selected = $state<string>(REFERENCE_CASES[0].id);
  let example = $derived(REFERENCE_CASES.find((c) => c.id === selected)!);
</script>
<details class="mission-directory"><summary>Dix situations métier à explorer</summary>
  <p>PME et associations : des faits fictifs, des informations manquantes et des questions de relecture. Choisissez une situation pour essayer le parcours, du registre aux analyses.</p>
  <label class="field">Choisir un cas de référence<select aria-label="Choisir un cas de référence" bind:value={selected}>{#each REFERENCE_CASES as c}<option value={c.id}>{c.sector} · {c.title}</option>{/each}</select></label>
  <h3>{example.title}</h3><p>{example.facts}</p><div class="notice"><strong>À éprouver dans ce parcours</strong><p>{example.review}</p></div>
  <p class="help">Les faits sont inventés. Repères juridiques à examiner : <a href={REFERENCE_SOURCE} target="_blank" rel="noopener noreferrer">RGPD, {example.sourceLabel}</a>. Édition du 23 septembre 2026. Aucune décision juridique n’est préremplie.</p>
  <button class="secondary" disabled={busy} onclick={() => onChoose(selected)}>Ouvrir ce cas fictif</button><p class="help">Remplace uniquement la visite en cours. Les essais de cette démo sont abandonnés ; vos coffres personnels restent intacts.</p>
</details>
