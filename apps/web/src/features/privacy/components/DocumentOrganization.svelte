<script lang="ts">
  import Icon from "./Icon.svelte";
  import { createFilingKit, FILING_FOLDERS } from "../document-filing";
  let preparing = $state(false), message = $state("");
  async function downloadKit() {
    if (preparing) return;
    preparing = true; message = "";
    try {
      const bytes = await createFilingKit();
      const url = URL.createObjectURL(new Blob([bytes], { type: "application/zip" }));
      const link = document.createElement("a");
      try { link.href = url; link.download = "rgpdesk-classement.zip"; document.body.append(link); link.click(); }
      finally { link.remove(); setTimeout(() => URL.revokeObjectURL(url), 0); }
      message = "Classement préparé. Extrayez-le dans l’espace protégé choisi pour cette mission.";
    } catch { message = "Le classement n’a pas pu être préparé. Vous pouvez créer les six dossiers indiqués ci-dessous."; }
    finally { preparing = false; }
  }
</script>
<details class="document-organization">
  <summary><Icon name="folder" size={26} /><span><strong>Organiser les pièces de cette mission</strong><small>Votre classement existe déjà ? Gardez-le. Sinon, partez de six dossiers simples.</small></span><Icon name="plus" /></summary>
  <div class="organization-body">
    <p>Les originaux restent dans l’espace documentaire que vous choisissez. Ici, une référence commune relie chaque pièce à toutes les activités concernées.</p>
    <ol class="folder-cards">{#each FILING_FOLDERS as folder}<li><Icon name={folder.icon} size={25} /><div><strong>{folder.title}</strong><p>{folder.detail}</p><code>{folder.path}/</code></div></li>{/each}</ol>
    <div class="actions"><button type="button" class="secondary" disabled={preparing} onclick={downloadKit}><Icon name="import" />{preparing ? "Préparation…" : "Télécharger le classement vide"}</button><span class="help">Dossiers + mode d’emploi. Aucune pièce, aucune donnée du coffre.</span></div>
    {#if message}<p role="status">{message}</p>{/if}
    <aside class="filing-safety"><Icon name="security" size={24} /><div><strong>Deux ensembles à protéger et sauvegarder.</strong><p>Votre coffre .rgpdesk conserve les références ; vos pièces restent à part. Adaptez les accès et le chiffrement, séparez les espaces clients, gardez une copie isolée et testez la restauration du coffre et des originaux. Un dossier nommé « confidentiel » ne configure aucune protection.</p><p><a href="https://www.cnil.fr/fr/securite-sauvegarder" target="_blank" rel="noopener noreferrer">Sauvegarder, recommandations CNIL</a> · <a href="https://www.cnil.fr/fr/securite-gerer-les-habilitations" target="_blank" rel="noopener noreferrer">Gérer les habilitations</a></p></div></aside>
    <p class="help">Une même pièce ne se range qu’une fois : rattachez sa référence aux différentes analyses. Conservez les versions utiles selon votre politique de conservation.</p>
  </div>
</details>
<style>
  .document-organization { margin:1.5rem 0 2rem; border:1px solid #adbecb; border-radius:6px 24px 6px 6px; background:linear-gradient(125deg,#e4edf1,#f6f7f7 70%); }
  summary { display:flex; align-items:center; gap:1rem; padding:1.4rem; cursor:pointer; color:#263e50; }
  summary span { flex:1; } summary strong { display:block; font-size:1.1rem; } summary small { display:block; margin-top:.4rem; font-size:.9375rem; line-height:1.5; }
  .organization-body { padding:0 1.4rem 1.4rem; } .folder-cards { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:.8rem; list-style:none; padding:0; }
  .folder-cards li { display:flex; gap:1rem; padding:1rem; border:1px solid #bacad4; background:#ffffffa6; border-radius:4px 16px 4px 4px; min-width:0; }
  .folder-cards li div { min-width:0; } .folder-cards p { margin:.4rem 0; font-size:.9375rem; } code { font-size:.875rem; overflow-wrap:anywhere; }
  .filing-safety { display:flex; gap:1rem; padding:1.2rem; margin-top:1.4rem; background:#dae5ed; border-left:3px solid #526c81; } .filing-safety p { font-size:.9375rem; }
  @media(max-width:700px) { .folder-cards { grid-template-columns:1fr; } summary { align-items:flex-start; padding:1rem; } .organization-body { padding:0 1rem 1rem; } .folder-cards li,.filing-safety { gap:.7rem; padding:.8rem; } }
</style>
