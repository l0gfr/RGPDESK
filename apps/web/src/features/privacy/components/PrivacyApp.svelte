<script lang="ts">
  import { VaultInventory } from "../persistence/inventory";
  import { onMount, tick } from "svelte";
  import { createActivity, createWorkspace, evaluateWorkspace, putActivity, putParty, putSystem, reviseWorkspace, MAX_BACKUP_BYTES, PrivacyError, type Activity, type Workspace } from "@rgpdesk/privacy-core";
  import { assertLocalPassphrase } from "../../../lib/local-encryption";
  import { subscribeToSensitivePageLock } from "../../../lib/sensitive-page-lock";
  import { checkSession, PrivacyVault, PRIVACY_CHANNEL, type VaultItem, type VaultSession } from "../persistence/vault";
  import { errorMessage, fr } from "../i18n/fr";
  import { zipFiles } from "@rgpdesk/privacy-verifier";
  import Icon from "./Icon.svelte";
  import ProcessingAtlas from "./ProcessingAtlas.svelte";
  import PiaPanel from "./PiaPanel.svelte";
  import AnalysisOverview from "./AnalysisOverview.svelte";
  import Pictogram from "./Pictogram.svelte";
  import ImportPanel from "./ImportPanel.svelte";
  import DocumentsPanel from "./DocumentsPanel.svelte";
  import ActionsPanel from "./ActionsPanel.svelte";
  import DeliveryPanel, { type PreparedDelivery } from "./DeliveryPanel.svelte";
  import ActivityEditor from "./ActivityEditor.svelte";
  import OrganizationEditor from "./OrganizationEditor.svelte";
  import RelationsEditor from "./RelationsEditor.svelte";
  import MissionOverview from "./MissionOverview.svelte";
  import ActivityStarter from "./ActivityStarter.svelte";
  import type { StartingPoint } from "../guidance";

  let ready = $state(false);
  let inventoryStatus: "loading" | "ready" | "error" = $state("loading");
  let storageOrigin = $state("");
  let inventory: VaultInventory | undefined;
  let stale = $state(false);
  let busy = $state(false);
  let master: Workspace | null = $state(null);
  let records: VaultItem[] = $state([]);
  let message = $state("");
  let error = $state("");
  let organizationName = $state("");
  let phraseInput = $state("");
  let confirmation = $state("");
  let acknowledged = $state(false);
  let restoreAcknowledged = $state(false);
  let selectedId = $state("");
  let restoreFile: File | null = $state(null);
  let workspaceHeading: HTMLHeadingElement | undefined = $state();
  let fileInput: HTMLInputElement | undefined = $state();
  let wipeConfirmation = $state("");
  let showWipe = $state(false);
  let panel: "pia" | "analysis" | "flows" | "overview" | "register" | "organization" | "parties" | "systems" | "backup" | "import" | "documents" | "actions" | "delivery" = $state("overview");
  let piaEditing = $state(false);
  let missingOnly = $state(false);
  let registerRole = $state("");
  let findings = $derived(master ? evaluateWorkspace(master, new Date().toISOString().slice(0, 10)) : []);
  let editor: Activity | null = $state(null);
  let editorSection: "record" | "analysis" | "flows" = $state("record");
  let editorExample: StartingPoint | undefined = $state();
  let showStarters = $state(false);
  let lastActivityId = $state("");
  let actionActivityId = $state("");
  let backupRevision: number | null = $state(null);
  let vault: PrivacyVault | undefined;
  let epoch = "";
  let phrase = "";
  let controller = new AbortController();
  const now = () => new Date().toISOString();
  const session = (): VaultSession => ({ epoch, signal: controller.signal });

  function lock(text: string = fr.locked) {
    controller.abort();
    controller = new AbortController();
    phrase = "";
    phraseInput = "";
    confirmation = "";
    organizationName = "";
    master = null;
    editor = null;
    piaEditing = false;
    editorSection = "record";
    missingOnly = false;
    registerRole = "";
    selectedId = "";
    restoreFile = null;
    if (fileInput) fileInput.value = "";
    acknowledged = false;
    restoreAcknowledged = false;
    backupRevision = null;
    busy = false;
    error = "";
    message = text;
    panel = "overview";
    editorExample = undefined;
    showStarters = false;
    lastActivityId = actionActivityId = "";
  }

  async function run(action: (current: VaultSession) => Promise<void>) {
    if (!ready || busy || stale) return;
    const current = session();
    busy = true;
    message = "";
    error = "";
    try { await action(current); }
    catch (cause) {
      if (!current.signal.aborted) error = errorMessage(cause);
    } finally {
      if (!current.signal.aborted) busy = false;
    }
  }

  async function revealWorkspace(current: VaultSession) {
    await tick();
    checkSession(current);
    workspaceHeading?.focus({ preventScroll: true });
    workspaceHeading?.scrollIntoView({ block: "start" });
  }

  async function create() {
    if (!acknowledged || phraseInput !== confirmation) { error = "Confirmez la même phrase secrète et les limites de récupération."; return; }
    try { assertLocalPassphrase(phraseInput); }
    catch { error = "Utilisez une phrase d’au moins 16 caractères et 6 caractères distincts, ou 12 caractères avec trois types de caractères."; return; }
    await run(async (current) => {
      const secret = phraseInput;
      const created = createWorkspace(crypto.randomUUID(), organizationName, now());
      await vault!.create(created, secret, current);
      checkSession(current);
      phrase = secret;
      master = created;
      phraseInput = confirmation = organizationName = "";
      await inventory!.refresh();
      checkSession(current);
      message = fr.saved;
      await revealWorkspace(current);
    });
  }

  async function unlock() {
    await run(async (current) => {
      const secret = phraseInput;
      const opened = await vault!.unlock(selectedId, secret, current);
      checkSession(current);
      phrase = secret;
      phraseInput = "";
      master = opened;
      message = "Coffre ouvert sur cet appareil.";
      await revealWorkspace(current);
    });
  }

  async function persist(next: Workspace, current: VaultSession) {
    if (!master) throw new PrivacyError("LOCKED");
    await vault!.save(next, phrase, master.revision, current);
    checkSession(current);
    master = next;
    editor = null;
    message = fr.saved;
  }

  function startActivity(role: Activity["role"], example?: StartingPoint) {
    if (!master || busy || master.activities.length >= 200) return;
    editorSection = "record";
    editor = createActivity(master.id, crypto.randomUUID(), role);
    editor.title = example?.title ?? "";
    editorExample = example;
    panel = "register";
    showStarters = false;
  }

  async function saveActivity(activity: Activity) {
    await run(async (current) => {
      if (!master) throw new PrivacyError("LOCKED");
      await persist(putActivity($state.snapshot(master), activity, master.revision, now()), current);
      panel = "register";
      lastActivityId = activity.id;
    });
  }

  async function saveNext(next: Workspace) {
    await run(async (current) => { await persist(next, current); });
  }
  function download(bytes: Uint8Array<ArrayBuffer>, name: string) {
    const url = URL.createObjectURL(new Blob([bytes], { type: "application/zip" }));
    const anchor = document.createElement("a");
    try { anchor.href = url; anchor.download = name; document.body.append(anchor); anchor.click(); }
    finally { anchor.remove(); URL.revokeObjectURL(url); }
  }
  async function deliver(prepared: PreparedDelivery) {
    await run(async (current) => {
      if (!master || prepared.workspaceId !== master.id || prepared.revision !== master.revision) throw new PrivacyError("CONFLICT");
      const bytes = await zipFiles(prepared.files);
      checkSession(current);
      const next = await vault!.deliver($state.snapshot(master), prepared.register, prepared.files, prepared.revision, phrase, current);
      checkSession(current); master = next;
      await vault!.assertCurrent(next.id, next.revision, current);
      checkSession(current); download(bytes, "rgpdesk-dossier.zip");
      message = "Dossier préparé et instantané chiffré conservé. Vérifiez le fichier téléchargé avant de le transmettre.";
    });
  }
  async function downloadDelivery(id: string) {
    await run(async (current) => {
      if (!master) throw new PrivacyError("LOCKED");
      const frozen = $state.snapshot(master);
      const files = await vault!.deliveryFiles(frozen, id, phrase, current);
      const bytes = await zipFiles(files);
      await vault!.assertCurrent(frozen.id, frozen.revision, current);
      checkSession(current); download(bytes, "rgpdesk-dossier.zip");
      message = "Instantané historique préparé, sans recalcul avec les données actuelles.";
    });
  }

  async function downloadBackup() {
    await run(async (current) => {
      if (!master) throw new PrivacyError("LOCKED");
      const snapshot = $state.snapshot(master);
      const text = await vault!.backup(snapshot, phrase, current);
      // Final guard immediately before the synchronous download gesture.
      await vault!.assertCurrent(snapshot.id, snapshot.revision, current);
      checkSession(current);
      const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
      const anchor = document.createElement("a");
      try {
        anchor.href = url;
        anchor.download = "rgpdesk-sauvegarde.rgpdesk";
        document.body.append(anchor);
        anchor.click();
      } finally { anchor.remove(); URL.revokeObjectURL(url); }
      backupRevision = snapshot.revision;
      message = "Sauvegarde chiffrée préparée. Vérifiez le fichier téléchargé et conservez-le séparément de cet appareil.";
    });
  }

  async function restore() {
    if (!restoreAcknowledged || !restoreFile) { error = "Choisissez une sauvegarde et confirmez les limites de restauration."; return; }
    await run(async (current) => {
      const file = restoreFile!;
      const secret = phraseInput;
      if (file.size > MAX_BACKUP_BYTES) throw new PrivacyError("LIMIT");
      const text = await file.text();
      checkSession(current);
      const restored = await vault!.restore(text, secret, current);
      checkSession(current);
      phrase = secret;
      phraseInput = "";
      restoreFile = null;
      if (fileInput) fileInput.value = "";
      master = restored;
      await inventory!.refresh();
      checkSession(current);
      message = "Sauvegarde restaurée et rechiffrée dans ce profil navigateur.";
      await revealWorkspace(current);
    });
  }

  async function wipe() {
    if (wipeConfirmation !== "EFFACER" || busy || stale) return;
    lock();
    busy = true;
    try {
      await vault!.wipe(epoch);
      records = [];
      stale = true;
      message = "Les coffres RGPDESK de ce profil ont été effacés. Rechargez la page avant toute nouvelle opération.";
    } catch (cause) { error = errorMessage(cause); }
    finally { busy = false; wipeConfirmation = ""; showWipe = false; }
  }

  onMount(() => {
    let disposed = false;
    vault = new PrivacyVault();
    storageOrigin = window.location.origin;
    inventory = new VaultInventory(async () => {
      if (!epoch) epoch = await vault!.initialize();
      return vault!.listCurrent(epoch);
    }, (state) => {
      if (disposed) return;
      inventoryStatus = state.status;
      records = state.items;
      ready = state.status === "ready";
      if (state.epochChanged) {
        records = [];
        lock("Le stockage a changé dans un autre onglet. Rechargez cette page avant de continuer.");
        stale = true;
      }
    });
    void inventory.refresh();
    const refreshLocked = () => { if (!master && !busy && !stale && document.visibilityState === "visible") void inventory?.refresh(); };
    const inventorySubscription = vault.watchInventory(refreshLocked);
    window.addEventListener("focus", refreshLocked);
    window.addEventListener("pageshow", refreshLocked);
    document.addEventListener("visibilitychange", refreshLocked);
    const unsubscribe = subscribeToSensitivePageLock(() => lock());
    const onPageHide = () => lock();
    window.addEventListener("pagehide", onPageHide);
    const channel = typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel(PRIVACY_CHANNEL);
    if (channel) channel.onmessage = (event) => {
      if (event.data?.type === "wipe") {
        lock("Vérification du stockage après une modification dans un autre onglet.");
        void inventory?.refresh();
      }
    };
    return () => { disposed = true; inventorySubscription.unsubscribe(); inventory?.dispose(); window.removeEventListener("focus", refreshLocked); window.removeEventListener("pageshow", refreshLocked); document.removeEventListener("visibilitychange", refreshLocked); lock(); unsubscribe(); channel?.close(); window.removeEventListener("pagehide", onPageHide); vault?.close(); };
  });
</script>

<div data-rgpdesk-ready={ready ? "true" : "false"} class="privacy-app">
  <div class="notice-strip"><span class="status-dot" aria-hidden="true"></span> Espace local & confidentiel <span><Icon name="lock" size={14} /> Chiffrement sur cet appareil</span></div>
  {#if error}<p class="notice error" role="alert">{error}</p>{/if}
  {#if message}<p class="notice" role="status">{message}</p>{/if}
  {#if stale}<a class="button" href="/app/privacy/">Recharger l’application</a>{/if}
  {#if inventoryStatus === "loading"}<p role="status">Lecture des coffres de ce navigateur…</p>{/if}

  {#if master}
    <div class="desk-layout">
    <aside class="desk-sidebar"><div class="sidebar-caption"><span class="workspace-avatar">{master.organization.name.slice(0, 1).toUpperCase()}</span><div><small>VOTRE ESPACE</small><h2>{master.organization.name}</h2><small>{master.activities.length} fiche(s) dans votre registre</small></div></div>
      <p class="nav-label">Dossier de l’organisation</p><nav class="tabs" aria-label="Espace RGPD">
      {#each [["overview", "Ma mission"], ["register", "Registre"], ["flows", "Cartographie"], ["analysis", "Analyse"], ["pia", "AIPD / PIA"], ["organization", "Organisation"], ["parties", "Intervenants"], ["systems", "Systèmes"], ["documents", "Documents"], ["actions", "Actions & décisions"]] as [key, label]}
        <button aria-label={label} class:active={panel === key} aria-current={panel === key ? "page" : undefined} disabled={busy || editor !== null || piaEditing} onclick={() => { actionActivityId = ""; panel = key as typeof panel; }}><Icon name={key === "pia" ? "analysis" : key} /><span>{label}</span>{#if key === "register"}<small>{master.activities.length}</small>{/if}</button>
      {/each}</nav><p class="nav-label">Circulation du dossier</p><nav class="tabs" aria-label="Opérations locales">{#each [["import", "Importer un CSV"], ["delivery", "Partager un dossier"], ["backup", "Sauvegarde"]] as [key, label]}<button aria-label={label} class:active={panel === key} aria-current={panel === key ? "page" : undefined} disabled={busy || editor !== null || piaEditing} onclick={() => { actionActivityId = ""; panel = key as typeof panel; }}><Icon name={key === "pia" ? "analysis" : key} /><span>{label}</span></button>{/each}</nav>
      <div class="sidebar-security"><Icon name="shield" size={25} /><strong>Votre appareil. Votre coffre.</strong><p>Les informations restent ici. Pensez à votre sauvegarde chiffrée.</p></div>
    </aside><div class="desk-workspace">
    <header class="workspace-heading"><div><p class="eyebrow">{master.organization.name} · Espace de travail</p><h1 bind:this={workspaceHeading} tabindex="-1">{panel === "pia" ? "Votre atelier d’impact." : panel === "analysis" ? "Votre analyse, point par point." : panel === "flows" ? "Votre carte des flux." : panel === "overview" ? "Votre mission, étape par étape." : panel === "register" ? "Votre registre RGPD." : panel === "documents" ? "Vos références documentaires." : panel === "actions" ? "Vos actions et décisions." : panel === "delivery" ? "Préparer un dossier à partager." : panel === "import" ? "Importer un registre CSV." : panel === "backup" ? "Sauvegarder votre travail." : panel === "organization" ? "Votre organisation." : panel === "parties" ? "Les acteurs du traitement." : "Les moyens du traitement."}</h1></div><button class="secondary lock-button" onclick={() => lock()}><Icon name="lock" />Verrouiller le coffre</button></header>
    <p class="backup-status"><Icon name="backup" size={15} />{backupRevision === master.revision ? "Sauvegarde préparée pendant cette séance : vérifiez le fichier sur votre disque." : "Avant de terminer votre séance, téléchargez une sauvegarde de votre travail."}</p>
    {#if editor}
      <p class="help">Enregistrez avant de quitter cette fiche. Le verrouillage abandonne les modifications non enregistrées.</p>
      {#key editor.id}<ActivityEditor initialSection={editorSection} initial={$state.snapshot(editor)} workspace={master} example={editorExample} {busy} onSave={saveActivity} onCancel={() => editor = null} />{/key}
    {:else if panel === "overview"}
      <MissionOverview workspace={master} {busy} onNavigate={(next) => { actionActivityId = ""; panel = next; }} onEdit={(activity) => { editorSection = "record"; editorExample = undefined; editor = structuredClone($state.snapshot(activity)); panel = "register"; }} />
    {:else if panel === "pia"}
      <PiaPanel workspace={master} {busy} onEditing={(value) => piaEditing = value} onRegister={() => panel = "register"} onSave={async (next) => { await saveNext(next); return master?.revision === next.revision; }} />
    {:else if panel === "analysis" || panel === "flows"}
      {#key panel}<AnalysisOverview workspace={master} mode={panel} {busy} onPia={() => panel = "pia"} onRegister={() => panel = "register"} onEdit={(activity, section) => { editorSection = section; editorExample = undefined; editor = structuredClone($state.snapshot(activity)); }} />{/key}
    {:else if panel === "register"}
      {#if lastActivityId && master.activities.some((a) => a.id === lastActivityId)}<aside class="saved-next"><Icon name="check" size={24} /><div><h2>Votre fiche est enregistrée. Préparez la suite de l’entretien.</h2><p>Retrouvez les réponses qui manquent, les questions à poser et les documents à demander pour cette activité.</p><button disabled={busy} onclick={() => { actionActivityId = lastActivityId; panel = "actions"; }}>Préparer les questions de cette activité<Icon name="arrow" /></button></div></aside>{/if}
      {#if master.activities.length === 0 || showStarters}<ActivityStarter busy={busy || master.activities.length >= 200} onStart={startActivity} />{/if}
      {#if master.activities.length > 0}<div class="metric-row"><div><span class="metric-icon"><Icon name="register" size={23} /></span><div><span class="metric-number">{master.activities.length.toString().padStart(2, "0")}</span><p>Activités documentées</p></div></div><div><span class="metric-icon"><Icon name="eye" size={23} /></span><div><span class="metric-number">{findings.length.toString().padStart(2, "0")}</span><p>Questions à examiner</p></div></div><div><span class="metric-icon"><Icon name="documents" size={23} /></span><div><span class="metric-number">{master.documents.length.toString().padStart(2, "0")}</span><p>Références reliées</p></div></div></div>{/if}
      <section class="panel"><div class="section-heading"><div><p class="eyebrow">Documenter les traitements</p><h2>Votre registre</h2></div><button class="text-button" disabled={busy} onclick={() => showStarters = !showStarters}>Choisir un point de départ</button></div>
        <p class="help">Une fiche décrit une activité de votre organisme. Commencez avec les informations disponibles ; vous pourrez l’enrichir après chaque entretien.</p>
        <div class="actions"><button disabled={busy || master.activities.length >= 200} onclick={() => { startActivity("controller"); }}>Ajouter une activité responsable</button><button class="secondary" disabled={busy || master.activities.length >= 200} onclick={() => { startActivity("processor"); }}>Ajouter une activité sous-traitante</button></div>
        {#if master.activities.length === 0}<div class="empty register-empty"><span class="icon-tile"><Icon name="register" size={35} /></span><h3>Vous avez déjà un registre ?</h3><p>Vous pouvez reprendre un tableau existant au format CSV. Les fiches vous seront présentées avant leur ajout.</p><button class="text-button" onclick={() => panel = "import"}>Importer mon registre CSV <Icon name="arrow" size={16} /></button></div>{/if}
        <div class="filters"><label class="field">Type de registre<select aria-label="Type de registre" bind:value={registerRole}><option value="">Tous les rôles</option><option value="controller">Responsable</option><option value="processor">Sous-traitant</option></select></label><label class="check"><input type="checkbox" bind:checked={missingOnly} />Informations à compléter</label></div>
        <ul class="records activity-records">{#each master.activities.filter((a) => (!registerRole || a.role === registerRole) && (!missingOnly || findings.some((f) => f.activityId === a.id))) as activity (activity.id)}<li><span class="record-icon"><Icon name="register" /></span><div class="grow"><strong>{activity.title}</strong><p>{activity.role === "controller" ? "Responsable" : "Sous-traitant"} · {activity.status === "draft" ? "Brouillon" : activity.status === "active" ? "Active, état déclaré" : "Archivée"}</p></div><button class="secondary" disabled={busy} onclick={() => { editorSection = "record"; editorExample = undefined; editor = structuredClone($state.snapshot(activity)); }}>Modifier {activity.title}</button></li>{/each}</ul>
      </section>
    {:else if panel === "organization"}
      {#key master.revision}<OrganizationEditor workspace={$state.snapshot(master)} {busy} onSave={(changes) => run(async (current) => { if (master) await persist(reviseWorkspace($state.snapshot(master), master.revision, now(), changes), current); })} />{/key}
    {:else if panel === "parties" || panel === "systems"}
      {#key `${panel}:${master.revision}`}<RelationsEditor workspace={$state.snapshot(master)} {busy} kind={panel}
        onSaveParty={(party) => run(async (current) => { if (master) await persist(putParty($state.snapshot(master), party, master.revision, now()), current); })}
        onSaveSystem={(system) => run(async (current) => { if (master) await persist(putSystem($state.snapshot(master), system, master.revision, now()), current); })} />{/key}
    {:else if panel === "import"}
      {#key master.revision}<ImportPanel workspace={$state.snapshot(master)} {busy} onSave={saveNext} />{/key}
    {:else if panel === "documents"}
      {#key master.revision}<DocumentsPanel workspace={$state.snapshot(master)} {busy} onSave={saveNext} />{/key}
    {:else if panel === "actions"}
      {#key master.revision}<ActionsPanel workspace={$state.snapshot(master)} initialActivityId={actionActivityId} {busy} onSave={saveNext} />{/key}
    {:else if panel === "delivery"}
      {#key master.revision}<DeliveryPanel workspace={$state.snapshot(master)} {busy} onDeliver={deliver} onDownload={downloadDelivery} />{/key}
    {:else}
      <section class="panel"><h2>Sauvegarde chiffrée</h2><p>Elle contient tout cet espace, y compris les notes internes. Elle sert à la restauration et n’est pas un dossier à partager avec un client.</p><p>La même phrase secrète sera nécessaire. Aucun service ne peut la récupérer pour vous.</p><button disabled={busy} onclick={downloadBackup}>Télécharger la sauvegarde chiffrée</button><p class="help">Pour tester la restauration, ouvrez RGPDESK sur un autre profil navigateur. Toute collision avec un espace existant est refusée.</p></section>
    {/if}
    <p class="catalog-caption">Un doute pendant votre travail ? <a href="/app/privacy/guide/" target="_blank" rel="noopener noreferrer">Retrouver une explication dans le guide</a>.</p></div></div>
  {:else}
    <div class="welcome-hero"><header class="intro"><p class="eyebrow"><span class="eyebrow-line"></span>{fr.welcome.eyebrow}</p><h1>{fr.welcome.title}<br /><em>{fr.welcome.subtitle}</em></h1><p>{fr.welcome.description}</p><div class="actions hero-actions"><a class="button" href="#creer-registre">{fr.welcome.start} <Icon name="arrow" size={17} /></a><a class="button secondary" href="/app/privacy/guide/" target="_blank" rel="noopener noreferrer">{fr.welcome.guide}</a></div><div class="trust-row"><span><Icon name="lock" size={17} />Coffre chiffré</span><span><Icon name="shield" size={17} />Sans compte</span><span><Icon name="documents" size={17} />Partage choisi</span></div></header><ProcessingAtlas /></div>
    <p class="business-entry"><Icon name="book" size={20} /><a href="/app/privacy/guide/#trames-metier" target="_blank" rel="noopener noreferrer">Préparer un entretien : 6 trames métier sourcées</a><span>Recrutement · RH · Clients · Associations · Contact · Prestations</span></p>
    <section class="use-cases" aria-label="Ce que vous pouvez faire avec RGPDESK">
      <article><Pictogram kind="register" /><p class="eyebrow">01 / Décrire</p><h2>Un registre structuré.</h2><p>Une fiche par activité : pourquoi ces données, pour quelles personnes, avec quels intervenants et quelles mesures.</p></article>
      <article><Pictogram kind="analysis" /><p class="eyebrow">02 / Examiner</p><h2>Des choix argumentés.</h2><p>Cartographiez les flux déclarés. Examinez la nécessité, la proportionnalité et les contrats avec des questions sourcées et des notes qui restent privées.</p></article>
      <article><Pictogram kind="delivery" /><p class="eyebrow">03 / Communiquer</p><h2>Un dossier choisi et relu.</h2><p>Sélectionnez le destinataire et les activités, relisez le contenu, puis téléchargez un dossier HTML, CSV et JSON.</p></article>
    </section>
    <div class="onboarding-note"><div><h2>Votre travail reste sur votre appareil.</h2><p>Le coffre protège votre registre dans ce navigateur. Sans compte ni synchronisation, vous gardez la main sur vos sauvegardes chiffrées et vos partages.</p></div><a href="/app/privacy/guide/#2-votre-premier-registre-pas-à-pas" target="_blank" rel="noopener noreferrer">Me guider pour commencer <Icon name="arrow" size={17} /></a></div>
    <div class="grid-two vault-panels">
      <section class="panel" id="creer-registre"><p class="eyebrow">Votre premier registre</p><h2>Créer le registre de mon organisation</h2><p class="help">Choisissez la phrase qui chiffre votre espace de travail. Conservez-la : elle sera nécessaire pour rouvrir le coffre et restaurer une sauvegarde.</p>
        <form onsubmit={(event) => { event.preventDefault(); void create(); }}><fieldset disabled={!ready || busy || stale}>
          <label class="field"><span>Nom de l’organisme</span><input maxlength="160" required bind:value={organizationName} autocomplete="off" placeholder="Association fictive Les Alizés" /></label>
          <label class="field"><span>Nouvelle phrase secrète</span><input type="password" required minlength="12" maxlength="1024" bind:value={phraseInput} autocomplete="new-password" /></label>
          <label class="field"><span>Confirmer la phrase secrète</span><input type="password" required maxlength="1024" bind:value={confirmation} autocomplete="new-password" /></label>
          <p class="help">Préférez une phrase longue et unique. Aucun titre métier n’est visible après verrouillage.</p>
          <label class="check"><input type="checkbox" bind:checked={acknowledged} />Je comprends qu’une phrase perdue est irrécupérable et que je dois conserver une sauvegarde chiffrée.</label>
          <button type="submit">{busy ? "Opération en cours…" : "Créer le coffre chiffré"}</button>
        </fieldset></form>
      </section>
      <section class="panel"><p class="eyebrow">02 / Coffres de ce navigateur</p><h2>Reprendre votre travail</h2>
        <p class="help">Adresse de stockage : <strong>{storageOrigin || "Vérification en cours"}</strong></p>
        {#if inventoryStatus === "loading"}<p role="status">Recherche des coffres enregistrés…</p>
        {:else if inventoryStatus === "error"}<p class="notice error" role="alert">La liste des coffres n’a pas pu être lue. Cela ne signifie pas qu’ils ont été effacés. Aucun coffre n’est créé ni remplacé par cette vérification.</p>
        {:else if stale}<p class="notice" role="status">Le stockage a changé. Rechargez la page pour relire les coffres disponibles.</p>
        {:else if records.length === 0}<p class="empty">Aucun coffre trouvé à cette adresse dans ce profil navigateur.</p>{/if}
        <button class="secondary" disabled={busy || stale || inventoryStatus === "loading"} onclick={() => void inventory?.refresh()}>Actualiser la liste des coffres</button>
        <details><summary>Je ne retrouve pas un coffre</summary><p>Revenez à l’adresse exacte et au profil navigateur utilisés lors de sa création. Le site rgpdesk.fr, la version locale et les différents ports locaux ont des stockages séparés. Une fenêtre privée peut aussi utiliser un espace distinct.</p><p>Ne créez pas un coffre de remplacement et n’effacez pas les données du site pour résoudre ce problème. Si vous avez une sauvegarde chiffrée, la restauration ci-dessous refuse d’écraser un coffre existant.</p></details>
        <ul class="records">{#each records as item, index (item.id)}<li><span>Coffre {index + 1}<small>Révision {item.revision}</small></span><button class="secondary" disabled={!ready || busy || stale} onclick={() => { selectedId = item.id; phraseInput = ""; }}>Ouvrir le coffre {index + 1}</button></li>{/each}</ul>
        {#if selectedId}<form onsubmit={(event) => { event.preventDefault(); void unlock(); }}><fieldset disabled={!ready || busy || stale}><label class="field"><span>Phrase secrète du coffre</span><input type="password" maxlength="1024" required bind:value={phraseInput} autocomplete="off" /></label><button type="submit">Déverrouiller</button></fieldset></form>{/if}
        <p class="help">Les noms et contenus restent chiffrés. Ce stockage dépend du domaine et du profil navigateur ; il peut être effacé par le navigateur ou son utilisateur.</p>
      </section>
    </div>
    <details class="panel restore"><summary>Restaurer une sauvegarde chiffrée</summary><p>Lecture locale uniquement. Une ancienne sauvegarde peut réintroduire des informations anciennes. Aucun espace existant n’est remplacé.</p>
      <form onsubmit={(event) => { event.preventDefault(); void restore(); }}><fieldset disabled={!ready || busy || stale}>
        <div class="field"><label for="privacy-backup-file">Fichier de sauvegarde RGPDESK</label><input id="privacy-backup-file" aria-describedby="privacy-backup-hint" type="file" accept=".rgpdesk" bind:this={fileInput} onchange={(event) => { restoreFile = event.currentTarget.files?.[0] ?? null; }} /><small id="privacy-backup-hint">12 Mio maximum ; aucun fichier justificatif.</small></div>
        <label class="field"><span>Phrase secrète de la sauvegarde</span><input type="password" required maxlength="1024" bind:value={phraseInput} autocomplete="off" /></label>
        <label class="check"><input type="checkbox" bind:checked={restoreAcknowledged} />Je souhaite réintroduire les données de cette sauvegarde dans ce profil.</label><button type="submit">Restaurer dans ce navigateur</button>
      </fieldset></form>
    </details>
  {/if}

  <aside class="limits"><span class="icon-tile"><Icon name="shield" size={24} /></span><div><h2>Vous documentez. Vous gardez les décisions.</h2><p>Ni score de conformité, ni choix juridique automatique. Aucun upload, compte ou synchronisation. N’insérez pas de listes de personnes, mots de passe ou pièces d’identité.</p><p>Verrouillage après 15 minutes d’inactivité ou 1 minute en arrière-plan. Le chiffrement ne protège pas une session ouverte sur un poste ou navigateur compromis. Les modifications non enregistrées sont abandonnées au verrouillage.</p><p>Le travail peut continuer sans réseau après chargement de la page. Le rechargement hors ligne n’est pas garanti.</p></div></aside>
  <button class="text-button danger" disabled={!ready || busy || stale} onclick={() => showWipe = !showWipe}>Effacer les coffres RGPDESK de ce profil</button>
  {#if showWipe}<section class="panel danger-panel"><h2>Effacement local</h2><p>Tous les espaces RGPDESK de cette origine et de ce profil seront effacés. Les fichiers téléchargés, sauvegardes externes, captures et copies système ne seront pas effacés. Sauvegardez avant de poursuivre.</p><label class="field"><span>Saisissez EFFACER</span><input autocomplete="off" bind:value={wipeConfirmation} /></label><button disabled={wipeConfirmation !== "EFFACER" || busy || stale} onclick={wipe}>Confirmer l’effacement local</button></section>{/if}
</div>
