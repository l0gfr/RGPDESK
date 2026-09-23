<script lang="ts">
  import type { EvidenceCitation, EvidenceReference } from "@rgpdesk/privacy-core";
  let { citations = $bindable(), documents, prefix, readonly = false }: { citations?: EvidenceCitation[]; documents: EvidenceReference[]; prefix: string; readonly?: boolean } = $props();
  let chosen = $state("");
  function add() {
    const doc = documents.find((d) => d.id === chosen);
    if (!doc || (citations?.length ?? 0) >= 8) return;
    citations = [...(citations ?? []), { documentId: doc.id, version: doc.version, locator: "", meaning: "" }]; chosen = "";
  }
</script>
<div class="evidence-citations">
  {#each citations ?? [] as citation, index}
    {@const document = documents.find((d) => d.id === citation.documentId)}
    <article class="citation-card">
      <header><strong>{document?.title || "Référence hors de ce périmètre"}</strong><span>Version citée : {citation.version || "non précisée"}</span></header>
      {#if document && document.version !== citation.version}<p class="notice">La référence est maintenant en version {document.version || "non précisée"}. Réexaminez ce passage et votre appréciation.<span>Pour consigner votre relecture, enregistrez puis ouvrez les réexamens dans Ma mission.</span></p>{/if}
      {#if readonly}<dl><dt>Passage</dt><dd>{citation.locator}</dd><dt>Ce qu’il établit et ses limites</dt><dd>{citation.meaning}</dd></dl>
      {:else}<label class="field">{prefix} · Passage cité {index + 1}<input required maxlength="1000" bind:value={citation.locator} placeholder="Page 4, clause 6.2, test du 23 septembre…" /></label><label class="field">{prefix} · Ce que ce passage établit, et ses limites<textarea required maxlength="3000" rows="2" bind:value={citation.meaning}></textarea></label><button type="button" class="text-button" onclick={() => citations = citations?.filter((_, i) => i !== index)}>Retirer cette citation</button>{/if}
      {#if document?.internalRef}<p class="help">À retrouver : {document.internalRef}</p>{/if}
    </article>
  {/each}
  {#if !readonly && documents.length}<div class="citation-add"><label class="field">{prefix} · Citer un justificatif lié<select bind:value={chosen}><option value="">Choisir une référence</option>{#each documents as doc}<option value={doc.id}>{doc.title} · {doc.version || "version à préciser"}</option>{/each}</select></label><button type="button" class="secondary" disabled={!chosen || (citations?.length ?? 0) >= 8} onclick={add}>Citer un passage</button></div><p class="help">La référence reste commune. Vous précisez ici seulement le passage utile à cette question et ce qu’il permet d’établir. Les fichiers restent dans votre organisation.</p>{/if}
</div>
