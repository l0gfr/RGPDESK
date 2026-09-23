<script lang="ts">
  import { onDestroy } from "svelte";
  import type { EvidenceReference, DocumentFingerprint } from "@rgpdesk/privacy-core";
  import { fingerprintDocument, FingerprintError } from "../document-fingerprint";
  import Icon from "./Icon.svelte";
  let { draft = $bindable(), recordedVersion }: { draft: EvidenceReference; recordedVersion: string | null } = $props();
  let calculating = $state(false), message = $state(""), replacement = $state(false);
  let candidate = $state<DocumentFingerprint | null>(null);
  let controller: AbortController | undefined;
  const same = $derived(!!candidate && !!draft.fingerprint && candidate.sha256 === draft.fingerprint.sha256 && candidate.bytes === draft.fingerprint.bytes);
  const canAdopt = $derived(!!candidate && candidate.version === draft.version && (recordedVersion === null || (candidate.version !== recordedVersion && replacement)));
  function cancel() { controller?.abort(); controller = undefined; calculating = false; candidate = null; replacement = false; }
  onDestroy(cancel);
  async function choose(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0]; input.value = "";
    cancel(); message = "";
    if (!file || !draft.version.trim()) return;
    const version = draft.version;
    const task = new AbortController(); controller = task; calculating = true;
    try {
      const result = await fingerprintDocument(file, task.signal);
      if (task.signal.aborted || controller !== task) return;
      candidate = { algorithm: "SHA-256", ...result, version, capturedAt: new Date().toISOString() };
    } catch (error) {
      if (!task.signal.aborted && controller === task) message = error instanceof FingerprintError && error.code === "LIMIT" ? "Ce fichier dépasse la limite de 20 Mio. Aucun contenu n’a été conservé." : "Le fichier n’a pas pu être lu. Aucune empreinte n’a été modifiée.";
    } finally { if (controller === task) { calculating = false; controller = undefined; } }
  }
  function adopt() {
    if (!canAdopt || !candidate) return;
    draft.fingerprint = { ...candidate }; candidate = null; replacement = false;
    message = "Empreinte ajoutée à votre saisie. Enregistrez la référence pour la conserver.";
  }
</script>
<section class="fingerprint">
  <h4><Icon name="evidence" />Reconnaître la version d’une pièce</h4>
  <p>Facultatif : choisissez un fichier pour comparer ses octets. Lecture sur cet appareil uniquement, jusqu’à 20 Mio. Le fichier n’est ni joint ni envoyé ; son nom n’est pas conservé.</p>
  {#if draft.fingerprint}
    <div class="baseline"><strong>Empreinte de référence · {draft.fingerprint.version}</strong><span>{draft.fingerprint.bytes.toLocaleString("fr-FR")} octets · calcul local du {draft.fingerprint.capturedAt.slice(0,10)}</span><code>{draft.fingerprint.sha256}</code></div>
    {#if draft.version !== draft.fingerprint.version}<p class="notice">L’empreinte conservée concerne la version {draft.fingerprint.version}, pas la version déclarée actuellement.</p>{/if}
  {/if}
  <label class="field">{draft.fingerprint ? "Comparer un fichier local" : "Choisir un fichier pour son empreinte"}<input type="file" disabled={calculating || !draft.version.trim()} onchange={choose} /></label>
  {#if !draft.version.trim()}<p class="help">Renseignez d’abord la version déclarée, plus haut dans la référence.</p>{/if}
  {#if calculating}<div class="actions"><p role="status">Calcul local en cours…</p><button type="button" class="secondary" onclick={cancel}>Annuler le calcul</button></div>{/if}
  {#if candidate}
    <div class="comparison" role="status"><Icon name={same ? "check" : "documents"} /><div><strong>{draft.fingerprint ? (same ? "Le fichier correspond à l’empreinte conservée." : "Le fichier est différent de la version conservée.") : "Empreinte calculée, à conserver si vous le souhaitez."}</strong><p>Version déclarée au calcul : {candidate.version} · {candidate.bytes.toLocaleString("fr-FR")} octets</p><code>{candidate.sha256}</code></div></div>
    {#if candidate.version !== draft.version}<p class="help">La version a changé pendant cette saisie. Sélectionnez à nouveau le fichier pour l’associer à cette version.</p>{:else if draft.fingerprint && candidate.version === recordedVersion}<p class="help">L’empreinte de référence reste inchangée. Pour référencer une nouvelle version, donnez-lui une version distincte puis sélectionnez son fichier.</p>{/if}
    {#if recordedVersion !== null && candidate.version !== recordedVersion && candidate.version === draft.version}<label class="check"><input type="checkbox" bind:checked={replacement} />Je remplace l’empreinte de référence pour cette nouvelle version déclarée. Je conserve séparément les originaux nécessaires.</label>{/if}
    <div class="actions"><button type="button" class="secondary" disabled={!canAdopt} onclick={adopt}>{draft.fingerprint ? "Remplacer l’empreinte pour cette version" : "Conserver cette empreinte"}</button><button type="button" class="text-button" onclick={cancel}>Écarter ce résultat</button></div>
  {/if}
  {#if message}<p role="status">{message}</p>{/if}
  <p class="help">Une correspondance SHA-256 identifie des octets. Elle ne vérifie ni l’auteur, ni la signature, ni la valeur juridique. La date vient de votre appareil ; ce n’est pas un horodatage certifié.</p>
</section>
<style>
  .fingerprint { padding-top:1.3rem; border-top:1px solid #bdcbd6; margin-top:1.3rem; min-width:0; } h4 { display:flex; gap:.7rem; align-items:center; font-size:1.05rem; } p { font-size:.9375rem; line-height:1.6; }
  .baseline,.comparison { display:flex; gap:.6rem; padding:1rem; margin:1rem 0; background:#edf2f6; border:1px solid #bdcbd6; border-radius:5px; min-width:0; }
  .baseline { flex-direction:column; } .baseline span { font-size:.9375rem; } .comparison div { min-width:0; } code { display:block; font-size:.875rem; overflow-wrap:anywhere; }
  input[type=file] { max-width:100%; min-width:0; font-size:1rem; }
</style>
