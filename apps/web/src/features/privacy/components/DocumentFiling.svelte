<script lang="ts">
  import { nextDocumentCode, type EvidenceReference } from "@rgpdesk/privacy-core";
  import { FILING_FOLDERS, suggestedDocumentPath } from "../document-filing";
  import DocumentFingerprint from "./DocumentFingerprint.svelte";
  import Icon from "./Icon.svelte";
  let { draft = $bindable(), documents }: { draft: EvidenceReference; documents: EvidenceReference[] } = $props();
  let folder = $state<string>(FILING_FOLDERS[0].path), message = $state("");
  const path = $derived(suggestedDocumentPath(draft, folder));
  function allocate() {
    try { draft.documentCode = nextDocumentCode(documents); }
    catch { message = "Aucun nouveau repère n’est disponible dans ce coffre."; }
  }
</script>
<details class="document-filing">
  <summary><Icon name="folder" /><span>Classer et reconnaître cette pièce <small>Repère stable, suggestion de nom et empreinte facultative</small></span><Icon name="plus" /></summary>
  <div class="filing-body">
    <div class="reference-code"><Icon name="register" /><div><strong>{draft.documentCode || "Un repère commun à toutes les citations"}</strong><p>Le repère reste le même si vous changez le titre ou la localisation. Il est propre à ce coffre et conservé après enregistrement.</p></div>{#if !draft.documentCode}<button type="button" class="secondary" onclick={allocate}>Attribuer un repère</button>{/if}</div>
    {#if message}<p role="status">{message}</p>{/if}
    {#if draft.documentCode}
      <label class="field">Dossier suggéré<select bind:value={folder}>{#each FILING_FOLDERS as f}<option value={f.path}>{f.title}</option>{/each}</select></label>
      <p class="suggested-path"><code>{path}</code></p>
      <p class="help">Suggestion à adapter : remplacez « .ext » par l’extension réelle. Aucun dossier n’est créé, aucun fichier n’est déplacé. Vous pouvez aussi conserver votre chemin ou référence GED.</p>
      <button type="button" class="secondary" disabled={!!draft.internalRef.trim()} onclick={() => draft.internalRef = path}>Utiliser la suggestion comme localisation</button>
      {#if draft.internalRef.trim()}<p class="help">La localisation déjà renseignée est conservée. Modifiez-la directement dans le champ au-dessus si nécessaire.</p>{/if}
    {/if}
    <DocumentFingerprint bind:draft recordedVersion={documents.find(d => d.id === draft.id)?.fingerprint?.version ?? null} />
  </div>
</details>
<style>
  .document-filing { border:1px solid #acbecb; background:linear-gradient(120deg,#e5edf2,#f7f8f8); border-radius:5px 20px 5px 5px; margin:1.3rem 0; min-width:0; }
  summary { display:flex; align-items:center; gap:.8rem; padding:1.15rem; cursor:pointer; font-weight:600; color:#283e50; } summary span { flex:1; } summary small { display:block; font-size:.9375rem; font-weight:400; margin-top:.35rem; }
  .filing-body { padding:0 1.15rem 1.15rem; min-width:0; } .reference-code { display:flex; align-items:flex-start; flex-wrap:wrap; gap:.8rem; } .reference-code div { flex:1 1 220px; } p { font-size:.9375rem; line-height:1.6; }
  .suggested-path { padding:1rem; background:#fff9; border-left:3px solid #587289; } code { font-size:.875rem; overflow-wrap:anywhere; }
  @media(max-width:500px) { summary { align-items:flex-start; } }
</style>
