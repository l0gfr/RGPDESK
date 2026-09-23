<script lang="ts">
  import { tick, onMount } from "svelte";
  import type { Workspace } from "@rgpdesk/privacy-core";
  import { searchWorkspace, SEARCH_LABELS, SEARCH_LIMIT, type SearchKind, type SearchResult } from "../search";
  import Icon from "./Icon.svelte";
  let { workspace, canNavigate, onOpen, onClose }: { workspace: Workspace; canNavigate: boolean; onOpen: (result: SearchResult) => void; onClose: () => void } = $props();
  let query = $state("");
  let kind = $state<SearchKind | "">("");
  let dialog: HTMLDialogElement | undefined = $state();
  let input: HTMLInputElement | undefined = $state();
  let found = $derived(searchWorkspace(workspace, query, kind || undefined));
  onMount(() => { dialog?.showModal(); void tick().then(() => input?.focus()); });
</script>

<dialog bind:this={dialog} class="workspace-search-dialog" aria-labelledby="search-title" oncancel={(event) => { event.preventDefault(); onClose(); }}><section id="workspace-search" class="workspace-search" aria-labelledby="search-title">
  <header class="section-heading"><div><p class="eyebrow">Le fil de votre dossier</p><h2 id="search-title">Retrouvez une information.</h2></div><button class="text-button" onclick={onClose}>Fermer la recherche</button></header>
  <div class="search-controls"><label class="field"><span>Rechercher dans ce coffre</span><span class="search-input"><Icon name="search" size={24} /><input bind:this={input} type="search" bind:value={query} maxlength="160" autocomplete="off" spellcheck="false" placeholder="Une activité, un prestataire, une question…" onkeydown={(event) => { if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); onClose(); } }} /></span></label><label class="field">Dans<select bind:value={kind}><option value="">Toutes les rubriques</option>{#each Object.entries(SEARCH_LABELS) as [value, label]}<option {value}>{label}</option>{/each}</select></label></div>
  <p class="search-confidential"><Icon name="lock" size={14} />Recherche sur cet appareil, dans les contenus enregistrés du coffre ouvert. Aucun historique conservé.</p>
  {#if !canNavigate}<p class="notice">Pour ouvrir un résultat, terminez la saisie en cours puis revenez à « Ma mission ». La recherche reste consultable.</p>{/if}
  {#if query.trim().length >= 2}
    <p class="search-count" role="status">{found.total === 0 ? "Aucun résultat. Essayez un autre mot ou une autre rubrique." : `${found.total} résultat${found.total > 1 ? "s" : ""}${found.total > SEARCH_LIMIT ? `, les ${SEARCH_LIMIT} premiers affichés. Précisez votre recherche.` : "."}`}</p>
    <ul class="search-results">{#each found.results as result (`${result.kind}:${result.id}`)}<li><span class="search-result-kind">{SEARCH_LABELS[result.kind]}</span><h3>{result.title}</h3><p>{result.excerpt}</p><button class="secondary" disabled={!canNavigate} onclick={() => onOpen(result)}>Ouvrir {result.title}<Icon name="arrow" size={16} /></button></li>{/each}</ul>
  {:else}<p class="search-empty">Deux caractères suffisent. Recherchez dans les fiches et leurs flux, les références documentaires, les dossiers DPO et les AIPD. Les pièces originales et les anciennes revues ne sont pas parcourues.</p>{/if}
</section></dialog>
