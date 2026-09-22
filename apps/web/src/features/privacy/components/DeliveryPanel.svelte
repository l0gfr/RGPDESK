<script lang="ts">
  import { onDestroy } from "svelte";
  import { projectShare, PROFILE_LABELS, COVERAGE_LABELS, SHARE_LIMITATION, shareRows, type ShareOptions, type SharedRegister, type Workspace } from "@rgpdesk/privacy-core";
  import { packageFiles } from "@rgpdesk/privacy-verifier";
  import Icon from "./Icon.svelte";
  export interface PreparedDelivery { workspaceId: string; revision: number; register: SharedRegister; files: Record<string, string>; manifestHash: string }
  let { workspace, busy, demo = false, onDeliver, onDownload }: { workspace: Workspace; busy: boolean; demo?: boolean; onDeliver: (prepared: PreparedDelivery) => Promise<void>; onDownload: (id: string) => Promise<void> } = $props();
  let options = $state<ShareOptions>({ profile: "article30-controller", recipient: "", scope: "", reservations: [], activityIds: [], documentIds: [], clientId: null });
  let reservations = $state(""); let prepared = $state<PreparedDelivery | null>(null); let confirmed = $state(false); let preparing = $state(false); let error = $state(""); let generation = 0;
  let eligible = $derived(workspace.activities.filter((a) => options.profile === "article30-controller" ? a.role === "controller" : options.profile === "internal-review" ? true : a.role === "processor" && (options.profile !== "client-excerpt" || a.controllerIds.length === 1 && a.controllerIds[0] === options.clientId)));
  let documents = $derived(workspace.documents.filter((d) => d.publicReference.trim() && d.activityIds.length && d.activityIds.every((id) => options.activityIds.includes(id)) && (options.profile !== "client-excerpt" || d.partyIds.every((id) => id === options.clientId))));
  function useDemoSelection() {
    options = { profile: "article30-controller", recipient: "Comité de mission fictif", scope: "DÉMONSTRATION FICTIVE Maison Sillage : activités responsables de traitement. Aucun usage réel ni validation juridique.", reservations: [], activityIds: workspace.activities.filter((a) => a.role === "controller").map((a) => a.id), documentIds: [], clientId: null };
    reservations = "Exercice fictif. Fondements juridiques, durées et transferts restent à examiner.\nLes références ne constituent pas des preuves. L’AIPD reste dans le dossier de travail et n’est pas exportée.";
  }
  function resetSelection() { options.activityIds = []; options.documentIds = []; }
  async function prepare() {
    const current = ++generation; preparing = true; error = "";
    try {
      const captured = $state.snapshot(workspace);
      const register = projectShare(captured, { ...$state.snapshot(options), reservations: reservations.split("\n").filter(Boolean) }, () => crypto.randomUUID(), new Date().toISOString());
      const result = await packageFiles(register);
      if (current === generation) { prepared = { workspaceId: captured.id, revision: captured.revision, register, ...result }; confirmed = false; }
    } catch { if (current === generation) error = "Préparation refusée. Vérifiez le destinataire, le périmètre, les activités sélectionnées et les limites du dossier."; }
    finally { if (current === generation) preparing = false; }
  }
  onDestroy(() => { generation++; });
</script>
<section class="panel">
  <div class="section-heading"><div><p class="eyebrow">Préparer votre restitution</p><h2>Partager ce que vous avez examiné.</h2></div><span class="icon-tile"><Icon name="delivery" size={28} /></span></div>
  <p>À qui devez-vous remettre le registre et pour quel usage ? Définissez ce périmètre, choisissez les fiches, puis vérifiez ce que votre destinataire pourra lire.</p>
  <ol class="stepper" aria-label="Étapes du partage"><li class:current={!prepared}><span>1</span>Périmètre</li><li class:current={!!prepared}><span>2</span>Revue du contenu</li><li><span>3</span>Dossier & historique</li></ol>
  {#if error}<p class="notice error" role="alert">{error}</p>{/if}
  {#if !prepared}{#if demo}<div class="demo-share-preset"><Icon name="delivery" size={24} /><div><strong>Voir tout de suite à quoi ressemble une restitution.</strong><p>Une sélection fictive pour découvrir les rubriques et le rendu. Vous pourrez la modifier avant de préparer le dossier.</p></div><button class="secondary" disabled={busy || preparing} onclick={useDemoSelection}>Charger la sélection d’exemple</button></div>{/if}<form onsubmit={(e) => { e.preventDefault(); void prepare(); }}><fieldset disabled={busy || preparing}>
    <div class="grid-two"><label class="field">Profil de livraison<select aria-label="Profil de livraison" bind:value={options.profile} onchange={resetSelection}>{#each Object.entries(PROFILE_LABELS) as [value, label]}<option {value}>{label}</option>{/each}</select></label><label class="field">Destinataire déclaré<input required maxlength="160" bind:value={options.recipient} placeholder="Fonction ou organisme destinataire" /></label></div>
    <label class="field">Périmètre public de cette livraison<textarea required maxlength="4000" bind:value={options.scope} placeholder="Décrivez les activités, entités et limites couvertes."></textarea></label>
    {#if options.profile === "client-excerpt"}<label class="field">Client de l’extrait<select aria-label="Client de l’extrait" bind:value={options.clientId} onchange={resetSelection}><option value={null}>Choisir explicitement un client</option>{#each workspace.parties as p}<option value={p.id}>{p.name}</option>{/each}</select></label><p class="notice">Seules les fiches sous-traitantes dédiées à ce client sont proposées. Les fiches communes à plusieurs clients sont exclues. Relisez aussi les champs libres pour retirer toute information étrangère au périmètre.</p>{/if}
    <fieldset class="choices"><legend>Activités à inclure</legend>{#each eligible as a}<label><input type="checkbox" checked={options.activityIds.includes(a.id)} onchange={(e) => { options.activityIds = e.currentTarget.checked ? [...options.activityIds, a.id] : options.activityIds.filter((id) => id !== a.id); options.documentIds = []; }} />{a.title} · {a.role === "controller" ? "Responsable" : "Sous-traitant"}</label>{/each}{#if !eligible.length}<p class="help">Aucune fiche éligible à ce profil. Documentez une activité dédiée au périmètre choisi.</p>{/if}</fieldset>
    <fieldset class="choices"><legend>Références publiques facultatives</legend>{#each documents as d}<label><input type="checkbox" checked={options.documentIds.includes(d.id)} onchange={(e) => options.documentIds = e.currentTarget.checked ? [...options.documentIds, d.id] : options.documentIds.filter((id) => id !== d.id)} />{d.publicReference}</label>{/each}{#if !documents.length}<p class="help">Aucune référence publique éligible. Les localisations et titres internes sont toujours exclus.</p>{/if}</fieldset>
    <label class="field">Réserves à communiquer<textarea maxlength="12000" bind:value={reservations} placeholder="Une réserve par ligne. Les inconnues resteront visibles même sans réserve ajoutée."></textarea></label>
    <p class="help">Le dossier partagé contient des données en clair. Les notes internes, provenances, décisions, actions, systèmes et identifiants du coffre sont exclus. Le profil « revue documentaire » peut inclure les bases légales déclarées. Les noms et champs libres autorisés doivent être relus.</p>
    <button type="submit" disabled={!options.activityIds.length}>{preparing ? "Préparation locale…" : "Prévisualiser le dossier"}<Icon name="arrow" /></button>
  </fieldset></form>{:else}
    <div class="review-banner"><Icon name="eye" size={26} /><div><strong>{COVERAGE_LABELS[prepared.register.coverage]}</strong><p>{PROFILE_LABELS[prepared.register.profile]} · Destinataire : {prepared.register.recipient} · Révision examinée : {prepared.revision}</p></div></div>
    <p class="help">Voici le contenu qui alimentera les fichiers JSON, CSV et HTML. Les rubriques renseignées ne constituent pas une conclusion juridique. Les identifiants visibles sont propres à cette livraison.</p>
    <div class="table-scroll preview-table"><table><caption>Contenu exact à partager</caption><thead><tr><th>Rubrique</th><th>Déclaration</th></tr></thead><tbody>{#each shareRows(prepared.register) as row}<tr><th scope="row">{row[0]}</th><td>{row[1]}</td></tr>{/each}</tbody></table></div>
    <p class="help">{SHARE_LIMITATION}</p>
    <label class="check"><input type="checkbox" disabled={busy} bind:checked={confirmed} />J’ai relu ce contenu en clair, ses réserves et son destinataire. Je confirme ce partage pour cette révision.</label>
    <div class="actions"><button disabled={busy || !confirmed} onclick={() => { if (prepared) void onDeliver($state.snapshot(prepared)); }}>Confirmer et télécharger le dossier</button><button disabled={busy} class="secondary" onclick={() => { prepared = null; confirmed = false; }}>Modifier le partage</button></div>
    <p class="help">{demo ? "Cet historique de démonstration reste en mémoire uniquement et disparaît en quittant la visite." : "L’historique chiffré sera enregistré avant le téléchargement."} Vérifiez ensuite le fichier sur votre disque. Au maximum 8 livraisons de 512 Kio dans cet espace.</p>
  {/if}
</section>
<section class="panel delivery-history"><div class="section-heading"><div><p class="eyebrow">{demo ? "Historique de cette visite" : "Historique chiffré"}</p><h2>Les versions remises restent intactes.</h2></div><a class="button secondary" href="/app/privacy/verify/" target="_blank" rel="noreferrer noopener"><Icon name="shield" />Vérifier un dossier</a></div><p class="help">Instantanés historiques, sans mise à jour automatique. Un téléchargement préparé ne prouve pas sa réception par le destinataire.</p>
  {#if !workspace.deliveries.length}<p class="empty">Aucune livraison conservée pour le moment.</p>{/if}
  <ul class="records">{#each workspace.deliveries as d}<li><span class="record-icon"><Icon name="delivery" /></span><div class="grow"><strong>{PROFILE_LABELS[d.profile]} · {d.recipient}</strong><p>{d.createdAt} · révision {d.revision}</p></div><button disabled={busy} class="secondary" onclick={() => onDownload(d.id)}>Télécharger l’instantané</button></li>{/each}</ul>
</section>
