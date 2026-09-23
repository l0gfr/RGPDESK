<script lang="ts">
  import { METHOD_HINTS, METHOD_GUIDES, type MethodHintKind } from "../method-hints";
  import Icon from "./Icon.svelte";
  let { kind, questionId }: { kind: MethodHintKind; questionId: string } = $props();
  let hint = $derived(METHOD_HINTS[kind][questionId]);
  let guide = $derived(METHOD_GUIDES[kind]);
</script>
{#if hint}
<details class="method-hints">
  <summary><Icon name={hint.icon} /><span>Points à examiner</span><Icon name="chevron" size={16} /></summary>
  <div>
    <ul>{#each hint.points as point}<li>{point}</li>{/each}</ul>
    <p class="help">Complétez les notes ci-dessous avec les seuls éléments utiles. Ces repères n’ajoutent aucun champ ni aucune conclusion.</p>
    <p class="help">Adaptation RGPDESK, 23 septembre 2026, d’Estelle De Marco, <cite>{guide.title}</cite>, version {guide.version}, onglet « {guide.sheet} », {hint.guide}. <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a>. Questions reformulées ; exemples exclus.</p>
    <p class="help">{hint.reference}. {#if kind === "rgpd"}<a href="https://eur-lex.europa.eu/eli/reg/2016/679/oj?locale=fr" target="_blank" rel="noopener noreferrer">Consulter le RGPD</a>{:else}<a href="https://www.inthemis.fr/ressources/supports/Esiea_Ethique_202601_v2.12.pdf#page=74" target="_blank" rel="noopener noreferrer">Support public complémentaire de l’autrice, p. 74–90</a>{/if}</p>
  </div>
</details>
{/if}
