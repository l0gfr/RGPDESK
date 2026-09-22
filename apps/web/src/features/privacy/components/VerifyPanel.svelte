<script lang="ts">
  import { onDestroy } from "svelte";
  import { MAX_ZIP_BYTES, verifyPackage, type VerificationResult } from "@rgpdesk/privacy-verifier";
  import { SHARE_LIMITATION } from "@rgpdesk/privacy-core";
  import Icon from "./Icon.svelte";
  let result = $state<VerificationResult | null>(null); let busy = $state(false); let generation = 0;
  async function verify(file?: File) {
    const current = ++generation; result = null; if (!file) return; busy = true;
    try {
      if (file.size > MAX_ZIP_BYTES) throw new Error();
      const bytes = new Uint8Array(await file.arrayBuffer()); if (current !== generation) return;
      const checked = await verifyPackage(bytes); if (current === generation) result = checked;
    } catch { if (current === generation) result = { valid: false, code: "INVALID_PACKAGE", limitation: SHARE_LIMITATION }; }
    finally { if (current === generation) busy = false; }
  }
  onDestroy(() => { generation++; });
</script>
<div class="verifier-wrap"><header class="intro"><p class="eyebrow">Vérification indépendante · Sur cet appareil</p><h1>Lire un dossier.<br /><em>Vérifier son intégrité.</em></h1><p>Ouvrez une livraison RGPDESK pour contrôler sa structure et ses fichiers, sans compte et sans envoi.</p></header><section class="panel"><label class="upload-zone"><span class="icon-tile"><Icon name="shield" size={34} /></span><strong>Choisir un dossier RGPDESK</strong><span>ZIP de livraison · 2 Mio maximum · Lecture locale</span><input aria-label="Dossier ZIP à vérifier" disabled={busy} type="file" accept=".zip,application/zip" onchange={(e) => verify(e.currentTarget.files?.[0])} /></label>{#if busy}<p role="status">Vérification locale des fichiers…</p>{/if}{#if result}<div class="notice" class:error={!result.valid} role="status"><strong>{result.valid ? "Intégrité technique vérifiée" : "Dossier refusé"}</strong><p>{result.valid ? "Le schéma, les liens, l’inventaire, les tailles, les empreintes et la cohérence des fichiers sont vérifiés." : "Structure, format, limites ou empreintes non valides. Aucun contenu du dossier n’a été exécuté."}</p></div>{/if}<p class="help">{SHARE_LIMITATION}</p><p class="help">Le vérificateur fonctionne sans réseau une fois chargé. Il n’ouvre pas les liens et n’exécute pas le rapport HTML. Il ne restaure pas les sauvegardes chiffrées.</p></section></div>
