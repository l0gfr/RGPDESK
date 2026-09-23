<script lang="ts">
  import { VaultInventory } from "../persistence/inventory";
  import { onMount, tick } from "svelte";
  import { recordPiaPublication, renderPiaPublication, type PiaPublication, createActivity, createWorkspace, evaluateWorkspace, putActivity, putParty, putSystem, reviseWorkspace, MAX_BACKUP_BYTES, PrivacyError, type Activity, type Workspace } from "@rgpdesk/privacy-core";
  import { assertLocalPassphrase } from "../../../lib/local-encryption";
  import { subscribeToSensitivePageLock } from "../../../lib/sensitive-page-lock";
  import { checkSession, PrivacyVault, PRIVACY_CHANNEL, type VaultItem, type VaultSession } from "../persistence/vault";
  import { errorMessage, fr } from "../i18n/fr";
  import { zipFiles } from "@rgpdesk/privacy-verifier";
  import Icon from "./Icon.svelte";
  import ProcessingAtlas from "./ProcessingAtlas.svelte";
  import DpoCases from "./DpoCases.svelte";
  import PiaSharing from "./PiaSharing.svelte";
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
  import { DemoSession } from "../demo-session";
  import DemoOverview from "./DemoOverview.svelte";
  import DemoGuide from "./DemoGuide.svelte";
  import type { DemoPanel } from "../demo-journey";
  import { startingPoints, type StartingPoint } from "../guidance";
  import WorkspaceSearch from "./WorkspaceSearch.svelte";
  import type { SearchResult } from "../search";

  let demo = $state(false);
  let hydrated = $state(false);
  let demoSession: DemoSession | undefined;
  let demoPhrase = $state("");
  let demoConfirmation = $state("");
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
  let dpoCaseId = $state("");
  let documentId = $state("");
  let piaActivityId = $state("");
  let searchOpen = $state(false);
  let searchNavigation = $state(0);
  let searchButton: HTMLButtonElement | undefined = $state();
  let panel: "dpo" | "pia-sharing" | "pia" | "analysis" | "flows" | "overview" | "register" | "organization" | "parties" | "systems" | "backup" | "import" | "documents" | "actions" | "delivery" = $state("overview");
  let piaEditing = $state(false);
  let missingOnly = $state(false);
  let registerRole = $state("");
  let findings = $derived(master ? evaluateWorkspace(master, new Date().toISOString().slice(0, 10)) : []);
  let editor: Activity | null = $state(null);
  let searchCanNavigate = $derived(!busy && !editor && !piaEditing && ["overview", "register", "analysis", "flows", "pia", "dpo"].includes(panel));
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
    demoSession?.clear();
    demoSession = undefined;
    demo = false;
    demoPhrase = demoConfirmation = "";
    showWipe = false;
    wipeConfirmation = "";
    phrase = "";
    phraseInput = "";
    confirmation = "";
    organizationName = "";
    master = null;
    searchOpen = false;
    dpoCaseId = documentId = piaActivityId = "";
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
    if ((!ready && !demo) || busy || stale) return;
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

  async function exploreDemo() {
    if (!hydrated || master || busy || stale) return;
    lock("");
    demo = true;
    await run(async (current) => {
      const created = new DemoSession(() => crypto.randomUUID(), now());
      checkSession(current);
      demoSession = created;
      master = created.read();
      await revealWorkspace(current);
    });
    if (!master) demo = false;
  }
  function leaveDemo() {
    lock("Démo terminée. Vos coffres personnels n’ont pas été modifiés.");
    void inventory?.refresh();
    void tick().then(() => document.getElementById("explorer-demo")?.focus());
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
    if (demoSession) next = demoSession.save(next);
    else await vault!.save(next, phrase, master.revision, current);
    checkSession(current);
    master = next;
    editor = null;
    message = demo ? "Modifications conservées pour cette visite uniquement." : fr.saved;
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

  async function changeClient(createNew = false) {
    if (!searchCanNavigate || demo) return;
    lock("Registre verrouillé. Choisissez un autre coffre ou créez celui de votre prochain client.");
    await inventory?.refresh();
    await tick();
    document.getElementById(createNew ? "create-client-name" : "client-vaults-title")?.focus();
    document.getElementById(createNew ? "creer-registre" : "client-vaults")?.scrollIntoView({ block: "start" });
  }

  async function closeSearch() {
    searchOpen = false;
    await tick();
    searchButton?.focus();
  }
  async function openSearchResult(result: SearchResult) {
    if (!master || !searchCanNavigate) return;
    if (result.kind === "activity") {
      const activity = master.activities.find((item) => item.id === result.id);
      if (!activity) return;
      editorSection = "record"; editorExample = undefined;
      editor = structuredClone($state.snapshot(activity)); panel = "register";
    } else if (result.kind === "dpo") {
      if (!master.dpoCases.some((item) => item.id === result.id)) return;
      dpoCaseId = result.id; panel = "dpo";
    } else if (result.kind === "document") {
      if (!master.documents.some((item) => item.id === result.id)) return;
      documentId = result.id; panel = "documents";
    } else {
      const pia = master.impactAssessments.find((item) => item.id === result.id);
      if (!pia) return;
      piaActivityId = pia.activityId; panel = "pia";
    }
    searchOpen = false;
    searchNavigation += 1;
    await tick();
    workspaceHeading?.focus({ preventScroll: true });
    workspaceHeading?.scrollIntoView({ block: "start" });
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
      if (demoSession) {
        const next = await demoSession.deliver(master.id, prepared.revision, prepared.register, prepared.files);
        checkSession(current); master = next;
        download(bytes, "rgpdesk-demonstration-dossier.zip");
        message = "Dossier fictif préparé. Son historique reste dans cette visite uniquement.";
        return;
      }
      const next = await vault!.deliver($state.snapshot(master), prepared.register, prepared.files, prepared.revision, phrase, current);
      checkSession(current); master = next;
      await vault!.assertCurrent(next.id, next.revision, current);
      checkSession(current); download(bytes, "rgpdesk-dossier.zip");
      message = "Dossier préparé et instantané chiffré conservé. Vérifiez le fichier téléchargé avant de le transmettre.";
    });
  }
  function downloadHtml(html: string) {
    const url = URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" }));
    const anchor = document.createElement("a");
    try { anchor.href = url; anchor.download = "rgpdesk-aipd.html"; document.body.append(anchor); anchor.click(); }
    finally { anchor.remove(); URL.revokeObjectURL(url); }
  }
  async function deliverPia(p: PiaPublication) {
    let completed = false;
    await run(async (current) => {
      if (!master || master.id !== p.workspaceId || master.revision !== p.revision) throw new PrivacyError("CONFLICT");
      const html = await renderPiaPublication(p);
      checkSession(current);
      if (!master || master.revision !== p.revision) throw new PrivacyError("CONFLICT");
      const next = recordPiaPublication($state.snapshot(master), p, p.revision, now());
      await persist(next, current);
      if (!demoSession) await vault!.assertCurrent(next.id, next.revision, current);
      checkSession(current); downloadHtml(html);
      completed = true;
      message = "Contenu de la restitution conservé. Vérifiez le rapport HTML téléchargé avant de le transmettre.";
    });
    return completed;
  }
  async function downloadPia(id: string) {
    await run(async (current) => {
      if (!master) throw new PrivacyError("LOCKED");
      const frozen = $state.snapshot(master), p = frozen.piaPublications.find((p) => p.id === id);
      if (!p) throw new PrivacyError("INVALID");
      const html = await renderPiaPublication(p);
      if (!demoSession) await vault!.assertCurrent(frozen.id, frozen.revision, current);
      checkSession(current); downloadHtml(html);
    });
  }
  async function downloadDelivery(id: string) {
    await run(async (current) => {
      if (!master) throw new PrivacyError("LOCKED");
      const frozen = $state.snapshot(master);
      const practice = demoSession;
      const files = practice ? practice.files(id) : await vault!.deliveryFiles(frozen, id, phrase, current);
      const bytes = await zipFiles(files);
      if (!practice) await vault!.assertCurrent(frozen.id, frozen.revision, current);
      checkSession(current); download(bytes, practice ? "rgpdesk-demonstration-dossier.zip" : "rgpdesk-dossier.zip");
      message = "Instantané historique préparé, sans recalcul avec les données actuelles.";
    });
  }

  async function navigateDemo(next: DemoPanel | "overview") {
    if (!demo || !master || busy || editor || piaEditing) return;
    const current = session();
    dpoCaseId = documentId = piaActivityId = "";
    panel = next;
    await tick();
    if (current.signal.aborted || !demo || !master) return;
    workspaceHeading?.focus({ preventScroll: true });
    workspaceHeading?.scrollIntoView({ block: "start" });
  }
  async function openDemoExample() {
    if (!demo || !master || busy || editor || piaEditing) return;
    const current = session();
    const activity = master.activities.find((a) => a.id === master!.impactAssessments[0]?.activityId) ?? master.activities[0];
    if (!activity) return;
    if (panel === "register") {
      editorSection = "record"; editorExample = undefined;
      editor = structuredClone($state.snapshot(activity));
    } else if (panel === "pia" && master.impactAssessments.some((p) => p.activityId === activity.id)) {
      piaActivityId = activity.id;
      searchNavigation += 1;
    }
    await tick();
    if (current.signal.aborted || !demo || !master) return;
    const heading = panel === "pia" ? document.querySelector<HTMLElement>(".pia-dossier h3") : document.getElementById("activity-editor-title");
    heading?.focus({ preventScroll: true });
    heading?.scrollIntoView({ block: "start" });
  }

  async function downloadBackup() {
    await run(async (current) => {
      if (!master) throw new PrivacyError("LOCKED");
      const snapshot = $state.snapshot(master);
      const practice = demoSession;
      if (practice) {
        if (demoPhrase !== demoConfirmation) throw new PrivacyError("INVALID");
        assertLocalPassphrase(demoPhrase);
      }
      const text = practice ? await practice.backup(demoPhrase) : await vault!.backup(snapshot, phrase, current);
      // Final guard immediately before the synchronous download gesture.
      if (!practice) await vault!.assertCurrent(snapshot.id, snapshot.revision, current);
      checkSession(current);
      const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
      const anchor = document.createElement("a");
      try {
        anchor.href = url;
        anchor.download = practice ? "rgpdesk-demonstration.rgpdesk" : "rgpdesk-sauvegarde.rgpdesk";
        document.body.append(anchor);
        anchor.click();
      } finally { anchor.remove(); URL.revokeObjectURL(url); }
      demoPhrase = demoConfirmation = "";
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
    if (demo || wipeConfirmation !== "EFFACER" || busy || stale) return;
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
    hydrated = true;
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
  <div class="notice-strip"><span class="status-dot" aria-hidden="true"></span> {demo ? "Démonstration interactive" : "Espace local & confidentiel"} <span><Icon name={demo ? "eye" : "lock"} size={14} /> {demo ? "Exercice fictif en mémoire uniquement" : "Chiffrement sur cet appareil"}</span></div>
  {#if demo}<aside class="demo-mode" aria-label="Mode démonstration"><span class="demo-mode-tag">DÉMO</span><p><strong>Essayez avec des données fictives.</strong> Cette visite disparaît à la fermeture ou au rechargement. Aucun coffre personnel n’est modifié.</p><button class="text-button" onclick={leaveDemo}>Quitter la démo <Icon name="arrow" size={16} /></button></aside>{/if}
  {#if error}<p class="notice error" role="alert">{error}</p>{/if}
  {#if message}<p class="notice" role="status">{message}</p>{/if}
  {#if stale}<a class="button" href="/app/privacy/">Recharger l’application</a>{/if}
  {#if inventoryStatus === "loading"}<p role="status">Lecture des coffres de ce navigateur…</p>{/if}

  {#if master}
    <div class="desk-layout">
    <aside class="desk-sidebar"><div class="sidebar-caption"><span class="workspace-avatar">{master.organization.name.slice(0, 1).toUpperCase()}</span><div><small>{demo ? "DOSSIER FICTIF" : "VOTRE ESPACE"}</small><h2>{master.organization.name}</h2><small>{master.activities.length} fiche(s) dans votre registre</small></div></div>
      <p class="nav-label">Dossier de l’organisation</p><nav class="tabs" aria-label="Espace RGPD">
      {#each [["overview", "Ma mission"], ["register", "Registre"], ["flows", "Cartographie"], ["analysis", "Analyse"], ["pia", "AIPD / PIA"], ["dpo", "Dossiers DPO"], ["organization", "Organisation"], ["parties", "Intervenants"], ["systems", "Systèmes"], ["documents", "Documents"], ["actions", "Actions & décisions"]] as [key, label]}
        <button aria-label={label} class:active={panel === key} aria-current={panel === key ? "page" : undefined} disabled={busy || editor !== null || piaEditing} onclick={() => { actionActivityId = ""; dpoCaseId = documentId = piaActivityId = ""; panel = key as typeof panel; }}><Icon name={key === "pia" || key === "dpo" ? "analysis" : key === "pia-sharing" ? "delivery" : key} /><span>{label}</span>{#if key === "register"}<small>{master.activities.length}</small>{/if}</button>
      {/each}</nav><p class="nav-label">Circulation du dossier</p><nav class="tabs" aria-label="Opérations locales">{#each [["import", "Importer un CSV"], ["delivery", "Partager un dossier"], ["pia-sharing", "Restitution AIPD"], ["backup", "Sauvegarde"]] as [key, label]}<button aria-label={label} class:active={panel === key} aria-current={panel === key ? "page" : undefined} disabled={busy || editor !== null || piaEditing} onclick={() => { actionActivityId = ""; dpoCaseId = documentId = piaActivityId = ""; panel = key as typeof panel; }}><Icon name={key === "pia" || key === "dpo" ? "analysis" : key === "pia-sharing" ? "delivery" : key} /><span>{label}</span></button>{/each}</nav>
      <div class="sidebar-security"><Icon name="shield" size={25} /><strong>{demo ? "Un espace pour essayer." : "Votre appareil. Votre coffre."}</strong><p>{demo ? "L’exercice reste en mémoire dans cet onglet. Aucun enregistrement automatique." : "Les informations restent ici. Pensez à votre sauvegarde chiffrée."}</p></div>
    </aside><div class="desk-workspace">
    <div class="workspace-utilities"><span><Icon name="lock" size={14} />{demo ? "Démonstration locale" : "Coffre ouvert sur cet appareil"}</span><button bind:this={searchButton} class="secondary" aria-expanded={searchOpen} aria-controls="workspace-search" disabled={busy} onclick={() => { searchOpen = !searchOpen; }}><Icon name="search" size={18} />Rechercher dans le coffre</button></div>
    {#if searchOpen}<WorkspaceSearch workspace={master} canNavigate={searchCanNavigate} onOpen={openSearchResult} onClose={closeSearch} />{/if}
    {#if !demo}<div class="client-switcher"><span>Registre de <strong>{master.organization.name}</strong><small>Repère du coffre : {master.id}</small></span><div><button class="text-button" disabled={!searchCanNavigate} title={searchCanNavigate ? "Verrouiller ce registre et revenir aux coffres" : "Terminez votre saisie puis revenez à Ma mission"} onclick={() => changeClient()}>Changer de registre</button><button class="text-button" disabled={!searchCanNavigate} title={searchCanNavigate ? "Créer un coffre distinct" : "Terminez votre saisie puis revenez à Ma mission"} onclick={() => changeClient(true)}>Ajouter un client</button></div></div>{/if}
    <header class="workspace-heading"><div><p class="eyebrow">{master.organization.name} · Espace de travail</p><h1 bind:this={workspaceHeading} tabindex="-1">{panel === "dpo" ? "Les dossiers de votre mission." : panel === "pia-sharing" ? "Restituer votre analyse d’impact." : panel === "pia" ? "Votre atelier d’impact." : panel === "analysis" ? "Votre analyse, point par point." : panel === "flows" ? "Votre carte des flux." : panel === "overview" ? "Votre mission, étape par étape." : panel === "register" ? "Votre registre RGPD." : panel === "documents" ? "Vos références documentaires." : panel === "actions" ? "Vos actions et décisions." : panel === "delivery" ? "Préparer un dossier à partager." : panel === "import" ? "Importer un registre CSV." : panel === "backup" ? "Sauvegarder votre travail." : panel === "organization" ? "Votre organisation." : panel === "parties" ? "Les acteurs du traitement." : "Les moyens du traitement."}</h1></div><button class="secondary lock-button" onclick={() => demo ? leaveDemo() : lock()}><Icon name={demo ? "arrow" : "lock"} />{demo ? "Retrouver mes coffres" : "Verrouiller le coffre"}</button></header>
    {#if !demo}<p class="backup-status"><Icon name="backup" size={15} />{backupRevision === master.revision ? "Sauvegarde préparée pendant cette séance : vérifiez le fichier sur votre disque." : "Avant de terminer votre séance, téléchargez une sauvegarde de votre travail."}</p>{/if}
    {#if demo}<DemoGuide {panel} {busy} editing={editor !== null || piaEditing}
      actionLabel={panel === "register" && master.activities.length ? "Ouvrir la fiche d’exemple" : panel === "pia" && master.impactAssessments.length ? "Lire l’AIPD d’exemple" : undefined}
      onAction={() => void openDemoExample()} onNavigate={(next) => void navigateDemo(next)} />{/if}
    {#if editor}
      <p class="help">Enregistrez avant de quitter cette fiche. Le verrouillage abandonne les modifications non enregistrées.</p>
      {#key editor.id}<ActivityEditor initialSection={editorSection} initial={$state.snapshot(editor)} workspace={master} example={editorExample} {busy} onSave={saveActivity} onCancel={() => editor = null} />{/key}
    {:else if panel === "overview"}
      {#if demo}<DemoOverview {busy} onNavigate={(next) => void navigateDemo(next)} />{:else}<MissionOverview workspace={master} {busy} onCase={(id) => { dpoCaseId = id; panel = "dpo"; }} onNavigate={(next) => { actionActivityId = ""; panel = next; }} onEdit={(activity) => { editorSection = "record"; editorExample = undefined; editor = structuredClone($state.snapshot(activity)); panel = "register"; }} />{/if}
    {:else if panel === "dpo"}
      {#key searchNavigation}<DpoCases workspace={master} {busy} initialCaseId={dpoCaseId} onActions={(id) => { actionActivityId = id; panel = "actions"; }} onEditing={(value) => piaEditing = value} onRegister={() => panel = "register"} onSave={async (next) => { await saveNext(next); return master?.revision === next.revision; }} />{/key}
    {:else if panel === "pia-sharing"}
      {#key master.revision}<PiaSharing workspace={$state.snapshot(master)} {busy} onDeliver={deliverPia} onDownload={downloadPia} />{/key}
    {:else if panel === "pia"}
      {#key searchNavigation}<PiaPanel workspace={master} {busy} {demo} initialActivityId={piaActivityId} initialView={demo ? "read" : "edit"} onEditing={(value) => piaEditing = value} onRegister={() => panel = "register"} onSave={async (next) => { await saveNext(next); return master?.revision === next.revision; }} />{/key}
    {:else if panel === "analysis" || panel === "flows"}
      {#key panel}<AnalysisOverview workspace={master} mode={panel} initialActivityId={demo ? master.impactAssessments[0]?.activityId : undefined} {busy} onPia={() => panel = "pia"} onRegister={() => panel = "register"} onEdit={(activity, section) => { editorSection = section; editorExample = undefined; editor = structuredClone($state.snapshot(activity)); }} />{/key}
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
      {#key master.revision}<DocumentsPanel workspace={$state.snapshot(master)} {busy} initialDocumentId={documentId} onSave={saveNext} />{/key}
    {:else if panel === "actions"}
      {#key master.revision}<ActionsPanel workspace={$state.snapshot(master)} initialActivityId={actionActivityId} {busy} onSave={saveNext} />{/key}
    {:else if panel === "delivery"}
      {#key master.revision}<DeliveryPanel workspace={$state.snapshot(master)} {busy} {demo} onDeliver={deliver} onDownload={downloadDelivery} />{/key}
    {:else}
      {#if demo}<section class="panel demo-backup"><div class="section-heading"><div><p class="eyebrow">L’exercice vous appartient aussi</p><h2>Essayez une vraie sauvegarde chiffrée.</h2></div><span class="icon-tile"><Icon name="backup" size={30} /></span></div><p>Choisissez une phrase propre à cette copie fictive. Le fichier contient tout le dossier de démonstration et les versions partagées pendant la visite. Aucun coffre n’est créé sur cet appareil.</p><form onsubmit={(e) => { e.preventDefault(); void downloadBackup(); }}><fieldset disabled={busy}><div class="grid-two"><label class="field">Phrase pour la sauvegarde de démonstration<input type="password" required minlength="12" maxlength="1024" autocomplete="new-password" bind:value={demoPhrase} /></label><label class="field">Confirmer la phrase de démonstration<input type="password" required maxlength="1024" autocomplete="new-password" bind:value={demoConfirmation} /></label></div><p class="help">Préférez une phrase longue et unique. Elle sera nécessaire pour restaurer le fichier ; elle ne peut pas être récupérée.</p><button disabled={!demoPhrase || demoPhrase !== demoConfirmation} type="submit">Chiffrer et télécharger l’exercice</button></fieldset></form><p class="help">Pour essayer la restauration, quittez la démo puis utilisez « Restaurer une sauvegarde chiffrée ». Ce geste créera un coffre fictif distinct ; aucun coffre existant ne sera écrasé.</p></section>{:else}
      <section class="panel"><h2>Sauvegarde chiffrée</h2><p>Elle contient tout cet espace, y compris les notes internes. Elle sert à la restauration et n’est pas un dossier à partager avec un client.</p><p>La même phrase secrète sera nécessaire. Aucun service ne peut la récupérer pour vous.</p><button disabled={busy} onclick={downloadBackup}>Télécharger la sauvegarde chiffrée</button><p class="help">Pour tester la restauration, ouvrez RGPDESK sur un autre profil navigateur. Toute collision avec un espace existant est refusée.</p></section>{/if}
    {/if}
    <p class="catalog-caption">Un doute pendant votre travail ? <a href="/app/privacy/guide/" target="_blank" rel="noopener noreferrer">Retrouver une explication dans le guide</a>.</p></div></div>
  {:else}
    <div class="welcome-hero"><header class="intro"><p class="eyebrow"><span class="eyebrow-line"></span>{fr.welcome.eyebrow}</p><h1>{fr.welcome.title}<br /><em>{fr.welcome.subtitle}</em></h1><p>{fr.welcome.description}</p><div class="actions hero-actions"><button id="explorer-demo" disabled={!hydrated || busy || stale} onclick={exploreDemo}>Explorer la démo <Icon name="arrow" size={17} /></button><a class="button secondary" href="#creer-registre">{fr.welcome.start}</a></div><p class="hero-demo-caption">Un dossier déjà rempli. Sans compte, sans phrase secrète à créer.</p><div class="trust-row"><span><Icon name="lock" size={17} />Coffre chiffré</span><span><Icon name="shield" size={17} />Sans compte</span><span><Icon name="documents" size={17} />Partage choisi</span></div></header><ProcessingAtlas /></div>
    <section class="demo-invitation"><span class="demo-invitation-mark" aria-hidden="true">S.</span><div><p class="eyebrow">Entrez dans un dossier, pas devant une page vide</p><h2>Rencontrez Maison Sillage.</h2><p>4 activités, 7 flux, une AIPD et un dossier à partager. Un cas fictif pour essayer les gestes de votre prochaine mission.</p></div><button class="secondary" disabled={!hydrated || busy || stale} onclick={exploreDemo}>Ouvrir le dossier fictif <Icon name="arrow" /></button></section>
    <p class="business-entry"><Icon name="book" size={20} /><a href="/app/privacy/guide/#trames-metier" target="_blank" rel="noopener noreferrer">Préparer un entretien : {startingPoints.length} trames métier sourcées</a><span>RH · Commercial · Achats · Accueil · Sécurité · Prestations</span></p>
    <section class="use-cases" aria-label="Ce que vous pouvez faire avec RGPDESK">
      <article><Pictogram kind="register" /><p class="eyebrow">01 / Décrire</p><h2>Un registre structuré.</h2><p>Une fiche par activité : pourquoi ces données, pour quelles personnes, avec quels intervenants et quelles mesures.</p></article>
      <article><Pictogram kind="analysis" /><p class="eyebrow">02 / Examiner</p><h2>Des choix argumentés.</h2><p>Des flux à l’AIPD : comparez les alternatives, examinez les risques pour les personnes et reliez vos sources aux mesures et à une revue motivée.</p></article>
      <article><Pictogram kind="delivery" /><p class="eyebrow">03 / Communiquer</p><h2>Un dossier choisi et relu.</h2><p>Sélectionnez le destinataire et les activités, relisez le contenu, puis téléchargez un dossier HTML, CSV et JSON.</p></article>
    </section>
    <div class="onboarding-note"><div><h2>Votre travail reste sur votre appareil.</h2><p>Le coffre protège votre registre dans ce navigateur. Sans compte ni synchronisation, vous gardez la main sur vos sauvegardes chiffrées et vos partages.</p></div><a href="/app/privacy/guide/#2-votre-premier-registre-pas-à-pas" target="_blank" rel="noopener noreferrer">Me guider pour commencer <Icon name="arrow" size={17} /></a></div>
    <aside class="cabinet-intro"><span class="cabinet-monogram" aria-hidden="true"><Icon name="organization" size={34} /></span><div><p class="eyebrow">Un organisme, un espace dédié</p><h2>Plusieurs clients. Des registres séparés.</h2><p>DPO externe : créez un coffre par client. Chaque organisation garde ses activités, ses analyses et sa sauvegarde. Ouvrez le coffre du client concerné pour reprendre sa mission.</p><p class="help">Les noms restent chiffrés jusqu’à l’ouverture. Notez le repère de chaque coffre avec sa phrase dans votre gestionnaire de mots de passe. La recherche porte uniquement sur le client ouvert.</p></div></aside>
    <div class="grid-two vault-panels">
      <section class="panel" id="creer-registre"><p class="eyebrow">Nouvel organisme ou nouveau client</p><h2>Créer le registre de mon organisation</h2><p class="help">Choisissez la phrase qui chiffre votre espace de travail. Conservez-la : elle sera nécessaire pour rouvrir le coffre et restaurer une sauvegarde.</p>
        <form onsubmit={(event) => { event.preventDefault(); void create(); }}><fieldset disabled={!ready || busy || stale}>
          <label class="field"><span>Nom de l’organisme</span><input id="create-client-name" maxlength="160" required bind:value={organizationName} autocomplete="off" placeholder="Association fictive Les Alizés" /></label>
          <label class="field"><span>Nouvelle phrase secrète</span><input type="password" required minlength="12" maxlength="1024" bind:value={phraseInput} autocomplete="new-password" /></label>
          <label class="field"><span>Confirmer la phrase secrète</span><input type="password" required maxlength="1024" bind:value={confirmation} autocomplete="new-password" /></label>
          <p class="help">Préférez une phrase longue et unique. Aucun titre métier n’est visible après verrouillage.</p>
          <label class="check"><input type="checkbox" bind:checked={acknowledged} />Je comprends qu’une phrase perdue est irrécupérable et que je dois conserver une sauvegarde chiffrée.</label>
          <button type="submit">{busy ? "Opération en cours…" : "Créer le coffre chiffré"}</button>
        </fieldset></form>
      </section>
      <section class="panel" id="client-vaults"><p class="eyebrow">Vos clients et organisations</p><h2 id="client-vaults-title" tabindex="-1">Reprendre votre travail</h2>
        <p class="help">Vos coffres sont enregistrés sur cet appareil, dans ce navigateur. Leur contenu n’est pas envoyé au serveur RGPDESK.</p>
        {#if inventoryStatus === "loading"}<p role="status">Recherche des coffres enregistrés…</p>
        {:else if inventoryStatus === "error"}<p class="notice error" role="alert">La liste des coffres n’a pas pu être lue. Cela ne signifie pas qu’ils ont été effacés. Aucun coffre n’est créé ni remplacé par cette vérification.</p>
        {:else if stale}<p class="notice" role="status">Le stockage a changé. Rechargez la page pour relire les coffres disponibles.</p>
        {:else if records.length === 0}<p class="empty">Aucun coffre trouvé à cette adresse dans ce profil navigateur.</p>{/if}
        <button class="secondary" disabled={busy || stale || inventoryStatus === "loading"} onclick={() => void inventory?.refresh()}>Actualiser la liste des coffres</button>
        <details><summary>Je ne retrouve pas un coffre</summary><p>Site associé à ce stockage local : <strong>{storageOrigin || "Vérification en cours"}</strong>. Cette adresse permet au navigateur de retrouver les coffres ; elle ne désigne pas un stockage sur le serveur.</p><p>Revenez à l’adresse exacte et au profil navigateur utilisés lors de sa création. Le site rgpdesk.fr, la version locale et les différents ports locaux ont des stockages séparés. Une fenêtre privée peut aussi utiliser un espace distinct.</p><p>Ne créez pas un coffre de remplacement et n’effacez pas les données du site pour résoudre ce problème. Si vous avez une sauvegarde chiffrée, la restauration ci-dessous refuse d’écraser un coffre existant.</p></details>
        <ul class="records">{#each records as item, index (item.id)}<li><span>Coffre {index + 1}<small>Révision {item.revision}</small><small class="vault-reference">Repère : {item.id}</small></span><button class="secondary" disabled={!ready || busy || stale} onclick={() => { selectedId = item.id; phraseInput = ""; }}>Ouvrir le coffre {index + 1}</button></li>{/each}</ul>
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
  {#if !demo}<button class="text-button danger" disabled={!ready || busy || stale} onclick={() => showWipe = !showWipe}>Effacer les coffres RGPDESK de ce profil</button>
  {#if showWipe}<section class="panel danger-panel"><h2>Effacement local</h2><p>Tous les espaces RGPDESK de cette origine et de ce profil seront effacés. Les fichiers téléchargés, sauvegardes externes, captures et copies système ne seront pas effacés. Sauvegardez avant de poursuivre.</p><label class="field"><span>Saisissez EFFACER</span><input autocomplete="off" bind:value={wipeConfirmation} /></label><button disabled={wipeConfirmation !== "EFFACER" || busy || stale} onclick={wipe}>Confirmer l’effacement local</button></section>{/if}{/if}
</div>
