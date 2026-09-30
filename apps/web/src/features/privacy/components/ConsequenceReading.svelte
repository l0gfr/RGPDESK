<script lang="ts">
  import { CONSEQUENCE_PROMPTS, CNIL_CONSEQUENCES_SOURCE } from "../rights-risk-method";
  import Icon from "./Icon.svelte";
</script>

<details class="consequence-reading">
  <summary><Icon name="impact" size={26}/><span>Explorer les conséquences pour les personnes<small>Trois familles pour vérifier ce que votre scénario pourrait entraîner</small></span><Icon name="plus"/></summary>
  <div class="consequence-body">
    <p>Après le droit et la situation redoutée, décrivez les conséquences concrètes pour les personnes. Une même situation peut avoir plusieurs types de conséquences.</p>
    <div class="consequence-grid">
      {#each CONSEQUENCE_PROMPTS as item}
        <article><Icon name={item.icon} size={28}/><h4>{item.title}</h4><p>{item.question}</p></article>
      {/each}
    </div>
    <p class="help">Repères reformulés à partir de <a href={CNIL_CONSEQUENCES_SOURCE.source} target="_blank" rel="noopener noreferrer">{CNIL_CONSEQUENCES_SOURCE.reference}</a>. Ce document de méthode fournit des exemples ; il ne détermine ni les conséquences de votre cas ni leur gravité.</p>
    <p class="help">Conservez votre raisonnement dans « Conséquences concrètes pour les personnes » et « Justification de l’appréciation initiale » du scénario. Cette aide ne crée aucune saisie supplémentaire.</p>
  </div>
</details>

<style>
  .consequence-reading { margin:1rem 0 1.5rem; border:1px solid #bdccd6; border-radius:6px 20px 6px 6px; background:linear-gradient(120deg,#f6f2eb,#eef3f6); }
  .consequence-reading > summary { display:flex; align-items:center; gap:1rem; padding:1.25rem; color:#293e50; cursor:pointer; }
  .consequence-reading > summary > span { flex:1; font-weight:650; }
  .consequence-reading small { display:block; margin-top:.3rem; font-size:.95rem; font-weight:400; }
  .consequence-body { padding:0 clamp(1rem,3vw,1.75rem) 1.5rem; }
  .consequence-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:1rem; }
  .consequence-grid article { min-width:0; padding:1.25rem; border:1px solid #cad6dd; border-radius:4px 16px 4px 4px; background:#ffffffad; color:#293e50; }
  .consequence-grid h4 { font-size:1.1rem; margin:.75rem 0; }
  .consequence-grid p { font-size:1rem; line-height:1.65; }
  @media(max-width:1000px) { .consequence-grid { grid-template-columns:1fr; } }
</style>
