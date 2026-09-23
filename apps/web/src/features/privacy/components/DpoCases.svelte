<script lang="ts">
  import { onDestroy } from "svelte";
  import { appendDpoEvent, canonicalJson, createDpoCase, dpoChanges, knowledge, knowledgeText, putDpoCase, recordDpoReview, rightsDeadline, breachDeadline, type DpoCase, type DpoKind, type DpoReview, type Workspace } from "@rgpdesk/privacy-core";
  import { DPO_TITLES, DPO_INTRO, DPO_METHODS } from "../dpo-methods";
  import { RGPD_OFFICIAL } from "../review-methods";
  import ReviewNotebook from "./ReviewNotebook.svelte";
  import KnowledgeField from "./KnowledgeField.svelte";
  import Icon from "./Icon.svelte";
  let { workspace, busy, onSave, onEditing, onRegister, onActions, initialCaseId = "" }: { workspace: Workspace; busy: boolean; onSave: (next: Workspace) => Promise<boolean>; onEditing: (editing: boolean) => void; onRegister: () => void; onActions: (activityId: string) => void; initialCaseId?: string } = $props();
  let kind = $state<DpoKind>("interest"), draft = $state<DpoCase | null>(null), step = $state("scope"), error = $state("");
  let filter = $state("all"), ownerFilter = $state("");
  let reviewAuthor = $state(""), reviewReason = $state(""), outcome = $state<DpoReview["outcome"]>("rework");
  let eventAt = $state(""), eventAuthor = $state(""), eventText = $state(""), eventEvidence = $state("");
  let historical = $state(""), discarded = $state(false), consumed = $state("");
  $effect(() => { if (initialCaseId && consumed !== initialCaseId) { consumed = initialCaseId; const item = workspace.dpoCases.find((c) => c.id === initialCaseId); if (item) { kind = item.kind; open(item); } } });
  const today = () => new Date().toISOString().slice(0, 10);
  const now = () => new Date().toISOString();
  const exists = () => !!draft && workspace.dpoCases.some((c) => c.id === draft!.id);
  const changed = () => !draft || canonicalJson(workspace.dpoCases.find((c) => c.id === draft!.id)) !== canonicalJson($state.snapshot(draft));
  function deadline(item: DpoCase) {
    try { return item.kind === "rights" ? rightsDeadline(item.content.rights).due : item.kind === "breach" ? breachDeadline(item.content.breach.awarenessAt, item.content.breach.role) : item.content.reviewDue; }
    catch { return null; }
  }
  let visible = $derived(workspace.dpoCases.filter((c) => c.kind === kind && (!ownerFilter || c.owner.toLocaleLowerCase().includes(ownerFilter.toLocaleLowerCase())) && (filter === "all" || (filter === "review" ? dpoChanges(workspace, c).length > 0 : !!deadline(c) && deadline(c)!.slice(0, 10) <= today()))));
  function open(item?: DpoCase) {
    draft = item ? structuredClone($state.snapshot(item)) : createDpoCase(workspace.id, crypto.randomUUID(), kind);
    if (!item) draft.title = "";
    discarded = false; step = "scope"; historical = ""; error = ""; onEditing(true);
  }
  function close() { if (changed() && !discarded) { discarded = true; return; } discarded = false; draft = null; error = ""; onEditing(false); }
  onDestroy(() => onEditing(false));
  async function save() {
    if (!draft) return;
    error = "";
    try {
      const next = putDpoCase($state.snapshot(workspace), $state.snapshot(draft), workspace.revision, now());
      if (await onSave(next)) draft = structuredClone(next.dpoCases.find((c) => c.id === draft!.id)!);
    } catch { error = "Enregistrement refusé. Vérifiez le titre, les dates, le périmètre et les limites. Pour l’intérêt légitime, choisissez une finalité responsable qui n’a pas déjà son dossier."; }
  }
  async function record(which: "event" | "review") {
    if (!draft || changed()) { error = "Enregistrez d’abord vos modifications avant d’ajouter un événement ou une revue."; return; }
    try {
      const master = $state.snapshot(workspace), at = now();
      const next = which === "event" ? appendDpoEvent(master, draft.id, { id: crypto.randomUUID(), at: eventAt, author: eventAuthor.trim(), description: eventText.trim(), evidence: knowledge(eventEvidence) }, master.revision, at)
        : recordDpoReview(master, draft.id, { id: crypto.randomUUID(), author: reviewAuthor.trim(), reason: reviewReason.trim(), outcome }, master.revision, at);
      if (await onSave(next)) { draft = structuredClone(next.dpoCases.find((c) => c.id === draft!.id)!); error = ""; eventAt = eventAuthor = eventText = eventEvidence = reviewReason = ""; }
    } catch { error = "Ajout refusé. Renseignez l’auteur, le contenu, une date UTC valide pour l’événement et vérifiez les limites d’historique."; }
  }
</script>
<section class="dpo-workbench" aria-label="Dossiers du DPO">
  {#if error}<p class="notice error" role="alert">{error}</p>{/if}
  {#if !draft}
    <nav class="dpo-kind-nav" aria-label="Types de dossiers">{#each Object.entries(DPO_TITLES) as [key, title]}<button class="secondary" class:active={kind === key} aria-pressed={kind === key} disabled={busy} onclick={() => kind = key as DpoKind}><Icon name={key === "transfer" ? "flows" : key === "breach" ? "shield" : key === "rights" ? "parties" : "analysis"} /><span>{title}</span></button>{/each}</nav>
    <header class="dpo-case-cover"><div><p class="eyebrow">Atelier / {DPO_TITLES[kind]}</p><h2>{DPO_TITLES[kind]}</h2><p>{DPO_INTRO[kind]}</p><button disabled={busy || workspace.dpoCases.length >= 200} onclick={() => open()}>Ouvrir un dossier <Icon name="plus" /></button></div><div class="dpo-cover-index" aria-hidden="true">{({interest:"IL",transfer:"TF",rights:"DR",breach:"VI"})[kind]}<span>Faits / preuves / décisions</span></div></header>
    <div class="filters"><label class="field">Afficher<select bind:value={filter}><option value="all">Tous les dossiers</option><option value="review">À examiner ou réexaminer</option><option value="due">Échéance atteinte</option></select></label><label class="field">Responsable du suivi<input bind:value={ownerFilter} maxlength="160" placeholder="Filtrer par responsable" /></label></div>
    <ul class="records">{#each visible as item}<li><span class="record-icon"><Icon name="folder" /></span><div class="grow"><strong>{item.title}</strong><p>{item.owner || "Suivi à affecter"} · {item.reviews.length} revue(s) conservée(s) · {item.reviews.at(-1)?.outcome === "closed" ? "Clôture déclarée" : "Dossier en suivi"}</p><p>{dpoChanges(workspace, item).join(" · ") || "Pas de changement détecté depuis la revue"}</p>{#if deadline(item)}<p>Échéance / repère : {deadline(item)}</p>{/if}</div><button class="secondary" disabled={busy} onclick={() => open(item)}>Ouvrir {item.title}</button></li>{/each}</ul>
    {#if !visible.length}<p class="empty">Aucun dossier pour cette sélection. Commencez par un cas concret, même si certaines réponses manquent.</p>{/if}
    <p class="help">Les dossiers sont conservés dans le coffre et sa sauvegarde chiffrée. Aucune réponse ou notification n’est envoyée. Aucun rappel n’est garanti lorsque la page est fermée.</p>
  {:else}
    <header class="section-heading"><div><p class="eyebrow">{DPO_TITLES[draft.kind]} / dossier de travail</p><h2>{draft.title || "Nouveau dossier"}</h2></div><button class="secondary" disabled={busy} onclick={close}>Fermer le dossier</button></header>
    <p class="help">Enregistrez avant de fermer. Les saisies non enregistrées seront abandonnées. Une revue conserve l’analyse et le contexte du registre à sa date.</p>
    <nav class="dpo-step-nav" aria-label="Parcours du dossier">{#each [["scope","01 Cadrage"],["analysis","02 Analyse"],["events","03 Chronologie"],["review","04 Revue & historique"]] as [key,label]}<button class="secondary" class:active={step === key} disabled={busy} onclick={() => step = key}>{label}</button>{/each}</nav>
    <fieldset disabled={busy}>
    {#if discarded}<p class="notice">Des modifications ne sont pas enregistrées. Enregistrez-les ou fermez à nouveau pour les abandonner.</p><button onclick={async () => { await save(); discarded = false; }}>Enregistrer les modifications</button>{/if}
    {#if step === "scope"}
      <div class="grid-two"><label class="field">Titre du dossier<input maxlength="160" bind:value={draft.title} placeholder="Une référence de dossier, sans nom de personne" /></label><label class="field">Responsable du suivi<input maxlength="160" bind:value={draft.owner} placeholder="Fonction ou équipe" /></label></div>
      <p class="help">Évitez les données nominatives inutiles. Conservez pièces d’identité, listes de personnes et documents originaux dans les circuits sécurisés de votre organisation.</p>
      {#if draft.kind === "interest"}
        <label class="field">Activité responsable<select disabled={exists()} value={draft.activityIds[0] ?? ""} onchange={(e) => { if (draft) { draft.activityIds = e.currentTarget.value ? [e.currentTarget.value] : []; draft.purposeId = null; } }}><option value="">Choisir une activité</option>{#each workspace.activities.filter((a) => a.role === "controller") as a}<option value={a.id}>{a.title}</option>{/each}</select></label>
        {@const activity = workspace.activities.find((a) => a.id === draft!.activityIds[0])}
        <label class="field">Finalité examinée<select disabled={exists()} bind:value={draft.purposeId}><option value={null}>Choisir une finalité</option>{#if activity?.role === "controller"}{#each activity.purposes as p,index}<option value={p.id}>{knowledgeText(p.description) || `Finalité ${index + 1} à décrire`}</option>{/each}{/if}</select></label>
        <p class="help">Une analyse par finalité. Le fondement du registre reste inchangé : aucun choix automatique. Si la finalité manque, fermez ce dossier puis complétez la fiche du registre.</p>
      {:else}<fieldset class="choices"><legend>Activités concernées, si identifiées</legend>{#each workspace.activities as a}<label><input type="checkbox" checked={draft.activityIds.includes(a.id)} onchange={(e) => { if (draft) draft.activityIds = e.currentTarget.checked ? [...draft.activityIds,a.id] : draft.activityIds.filter((id) => id !== a.id); }} />{a.title}</label>{/each}</fieldset>{/if}
      {#if draft.activityIds.length}<details class="panel"><summary>Contexte relié, documents et actions</summary>{#each draft.activityIds as aid}{@const a = workspace.activities.find((v) => v.id === aid)}{#if a}<h4>{a.title}</h4><p>{a.flows.length} flux décrit(s) · {workspace.actions.filter((action) => action.activityId === aid && !action.closure).length} action(s) ouverte(s)</p><ul>{#each workspace.documents.filter((d) => d.activityIds.includes(aid)) as doc}<li>{doc.title} · {doc.status === "reviewed" ? "Revue déclarée" : "À examiner"}</li>{/each}</ul><button class="secondary" disabled={changed()} onclick={() => { draft = null; onEditing(false); onActions(aid); }}>Voir les actions de cette activité</button>{/if}{/each}<p class="help">Enregistrez avant de rejoindre les actions. La prochaine revue conservera le contexte actuel des activités, flux, acteurs et références.</p></details>{/if}
      <label class="field">Prochain réexamen<input type="date" value={draft.content.reviewDue ?? ""} onchange={(e) => { if (draft) draft.content.reviewDue = e.currentTarget.value || null; }} /></label>
      {#if draft.kind === "rights"}
        <h3>Échéance et régime applicable</h3><p>Le calcul général concerne l’article 12. Les accès aux dossiers médicaux, régimes particuliers et situations de suspension nécessitent un examen distinct et une échéance manuelle motivée.</p>
        <div class="grid-two"><label class="field">Date de réception retenue<input type="date" value={draft.content.rights.receivedOn ?? ""} onchange={(e) => { if (draft) draft.content.rights.receivedOn = e.currentTarget.value || null; }} /></label><label class="field">Régime examiné<select bind:value={draft.content.rights.regime}><option value="unknown">À examiner</option><option value="general">Régime général article 12</option><option value="special">Régime particulier / examen manuel</option></select></label></div>
        <label class="field">Jours fériés applicables au calcul<textarea rows="2" value={draft.content.rights.holidays.join("\n")} placeholder="AAAA-MM-JJ, une date par ligne" onchange={(e) => { if (draft) draft.content.rights.holidays = e.currentTarget.value.split(/\s+/).filter(Boolean); }}></textarea></label>
        <label class="check"><input type="checkbox" bind:checked={draft.content.rights.calendarConfirmed} />J’ai vérifié le régime général, la date de réception et la liste des jours fériés applicables. Les samedis et dimanches sont exclus pour le dernier jour.</label>
        <label class="field">Prolongation décidée<select bind:value={draft.content.rights.extensionMonths}><option value={0}>Aucune prolongation</option><option value={1}>Un mois supplémentaire</option><option value={2}>Deux mois supplémentaires</option></select></label>
        {#if draft.content.rights.extensionMonths}<KnowledgeField label="Motif de prolongation" bind:value={draft.content.rights.extensionReason} hint="Complexité et nombre de demandes : motivez le besoin réel." /><label class="field">Date d’information de la personne<input type="date" value={draft.content.rights.extensionNotifiedOn ?? ""} onchange={(e) => { if (draft) draft.content.rights.extensionNotifiedOn = e.currentTarget.value || null; }} /></label><p class="help">Sans motif et information déclarée dans le délai initial, l’échéance prolongée n’est pas calculée. Consignez la référence d’envoi dans la chronologie.</p>{/if}
        <details><summary>Échéance manuelle motivée</summary><label class="field">Échéance retenue<input type="date" value={draft.content.rights.manualDue ?? ""} onchange={(e) => { if (draft) draft.content.rights.manualDue = e.currentTarget.value || null; }} /></label><KnowledgeField label="Fondement et calcul de l’échéance manuelle" bind:value={draft.content.rights.manualReason} /></details>
        <p class="notice">Échéance selon vos paramètres : <strong>{deadline(draft) || "À déterminer"}</strong>. Répondez dans les meilleurs délais. Aucun arrêt du délai n’est déduit d’un échange.</p>
        <p class="help"><a href={RGPD_OFFICIAL} target="_blank" rel="noopener noreferrer">RGPD, article 12</a> · <a href="https://www.edpb.europa.eu/system/files/documents/2023-04/edpb_guidelines_202201_data_subject_rights_access_v2_en.pdf" target="_blank" rel="noopener noreferrer">CEPD 01/2022, version 2.1, §160–164</a></p>
      {/if}
      {#if draft.kind === "breach"}
        <h3>Détection et prise de connaissance</h3><p>Dates UTC explicites, par exemple 2026-09-23T08:30:00.000Z. Le repère de 72 heures utilise une durée écoulée, y compris lors d’un changement d’heure.</p>
        <label class="field">Détection, en UTC<input value={draft.content.breach.detectedAt ?? ""} maxlength="24" placeholder="AAAA-MM-JJTHH:mm:ss.000Z" onchange={(e) => { if (draft) draft.content.breach.detectedAt = e.currentTarget.value || null; }} /></label><label class="field">Prise de connaissance, en UTC<input value={draft.content.breach.awarenessAt ?? ""} maxlength="24" placeholder="AAAA-MM-JJTHH:mm:ss.000Z" onchange={(e) => { if (draft) draft.content.breach.awarenessAt = e.currentTarget.value || null; }} /></label>
        <label class="field">Rôle dans cet incident<select bind:value={draft.content.breach.role}><option value="unknown">À examiner</option><option value="controller">Responsable</option><option value="processor">Sous-traitant</option></select></label>
        <p class="notice">{draft.content.breach.role === "processor" ? "Informer le responsable dans les meilleurs délais. Aucun délai standard de 72 heures n’est attribué au sous-traitant." : `Repère 72 heures : ${deadline(draft) || "À déterminer"}. Ce repère ne décide pas si une notification est requise ; le responsable examine les risques et notifie dans les meilleurs délais, si possible avant ce repère.`}</p><a href={RGPD_OFFICIAL} target="_blank" rel="noopener noreferrer">RGPD, articles 33 et 34</a>
      {/if}
      <div class="actions"><button onclick={() => step = "analysis"}>Poursuivre l’analyse <Icon name="arrow" /></button><button class="secondary" onclick={save}>Enregistrer le dossier</button></div>
    {:else if step === "analysis"}
      <ReviewNotebook bind:notes={draft.content.notes} questions={DPO_METHODS[draft.kind]} prefix={DPO_TITLES[draft.kind]} edition="Questions RGPDESK · 23 septembre 2026" />
      <div class="actions"><button onclick={save}>Enregistrer le dossier</button><button class="secondary" onclick={() => step = "review"}>Préparer la revue</button></div>
    {:else if step === "events"}
      <h3>Une chronologie conservée</h3><p>Déclarez les faits, décisions opérationnelles, envois initiaux et compléments. Une erreur se corrige par un nouvel événement explicatif ; les événements enregistrés restent intacts.</p>
      <ol class="dpo-timeline">{#each draft.events as e}<li><strong>{e.at} · {e.author}</strong><p>{e.description}</p><p>{knowledgeText(e.evidence) || "Référence non renseignée"}</p></li>{/each}</ol>
      <label class="field">Date de l’événement, en UTC<input bind:value={eventAt} placeholder="AAAA-MM-JJTHH:mm:ss.000Z" maxlength="24" /></label><label class="field">Auteur déclaré de l’événement<input bind:value={eventAuthor} maxlength="160" /></label><label class="field">Événement ou complément<textarea bind:value={eventText} maxlength="4000"></textarea></label><label class="field">Référence justificative<textarea bind:value={eventEvidence} maxlength="4000"></textarea></label>
      <button disabled={!exists() || draft.events.length >= 40} onclick={() => record("event")}>Conserver cet événement</button>
    {:else}
      <h3>Décider, puis pouvoir expliquer</h3><p>La revue conserve vos notes et le contexte lié du registre. « Revue effectuée » ou « clôture » décrit votre décision ; aucun de ces états ne certifie une conformité ou un envoi.</p>
      <ul>{#each dpoChanges(workspace, draft) as change}<li>{change}</li>{/each}</ul>
      <label class="field">Auteur déclaré de la revue<input bind:value={reviewAuthor} maxlength="160" /></label><label class="field">Position<select bind:value={outcome}><option value="rework">Travail à approfondir</option><option value="reviewed">Revue effectuée, position motivée ci-dessous</option><option value="closed">Clôture déclarée du dossier</option></select></label><label class="field">Motivation et suites<textarea bind:value={reviewReason} maxlength="4000"></textarea></label><button disabled={!exists() || draft.reviews.length >= 8} onclick={() => record("review")}>Conserver cette revue</button>
      <h3>Relire une revue conservée</h3><label class="field">Revue historique<select bind:value={historical}><option value="">Choisir une revue</option>{#each draft.reviews as r,index}<option value={r.id}>Revue {index + 1} · {r.at} · {r.author}</option>{/each}</select></label>
      {@const review = draft.reviews.find((r) => r.id === historical)}
      {#if review}<article class="panel" aria-label="Revue historique"><h4>{review.at} · {review.author}</h4><p>{review.reason}</p><p>Contexte conservé : {review.context.organization.name} · {review.context.activities.map((c) => c.activity.title).join(" · ")}</p>{#each review.content.notes as note}<details><summary>{DPO_METHODS[draft.kind].find((q) => q.id === note.questionId)?.title}</summary><dl>{#each [["Faits",note.facts],["Preuves",note.evidence],["Objections",note.objections],["Appréciation",note.assessment],["Suites",note.followUp]] as pair}<dt>{pair[0]}</dt><dd>{knowledgeText(pair[1] as import("@rgpdesk/privacy-core").Knowledge) || "À documenter"}</dd>{/each}</dl></details>{/each}</article>{/if}
    {/if}
    </fieldset>
  {/if}
  {#if !draft}<button class="text-button" disabled={busy} onclick={onRegister}>Retrouver les activités du registre <Icon name="arrow" /></button>{/if}
</section>
