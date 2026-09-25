<script lang="ts">
  import { RIGHTS_PROMPTS, RIGHTS_CATALOGUE_REVIEWED, findRightsPrompts } from "../rights-catalogue";
  import Icon from "./Icon.svelte";
  let { disabled = false, onUse }: { disabled?: boolean; onUse: (id: string) => void } = $props();
  const fieldId = $props.id();
  let query = $state("");
  let article = $state("");
  let selectedId = $state("");
  let matches = $derived(findRightsPrompts(query, article));
  let selected = $derived(matches.find(item => item.id === selectedId));
</script>
<details class="rights-explorer">
  <summary><Icon name="rights" size={26}/><span>Partir des droits à protéger<small>{RIGHTS_PROMPTS.length} pistes documentées, à explorer selon votre contexte</small></span><Icon name="plus"/></summary>
  <div class="rights-explorer-body">
    <p>Un traitement peut affecter une liberté même si les données restent exactes, disponibles et confidentielles. Choisissez une piste, puis décrivez ce qui pourrait arriver aux personnes.</p>
    <div class="rights-search">
      <label class="field">Chercher un droit ou un effet<input type="search" maxlength="160" bind:value={query} placeholder="Choix, banque, santé, surveillance…" /></label>
      <div class="field"><label for={`${fieldId}-article`}>Article de la Convention</label><select id={`${fieldId}-article`} bind:value={article}><option value="">Tous les articles</option><option value="8">8 · Vie privée</option><option value="9">9 · Convictions</option><option value="10">10 · Expression</option><option value="11">11 · Réunion et association</option><option value="14">14 · Non-discrimination</option></select></div>
    </div>
    <div class="field"><label for={`${fieldId}-prompt`}>Piste à examiner</label><select id={`${fieldId}-prompt`} value={selected?.id ?? ""} onchange={(event) => selectedId = event.currentTarget.value}><option value="">Choisir une piste</option>{#each matches as item}<option value={item.id}>{item.title} · art. {item.article}</option>{/each}</select></div>
    <p class="help" role="status">{matches.length ? `${matches.length} piste(s) disponible(s). La recherche reste sur cet appareil.` : "Aucune piste trouvée. Vous pouvez décrire un scénario libre sous cette aide."}</p>
    {#if selected}<article class="rights-prompt">
      <p class="eyebrow">Convention européenne · article {selected.article}</p><h4>{selected.title}</h4>
      <p class="rights-question">{selected.question}</p>
      <p><strong>Portée du repère.</strong> {selected.limit}</p>
      <a href={selected.source} target="_blank" rel="noopener noreferrer">{selected.reference}<Icon name="arrow" size={16}/></a>
      <p class="help">Édition : {selected.edition}. Consultation : {RIGHTS_CATALOGUE_REVIEWED}. Question reformulée par RGPDESK.</p>
      <button type="button" {disabled} onclick={() => onUse(selected!.id)}>Décrire un scénario pour ce droit<Icon name="plus" size={18}/></button>
      <p class="help">Seuls le titre et le droit à examiner seront repris, avec leur référence. Les faits, les conséquences et les niveaux restent à renseigner.</p>
    </article>{/if}
    <details class="rights-scope"><summary>Comment utiliser ces repères</summary><p>Ce catalogue est partiel. Une ingérence n’est pas nécessairement une violation. La Convention engage les États, y compris certaines obligations de protection dans les relations privées : l’application à votre organisme doit être examinée. Les guides du greffe ne lient pas la Cour.</p><p>La sélection d’une piste ne constitue ni un constat d’atteinte ni une analyse terminée. Les scénarios libres restent disponibles pour les droits et situations absents du catalogue.</p></details>
  </div>
</details>
<style>
  .rights-explorer { margin:1.5rem 0; border:1px solid #b6c9d5; border-radius:6px 24px 6px 6px; background:linear-gradient(125deg,#eef3f6,#e4edf3 65%,#f3e9df); overflow:hidden; }
  .rights-explorer > summary { display:flex; align-items:center; gap:1rem; padding:1.25rem; color:#293e50; cursor:pointer; }
  .rights-explorer > summary > span { flex:1; font-weight:650; }
  .rights-explorer small { display:block; margin-top:.3rem; font-size:.95rem; font-weight:400; }
  .rights-explorer-body { padding:0 clamp(1rem,3vw,1.75rem) 1.5rem; }
  .rights-search { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:1rem; }
  .rights-prompt { border-left:3px solid #a77958; background:#ffffffbd; padding:clamp(1rem,3vw,1.75rem); border-radius:3px 18px 3px 3px; }
  .rights-prompt h4 { margin:.5rem 0 1rem; font-size:1.35rem; }
  .rights-question { font-size:1.1rem; line-height:1.65; color:#263e50; }
  .rights-prompt a { display:inline-flex; align-items:center; gap:.5rem; flex-wrap:wrap; }
  .rights-scope { margin-top:1rem; }
  .rights-scope summary { padding:.5rem 0; cursor:pointer; }
  @media(max-width:700px) { .rights-search { grid-template-columns:1fr; gap:0; } }
</style>
