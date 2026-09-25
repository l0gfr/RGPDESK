<script lang="ts">
  import { getContext, tick } from "svelte";
  import { appendDeclarations, containsDeclaration, DECLARATIONS_CONTEXT, filterDeclarations, type DeclarationKind, type DeclarationSource, type ReusableDeclaration } from "../reusable-declarations";
  import Icon from "./Icon.svelte";
  let { kind, label, current, onUse, multiple = false }: { kind: DeclarationKind; label: string; current: string; onUse: (text: string) => void; multiple?: boolean } = $props();
  const source = getContext<DeclarationSource | undefined>(DECLARATIONS_CONTEXT);
  const id = $props.id();
  let open = $state(false);
  let query = $state("");
  let pending: ReusableDeclaration | null = $state(null);
  let selected = $state<string[]>([]);
  let summary: HTMLElement | undefined = $state();
  let search: HTMLInputElement | undefined = $state();
  let entries = $derived(open && source ? source(kind) : []);
  let results = $derived(filterDeclarations(multiple ? entries.filter(entry => !containsDeclaration(current, entry.text)) : entries, query, current));
  let combined = $derived(appendDeclarations(current, selected));
  async function toggle() {
    if (!open) { query = ""; pending = null; selected = []; }
    else { await tick(); search?.focus({ preventScroll: true }); }
  }
  function apply(item: ReusableDeclaration) {
    if (!entries.some(entry => entry.text === item.text)) { pending = null; return; }
    onUse(item.text); open = false; query = ""; pending = null;
  }
  function choose(item: ReusableDeclaration) { if (current.trim()) pending = item; else apply(item); }
  function addSelected() {
    if (!selected.length || selected.some(text => !entries.some(entry => entry.text === text))) return;
    const value = appendDeclarations(current, selected);
    if (value === null) return;
    onUse(value); open = false; query = ""; selected = [];
  }
  function searchKey(event: KeyboardEvent) { if (event.key === "Enter") event.preventDefault(); escape(event); }
  function escape(event: KeyboardEvent) { if (event.key === "Escape") { event.preventDefault(); open = false; query = ""; pending = null; summary?.focus(); } }
</script>

{#if source}
<details class="declaration-picker" bind:open ontoggle={toggle}>
  <summary bind:this={summary}><Icon name="history" size={17}/><span>{multiple ? "Choisir des déclarations déjà saisies" : "Réutiliser une déclaration"}</span></summary>
  {#if open}
    <div class="declaration-body">
      <p class="declaration-help">{multiple ? "Cochez les déclarations utiles : elles seront ajoutées à votre texte, une par ligne. Vous pourrez les adapter." : "Reprendre un texte crée une copie modifiable."} Seules les déclarations de ce coffre et de votre saisie en cours sont proposées. Les autres fiches restent inchangées.</p>
      {#if kind === "period"}<p class="declaration-caution">Une durée déjà saisie n’est pas une recommandation. Vérifiez son point de départ et son adéquation à ce groupe.</p>{/if}
      {#if pending}
        <div class="declaration-preview"><strong>Remplacer le texte de ce champ ?</strong><p>{pending.text}</p><small>{pending.sources[0]}</small></div>
        <div class="actions"><button type="button" class="secondary" onclick={() => { if (pending) apply(pending); }} onkeydown={escape}>Remplacer le contenu</button><button type="button" class="secondary" onclick={() => pending = null} onkeydown={escape}>Garder mon texte</button></div>
      {:else}
        <label for={id}>Chercher une déclaration pour « {label} »</label>
        <input bind:this={search} id={id} type="search" maxlength="160" autocomplete="off" bind:value={query} onkeydown={searchKey} placeholder="Un mot du texte ou de la fiche d’origine" />
        <p class="declaration-count" aria-live="polite">{results.total ? `${results.total} déclaration${results.total > 1 ? "s" : ""} disponible${results.total > 1 ? "s" : ""}` : "Aucune autre déclaration pour ce champ. Vous pouvez saisir votre propre texte."}</p>
        <ul class="declaration-options">
          {#each results.items as item (item.text)}
            <li>{#if multiple}<label class="declaration-option declaration-choice"><input type="checkbox" checked={selected.includes(item.text)} onchange={event => { selected = event.currentTarget.checked ? [...selected, item.text] : selected.filter(text => text !== item.text); }} onkeydown={escape}/><span><span class="declaration-text">{item.text}</span><span class="declaration-origin">{item.sources[0]}</span></span></label>{:else}<button class="secondary declaration-option" type="button" onclick={() => choose(item)} onkeydown={escape}><span class="declaration-text">{item.text}</span><span class="declaration-origin">{item.sources[0]}{item.occurrences > 1 ? ` · ${item.occurrences} occurrences` : ""}</span><span class="declaration-action">Reprendre ce texte <Icon name="arrow" size={16}/></span></button>{/if}</li>
          {/each}
        </ul>
        {#if results.total > results.items.length}<p class="declaration-help">Les {results.items.length} premiers résultats sont affichés. Affinez votre recherche pour retrouver les autres.</p>{/if}
        {#if multiple}
          {#if combined === null}<p class="declaration-caution" role="status">L’ajout dépasserait la limite de 4 000 caractères. Réduisez la sélection ou votre texte ; rien n’a été modifié.</p>{/if}
          <button type="button" class="secondary" disabled={!selected.length || combined === null} onclick={addSelected} onkeydown={escape}>Ajouter la sélection{selected.length ? ` (${selected.length})` : ""}</button>
        {/if}
      {/if}
    </div>
  {/if}
</details>
{/if}
