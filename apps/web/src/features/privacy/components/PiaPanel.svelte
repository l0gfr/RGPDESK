<script lang="ts">
  import { createImpactAssessment, createPiaAlternative, createPiaRisk, createPiaMeasure, putImpactAssessment, recordPiaReview, piaContext, piaReviewState, piaOpenPoints, knowledgeText, canonicalJson, type ImpactAssessment, type PiaAlternative, type PiaRisk, type PiaMeasure, type PiaReview, type Workspace } from "@rgpdesk/privacy-core";
  import { tick } from "svelte";
  import { PIA_NECESSITY_METHOD } from "../review-methods";
  import { PIA_STEPS, PIA_SOURCES, PIA_PRINCIPLE_QUESTIONS, SCREENING_LABELS, PIA_LEVELS, PIA_OUTCOMES, PIA_RISK_FIELDS, PIA_ALTERNATIVE_FIELDS, PIA_MEASURE_FIELDS } from "../pia-method";
  import ReviewNotebook from "./ReviewNotebook.svelte";
  import KnowledgeField from "./KnowledgeField.svelte";
  import PiaRiskMap from "./PiaRiskMap.svelte";
  import PiaDossier from "./PiaDossier.svelte";
  import FlowMap from "./FlowMap.svelte";
  import Icon from "./Icon.svelte";
  let { workspace, busy, demo = false, onSave, onEditing, onRegister, initialActivityId = "" }: { initialActivityId?: string; workspace: Workspace; busy: boolean; demo?: boolean; onSave: (next: Workspace) => Promise<boolean>; onEditing: (editing: boolean) => void; onRegister: () => void } = $props();
  let draft: ImpactAssessment | null = $state(null);
  let consumedSearch = $state("");
  $effect(() => {
    if (initialActivityId && consumedSearch !== initialActivityId && !draft) {
      consumedSearch = initialActivityId;
      if (workspace.impactAssessments.some((p) => p.activityId === initialActivityId)) { activityId = initialActivityId; open(initialActivityId); }
    }
  });
  let activityId = $state("");
  let step = $state(0);
  let author = $state("");
  let reason = $state("");
  let outcome: PiaReview["outcome"] = $state("rework");
  let acknowledged = $state(false);
  let localError = $state("");
  let reviewIndex: number | null = $state(null);
  let beforeRemoval: ({ kind: "alternatives"; item: PiaAlternative; index: number } | { kind: "risks"; item: PiaRisk; index: number } | { kind: "measures"; item: PiaMeasure; index: number }) | null = $state(null);
  let stepHeading: HTMLHeadingElement | undefined = $state();
  let selected = $derived(workspace.activities.find((a) => a.id === activityId) ?? workspace.activities[0]);
  let saved = $derived.by(() => draft ? workspace.impactAssessments.find((p) => p.id === draft!.id) : undefined);
  let dirty = $derived.by(() => draft ? !saved || canonicalJson(draft.content) !== canonicalJson(saved.content) : false);
  let points = $derived.by(() => draft ? piaOpenPoints(draft.content) : []);
  let context = $derived.by(() => draft ? piaContext(workspace, draft.activityId) : null);
  async function go(index: number) { step = index; await tick(); stepHeading?.focus(); }
  function open(requestedId?: string) {
    const target = requestedId ? workspace.activities.find((a) => a.id === requestedId) : selected;
    if (!target) return;
    const existing = workspace.impactAssessments.find((p) => p.activityId === target.id);
    draft = existing ? structuredClone($state.snapshot(existing)) : createImpactAssessment(workspace.id, $state.snapshot(target), crypto.randomUUID());
    step = 0; beforeRemoval = null; localError = ""; reviewIndex = null; author = ""; reason = ""; acknowledged = false; outcome = "rework"; onEditing(true);
  }
  async function save() {
    if (!draft) return;
    localError = "";
    try {
      if (await onSave(putImpactAssessment($state.snapshot(workspace), $state.snapshot(draft), workspace.revision, new Date().toISOString()))) { draft = structuredClone($state.snapshot(workspace.impactAssessments.find((p) => p.id === draft!.id)!)); beforeRemoval = null; }
    } catch { localError = "Enregistrement impossible. Vérifiez les limites et les liens du dossier. Vos saisies restent affichées."; }
  }
  async function decide() {
    if (!draft || dirty || !acknowledged) return;
    localError = "";
    try {
      if (await onSave(recordPiaReview($state.snapshot(workspace), draft.id, { id: crypto.randomUUID(), author, reason, outcome }, workspace.revision, new Date().toISOString()))) {
        draft = structuredClone($state.snapshot(workspace.impactAssessments.find((p) => p.id === draft!.id)!));
        author = ""; reason = ""; acknowledged = false; reviewIndex = draft.reviews.length - 1; await go(6);
      }
    } catch { localError = "La décision n’a pas été enregistrée. Vérifiez les points à instruire et la limite de huit revues conservées."; }
  }
  function removeDraftItem(kind: "alternatives" | "risks" | "measures", id: string) {
    if (!draft || busy || (kind === "risks" && draft.content.measures.some((m) => m.riskIds.includes(id)))) return;
    const index = draft.content[kind].findIndex((item) => item.id === id);
    if (index < 0) return;
    if (kind === "alternatives") { beforeRemoval = { kind, index, item: structuredClone($state.snapshot(draft.content.alternatives[index]!)) }; draft.content.alternatives.splice(index, 1); }
    else if (kind === "risks") { beforeRemoval = { kind, index, item: structuredClone($state.snapshot(draft.content.risks[index]!)) }; draft.content.risks.splice(index, 1); }
    else { beforeRemoval = { kind, index, item: structuredClone($state.snapshot(draft.content.measures[index]!)) }; draft.content.measures.splice(index, 1); }
  }
  function undoRemoval() {
    if (!draft || !beforeRemoval || busy) return;
    const removed = $state.snapshot(beforeRemoval);
    if (removed.kind === "alternatives") draft.content.alternatives.splice(removed.index, 0, removed.item);
    else if (removed.kind === "risks") draft.content.risks.splice(removed.index, 0, removed.item);
    else draft.content.measures.splice(removed.index, 0, removed.item);
    beforeRemoval = null;
  }
  function close() { draft = null; beforeRemoval = null; reviewIndex = null; author = ""; reason = ""; acknowledged = false; localError = ""; onEditing(false); }
</script>
<section class="panel pia-workbench" aria-label="Atelier AIPD">
  {#if !draft}
    <div class="pia-cover"><div><p class="eyebrow">L’atelier d’impact</p><h2>Une décision que l’on peut expliquer.</h2><p>Du traitement envisagé aux effets sur les personnes : confrontez vos hypothèses, comparez les options et gardez la trace des arbitrages.</p></div><span class="pia-cover-mark" aria-hidden="true"><Icon name="analysis" size={76} /></span></div>
    <ol class="pia-route">{#each [["Décrire", "Le traitement et ses usages"], ["Questionner", "Son utilité et les alternatives"], ["Protéger", "Les personnes et leurs droits"], ["Décider", "Avec des preuves et des réserves"]] as [title, text], index}<li><span>0{index + 1}</span><strong>{title}</strong><small>{text}</small></li>{/each}</ol>
    {#if selected}<label class="field">Traitement à étudier<select aria-label="Traitement à étudier" value={selected.id} onchange={(e) => activityId = e.currentTarget.value}>{#each workspace.activities as activity}<option value={activity.id}>{activity.title}</option>{/each}</select></label><button disabled={busy || (!workspace.impactAssessments.some((p) => p.activityId === selected!.id) && workspace.impactAssessments.length >= 40)} onclick={() => open()}>{workspace.impactAssessments.some((p) => p.activityId === selected!.id) ? "Reprendre l’AIPD" : "Ouvrir une étude d’impact"}<Icon name="arrow" /></button>{:else}<p>Commencez par décrire une activité dans votre registre. Son contexte et ses flux serviront de point de départ.</p><button onclick={onRegister}>Ouvrir le registre</button>{/if}
    <p class="help">Une étude peut être commencée volontairement. Son ouverture ne signifie pas qu’elle est obligatoire. Vos notes d’analyse existantes sont reprises à l’ouverture, puis évoluent dans ce dossier.</p>
    {#each workspace.impactAssessments as pia}<div class="pia-ledger"><div><strong>{workspace.activities.find((a) => a.id === pia.activityId)?.title}</strong><p>{pia.reviews.length} revue(s) conservée(s) · {piaReviewState(workspace, pia) === "changed" ? "Contexte ou étude modifié depuis la dernière revue : réexamen à instruire" : pia.reviews.length ? "Pas de changement détecté depuis la dernière revue" : "Aucune décision enregistrée"}</p></div><button class="secondary" disabled={busy} onclick={() => { activityId = pia.activityId; draft = structuredClone($state.snapshot(pia)); step = 6; reviewIndex = null; onEditing(true); }}>Lire le dossier</button></div>{/each}
    <p class="help">Trame RGPDESK du 22 septembre 2026, appuyée sur l’article 35, les guides CNIL et les critères du G29. Aucune conclusion juridique n’est produite par l’outil.</p>
  {:else if context}
    <div class="section-heading"><div><p class="eyebrow">Atelier AIPD · {context.activity.role === "processor" ? "Contribution au dossier du responsable" : "Dossier du responsable"}</p><h2>{context.activity.title}</h2></div><span class="pia-save-state">{dirty ? "Modifications à enregistrer" : demo ? "Étude conservée pour cette visite" : "Étude enregistrée dans le coffre"}</span></div>
    <p class="help">Enregistrez avant de fermer l’étude. Les modifications non enregistrées seront abandonnées. {context.activity.role === "processor" ? "L’assistance du sous-traitant ne remplace pas la décision du responsable (article 28 §3 f)." : ""}</p>
    {#if saved && piaReviewState(workspace, saved) === "changed"}<aside class="method-callout"><Icon name="analysis" /><div><strong>Des éléments ont changé depuis la dernière revue.</strong><p>Examinez leurs conséquences. La version historique reste consultable telle qu’elle a été enregistrée.</p></div></aside>{/if}
    <nav class="pia-steps" aria-label="Parcours AIPD">{#each PIA_STEPS as title, index}<button class="secondary" disabled={busy} aria-current={index === step ? "step" : undefined} onclick={() => void go(index)}><span>0{index + 1}</span>{title}</button>{/each}</nav>
    <h3 bind:this={stepHeading} tabindex="-1">{PIA_STEPS[step]}</h3>
    {#if localError}<p role="alert">{localError}</p>{/if}
    <fieldset disabled={busy}>
    {#if beforeRemoval}<p class="help">Élément retiré du brouillon. Les revues conservées restent inchangées. <button class="secondary" onclick={undoRemoval}>Annuler le dernier retrait</button></p>{/if}
    {#if step === 0}
      <p>L’AIPD doit précéder le traitement lorsqu’il est susceptible d’engendrer un risque élevé. Examinez les cas de l’article 35, les listes de l’autorité compétente et le contexte concret. Les neuf critères aident cet examen ; RGPDESK ne décide pas à votre place.</p>
      <p class="pia-sources"><a href={PIA_SOURCES.law} target="_blank" rel="noopener noreferrer">Article 35 §1, §3 à §6 et §10</a> · <a href={PIA_SOURCES.criteria} target="_blank" rel="noopener noreferrer">G29, WP248 rév.01, III.B</a> · <a href={PIA_SOURCES.lists} target="_blank" rel="noopener noreferrer">Listes et explications de la CNIL</a></p>
      <KnowledgeField label="Champ applicable, cas légaux et listes examinées" bind:value={draft.content.applicability} hint="Indiquez l’autorité, la version de ses listes, les cas pertinents, les éventuelles exceptions et les raisons de votre analyse." />
      {#each draft.content.screening as criterion, index}<details class="pia-criterion"><summary><span>0{index + 1}</span>{SCREENING_LABELS[criterion.criterionId]}<small>{criterion.answer === "unknown" ? "À examiner" : "Examen saisi"}</small></summary><label class="field">Appréciation du critère {index + 1}<select bind:value={criterion.answer}><option value="unknown">À examiner</option><option value="yes">Critère identifié</option><option value="no">Critère non identifié après examen</option></select></label><KnowledgeField label={`Critère ${index + 1} · Raisons et références`} bind:value={criterion.reason} /></details>{/each}
      <label class="field">Position sur la réalisation de l’AIPD<select bind:value={draft.content.screeningDecision}><option value="unknown">Décision à instruire</option><option value="required">AIPD jugée requise</option><option value="voluntary">AIPD engagée volontairement</option><option value="not-required">AIPD jugée non requise, motif à conserver</option></select></label>
      <KnowledgeField label="Motivation de cette position" bind:value={draft.content.screeningReason} hint="Noms ou fonctions des personnes consultées, date, arguments, incertitudes et cas à réexaminer. Un critère seul peut déjà révéler un risque élevé." />
    {:else if step === 1}
      <p>Le registre et les flux ci-dessous forment le contexte actuel. Lors d’une revue, une copie de ce contexte est conservée avec la décision.</p>
      <dl class="analysis-summary"><div><dt>Personnes</dt><dd>{knowledgeText(context.activity.dataSubjects) || "À documenter dans le registre"}</dd></div><div><dt>Données</dt><dd>{knowledgeText(context.activity.dataCategories) || "À documenter dans le registre"}</dd></div></dl>
      {#if context.activity.flows.length}<FlowMap flows={context.activity.flows} />{:else}<p class="help">Aucun flux décrit. Retrouvez la cartographie dans la fiche de traitement.</p>{/if}
      <ReviewNotebook bind:notes={draft.content.principles} questions={PIA_PRINCIPLE_QUESTIONS} prefix="AIPD principes" />
    {:else if step === 2}
      <p>Raisonnez par finalité et par opération. Examinez aussi les conséquences de ne pas traiter, la solidité des résultats attendus, les objections et les effets sur l’exercice des libertés.</p>
      <p class="help">Les notes reprises de la fiche sont un point de départ. Réexaminez-les dans le périmètre de cette AIPD ; elles ne remplacent pas l’évaluation de nécessité et de proportionnalité.</p>
      <KnowledgeField label="Opérations examinées dans l’AIPD" bind:value={draft.content.necessity.operations} /><KnowledgeField label="Accès examinés dans l’AIPD" bind:value={draft.content.necessity.access} />
      <ReviewNotebook bind:notes={draft.content.necessity.notes} questions={PIA_NECESSITY_METHOD} prefix="AIPD nécessité" />
      <div class="pia-alternatives"><p class="eyebrow">L’épreuve des alternatives</p><h4>La même finalité, un autre moyen.</h4><p>Comparez notamment une option sans traitement de données, si elle est envisageable. Une contrainte ou une efficacité supposée doit rester identifiable comme telle.</p>
      {#each draft.content.alternatives as alternative, index}<details class="subpanel" open><summary>Option {index + 1}</summary>{#each Object.entries(PIA_ALTERNATIVE_FIELDS) as [key, label]}<KnowledgeField label={`Option ${index + 1} · ${label}`} bind:value={alternative[key as keyof typeof PIA_ALTERNATIVE_FIELDS]} />{/each}<button class="secondary" onclick={() => removeDraftItem("alternatives", alternative.id)}>Retirer l’option {index + 1}</button></details>{/each}
      <button class="secondary" disabled={draft.content.alternatives.length >= 20} onclick={() => draft!.content.alternatives.push(createPiaAlternative(crypto.randomUUID()))}>Comparer une alternative</button></div>
      <p class="pia-sources"><a href={PIA_SOURCES.course + "#page=74"} target="_blank" rel="noopener noreferrer">Éclairage méthodologique : Estelle De Marco, cours 2025-2026, p. 74–90</a>. Questions originales RGPDESK ; aucune validation de l’autrice n’est présumée.</p>
    {:else if step === 3}
      <p>Décrivez ce qui pourrait arriver aux personnes, y compris lorsque le système fonctionne comme prévu : discrimination, exclusion, surveillance ou difficulté à exercer un droit. Examinez aussi l’accès illégitime, la modification non désirée et la disparition des données.</p>
      <p class="pia-sources"><a href={PIA_SOURCES.criteria + "#page=7"} target="_blank" rel="noopener noreferrer">G29, WP248 rév.01, droits et libertés</a> · <a href={PIA_SOURCES.models + "#page=20"} target="_blank" rel="noopener noreferrer">CNIL, modèles, appréciation des risques</a></p>
      <KnowledgeField label="Échelles, hypothèses et méthode d’appréciation" bind:value={draft.content.evaluationMethod} hint="Définissez pour votre contexte ce que signifient les quatre niveaux. Gravité : conséquences et capacité des personnes à y faire face. Vraisemblance : sources, possibilités d’action et faiblesses. Précisez les mesures prises en compte à chaque stade." />
      <div class="grid-two"><PiaRiskMap risks={draft.content.risks} /><PiaRiskMap risks={draft.content.risks} residual /></div>
      {#each draft.content.risks as risk, index}<details class="pia-risk" open><summary>R{index + 1} · {risk.title}</summary><label class="field">Scénario {index + 1} · Nom<input maxlength="160" bind:value={risk.title} /></label>
      {#each Object.entries(PIA_RISK_FIELDS).filter(([key]) => key !== "initialReason" && key !== "residualReason") as [key, label]}<KnowledgeField label={`R${index + 1} · ${label}`} bind:value={risk[key as keyof typeof PIA_RISK_FIELDS]} />{/each}
      <div class="grid-two">{#each [["initialSeverity", "Gravité initiale"], ["initialLikelihood", "Vraisemblance initiale"], ["residualSeverity", "Gravité résiduelle"], ["residualLikelihood", "Vraisemblance résiduelle"]] as [key, label]}<label class="field">R{index + 1} · {label}<select bind:value={risk[key as "initialSeverity" | "initialLikelihood" | "residualSeverity" | "residualLikelihood"]}>{#each Object.entries(PIA_LEVELS) as [value, text]}<option {value}>{text}</option>{/each}</select></label>{/each}</div>
      <KnowledgeField label={`R${index + 1} · Justification initiale`} bind:value={risk.initialReason} /><KnowledgeField label={`R${index + 1} · Justification résiduelle`} bind:value={risk.residualReason} hint="Reliez toute réduction aux garanties réellement vérifiées. Aucun calcul ne rend un risque acceptable." />
      <label class="field">R{index + 1} · Le risque résiduel est-il élevé ?<select bind:value={risk.residualHigh}><option value="unknown">Appréciation à documenter</option><option value="yes">Oui, selon l’examen motivé</option><option value="no">Non, selon l’examen motivé</option></select></label>
      <button class="secondary" disabled={draft.content.measures.some((m) => m.riskIds.includes(risk.id))} onclick={() => removeDraftItem("risks", risk.id)}>Retirer le scénario R{index + 1}</button>{#if draft.content.measures.some((m) => m.riskIds.includes(risk.id))}<p class="help">Retirez d’abord ses liens dans les mesures si vous souhaitez supprimer ce scénario de l’étude en cours.</p>{/if}
      </details>{/each}<button class="secondary" disabled={draft.content.risks.length >= 30} onclick={() => draft!.content.risks.push(createPiaRisk(crypto.randomUUID()))}>Décrire un scénario de risque</button>
    {:else if step === 4}
      <p>Pour chaque garantie, rendez visibles le responsable, l’échéance, les preuves et le contrôle de son efficacité. Une promesse de mise en œuvre ne réduit pas automatiquement un risque.</p>
      <p class="pia-sources"><a href={PIA_SOURCES.law} target="_blank" rel="noopener noreferrer">RGPD, articles 25, 32 et 35 §7 d)</a></p>
      {#each draft.content.measures as measure, index}<details class="pia-risk" open><summary>Mesure {index + 1}</summary>{#each Object.entries(PIA_MEASURE_FIELDS) as [key, label]}<KnowledgeField label={`Mesure ${index + 1} · ${label}`} bind:value={measure[key as keyof typeof PIA_MEASURE_FIELDS]} />{/each}
      <div class="grid-two"><label class="field">Mesure {index + 1} · État<select bind:value={measure.status}><option value="planned">Prévue</option><option value="implemented">Mise en œuvre déclarée</option><option value="verified">Vérification déclarée</option></select></label><label class="field">Mesure {index + 1} · Échéance<input type="date" value={measure.due ?? ""} onchange={(e) => measure.due = e.currentTarget.value || null} /></label></div>
      <fieldset class="choices"><legend>Scénarios concernés par la mesure {index + 1}</legend>{#each draft.content.risks as risk, riskIndex}<label><input type="checkbox" checked={measure.riskIds.includes(risk.id)} onchange={(e) => measure.riskIds = e.currentTarget.checked ? [...measure.riskIds, risk.id] : measure.riskIds.filter((id) => id !== risk.id)} />R{riskIndex + 1} · {risk.title}</label>{/each}</fieldset><button class="secondary" onclick={() => removeDraftItem("measures", measure.id)}>Retirer la mesure {index + 1}</button></details>{/each}
      <button class="secondary" disabled={draft.content.measures.length >= 50} onclick={() => draft!.content.measures.push(createPiaMeasure(crypto.randomUUID()))}>Organiser une mesure</button>
    {:else if step === 5}
      <p>Le DPO conseille ; le responsable du traitement décide. Consignez les avis, les désaccords et les motifs. Si un risque élevé demeure malgré les mesures envisagées, examinez la consultation préalable de l’autorité avant la mise en œuvre.</p><p class="pia-sources"><a href={PIA_SOURCES.law} target="_blank" rel="noopener noreferrer">RGPD, articles 35 §2, §9, §11, 36 et 39</a></p>
      <KnowledgeField label="Avis du DPO et suites données" bind:value={draft.content.dpoAdvice} hint="Date, auteur déclaré, réserves, réponse du responsable ; motivez l’absence d’avis, le cas échéant." />
      <KnowledgeField label="Avis des personnes ou de leurs représentants" bind:value={draft.content.peopleConsultation} hint="Lorsque approprié : modalités, résultats, désaccords et suites. Si cette consultation n’est pas menée, consignez pourquoi, conformément à l’article 35 §9." />
      <KnowledgeField label="Examen de la consultation préalable" bind:value={draft.content.authorityConsultation} hint="Risque résiduel, décision motivée de consulter ou non, référence et état de la démarche. Aucune saisine n’est effectuée par RGPDESK." />
      <KnowledgeField label="Suivi des changements et des garanties" bind:value={draft.content.monitoring} hint="Évolutions de finalité, de données, de fournisseur, d’accès, incidents ou inefficacité d’une mesure : qui les remonte, à qui, et comment réexaminer l’étude ?" />
      <label class="field">Prochain réexamen choisi<input type="date" value={draft.content.reviewDue ?? ""} onchange={(e) => draft!.content.reviewDue = e.currentTarget.value || null} /></label>
      <aside class="pia-open-points"><h4>Préparer la décision</h4>{#if points.length}<ul>{#each points as point}<li>{point}</li>{/each}</ul>{:else}<p>Les contrôles de saisie n’identifient plus de manque. Ils ne vérifient ni la vérité des faits ni la validité juridique de l’étude.</p>{/if}</aside>
      <div class="pia-decision"><p class="eyebrow">Revue humaine</p><h4>Conserver une position motivée.</h4><p>Enregistrez d’abord l’étude, puis relisez le dossier. La revue conservera son contexte et ses appréciations à cette date. Les noms saisis ne sont pas des identités vérifiées ni des signatures.</p>
      <label class="field">Auteur déclaré de la décision<input maxlength="160" bind:value={author} /></label><label class="field">Position à consigner<select bind:value={outcome}>{#each Object.entries(PIA_OUTCOMES) as [value, label]}<option {value} disabled={value === "proceed" && (points.length > 0 || context.activity.role === "processor")}>{label}</option>{/each}</select></label>
      <label class="field">Motifs et réserves de la décision<textarea rows="3" maxlength="4000" bind:value={reason}></textarea></label><label class="check"><input type="checkbox" bind:checked={acknowledged} />J’ai relu le dossier et je consigne une décision humaine, avec ses réserves.</label>
      <p class="help">Une poursuite ne peut être consignée ici avec des points ouverts, un risque résiduel élevé ou inconnu. Vous pouvez conserver une demande de réexamen ou de consultation à tout moment. Aucun dossier n’est envoyé.</p>
      <button disabled={dirty || !acknowledged || !author.trim() || !reason.trim() || draft.reviews.length >= 8 || (outcome === "proceed" && (points.length > 0 || context.activity.role === "processor"))} onclick={() => void decide()}>Enregistrer la revue humaine</button>{#if dirty}<p class="help">Enregistrez les modifications de l’étude avant de consigner la revue.</p>{/if}</div>
    {:else}
      <label class="field">Version du dossier<select aria-label="Version du dossier" value={reviewIndex === null ? "current" : String(reviewIndex)} onchange={(e) => reviewIndex = e.currentTarget.value === "current" ? null : Number(e.currentTarget.value)}><option value="current">Étude en cours{dirty ? " · saisies non enregistrées" : ""}</option>{#each draft.reviews as review, index}<option value={String(index)}>Revue {index + 1} · {review.at.slice(0, 10)} · {PIA_OUTCOMES[review.outcome]}</option>{/each}</select></label>
      {#if reviewIndex !== null && draft.reviews[reviewIndex]}{@const review = draft.reviews[reviewIndex]!}<aside class="pia-history"><strong>{PIA_OUTCOMES[review.outcome]}</strong><p>{review.author} · {review.at} · révision {review.revision}</p><p>{review.reason}</p><small>Version conservée. Les modifications ultérieures du registre n’en changent pas le contenu.</small></aside><PiaDossier content={review.content} context={review.context} />{:else}<PiaDossier content={draft.content} {context} />{/if}
      <p class="help">Ces notes restent dans le dossier de travail et dans sa sauvegarde chiffrée, si vous en téléchargez une. Les exports de registre n’incluent pas les notes AIPD. Il n’existe pas encore d’échange de fichiers avec le logiciel PIA de la CNIL.</p>
    {/if}
    <div class="actions pia-toolbar"><button onclick={() => void save()}>{busy ? "Enregistrement…" : "Enregistrer l’étude"}</button>{#if step < PIA_STEPS.length - 1}<button class="secondary" onclick={() => void go(step + 1)}>Étape suivante<Icon name="arrow" /></button>{/if}<button class="secondary" onclick={close}>{dirty ? "Quitter sans enregistrer" : "Fermer l’étude"}</button></div>
    </fieldset>
  {/if}
</section>
