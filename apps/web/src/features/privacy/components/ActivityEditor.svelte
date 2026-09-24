<script lang="ts">
  import { DECLARATIONS_CONTEXT, reusableDeclarations, type DeclarationSource } from "../reusable-declarations";
  import type { RecoveryForm } from "../persistence/recovery";
  import { onMount, tick, untrack, setContext } from "svelte";
  import { activityFacts, purposeRetention, canonicalJson, createPurpose, knowledgeText, type Activity, type Workspace } from "@rgpdesk/privacy-core";
  import { fieldHints, type StartingPoint } from "../guidance";
  import DataGroupsEditor from "./DataGroupsEditor.svelte";
  import DataGroupsTable from "./DataGroupsTable.svelte";
  import InterviewSteps from "./InterviewSteps.svelte";
  import InventoryContext from "./InventoryContext.svelte";
  import ReviewNotebook from "./ReviewNotebook.svelte";
  import FlowEditor from "./FlowEditor.svelte";
  import { ANALYSIS_METHOD } from "../review-methods";
  import Icon from "./Icon.svelte";
  import Emblem from "./Emblem.svelte";
  import InterviewPlaybook from "./InterviewPlaybook.svelte";
  import KnowledgeField from "./KnowledgeField.svelte";
  let { initial, workspace, busy, example, initialSection = "record", initialStep = 0, onSave, onCancel }: {
    initialStep?: number; initialSection?: "record" | "analysis" | "flows" | "evidence" | "interview"; initial: Activity; workspace: Workspace; busy: boolean; example?: StartingPoint;
    onSave: (activity: Activity, documentIds: string[]) => Promise<void>; onCancel: () => void;
  } = $props();
  let draft: Activity = $state(untrack(() => structuredClone(initial)));
  setContext<DeclarationSource>(DECLARATIONS_CONTEXT, kind => reusableDeclarations(workspace, draft, kind));
  let section = $state<"record" | "analysis" | "flows" | "evidence" | "interview">(untrack(() => initialSection));
  let documentIds = $state(untrack(() => workspace.documents.filter((doc) => doc.activityIds.includes(initial.id)).map((doc) => doc.id)));
  const initialDraft = untrack(() => canonicalJson(initial));
  const initialDocuments = untrack(() => canonicalJson([...documentIds].sort()));
  export function hasUnsavedChanges() {
    return !workspace.activities.some((a) => a.id === draft.id) || canonicalJson(draft) !== initialDraft || canonicalJson([...documentIds].sort()) !== initialDocuments;
  }
  let step = $state(untrack(()=>Math.min(5,Math.max(0,initialStep))));
  export function getCheckpoint() { return {kind:"activity" as const,id:draft.id,section,step}; }
  let whole = $state(false);
  let draftHeading: HTMLHeadingElement | undefined = $state();
  onMount(() => { void tick().then(() => { if (draftHeading?.isConnected) { draftHeading.focus({ preventScroll: true }); draftHeading.scrollIntoView({ block: "start" }); } }); });
  let sectionTitle: HTMLHeadingElement | undefined = $state();
  let form: HTMLFormElement | undefined = $state();
  const steps = ["L’ensemble", "Les objectifs", "Les données", "La protection", "Le fondement", "La relecture"];
  const introductions = [
    "Donnez un nom concret à l’activité que vous décrivez, puis avancez avec les informations disponibles.",
    "Décrivez la finalité principale dans le nom de l’ensemble, puis ses sous-finalités ici. Le fondement juridique sera examiné après les données et leurs flux.",
    "Suivez les informations : de qui parle-t-on, que recueille-t-on et qui peut les consulter ?",
    "Appuyez-vous sur l’équipe technique et les prestataires pour décrire les accès, les pays et les mesures réellement en place.",
    "À partir des données, destinataires, durées et garanties décrits, examinez le fondement juridique de chaque sous-finalité.",
    "Relisez votre description. Enregistrez même si certaines réponses manquent : vous retrouverez les questions ouvertes dans Actions & décisions.",
  ];
  async function go(next: number) {
    step = next;
    await tick();
    sectionTitle?.focus();
  }
  async function save() {
    if (!draft.title.trim()) { section = "record"; whole = false; await go(0); form?.reportValidity(); return; }
    if (form && !form.reportValidity()) return;
    await onSave($state.snapshot(draft), $state.snapshot(documentIds));
  }
  function toggle(field: "systemIds" | "participantIds" | "controllerIds", id: string, checked: boolean) {
    if (field === "controllerIds") {
      if (draft.role === "processor") draft.controllerIds = checked ? [...draft.controllerIds, id] : draft.controllerIds.filter((item) => item !== id);
    } else draft[field] = checked ? [...draft[field], id] : draft[field].filter((item) => item !== id);
  }
  export function getRecovery():RecoveryForm|null{return hasUnsavedChanges()?{kind:'activity',draft:$state.snapshot(draft),documentIds:$state.snapshot(documentIds),section,step}:null;}
  export function restoreRecovery(f:RecoveryForm){if(f.kind!=='activity')return;draft=structuredClone(f.draft);documentIds=[...f.documentIds];section=f.section;step=Math.min(5,f.step);}
</script>

<section class="panel guided-editor" aria-labelledby="activity-editor-title">
  <div class="section-heading">
    <div><p class="eyebrow">{draft.role === "controller" ? "Registre responsable" : "Registre sous-traitant"}</p><h2 bind:this={draftHeading} id="activity-editor-title" data-draft-heading tabindex="-1">Ensemble de traitement n°{Math.max(0, workspace.activities.findIndex(a => a.id === draft.id)) + (workspace.activities.some(a => a.id === draft.id) ? 1 : workspace.activities.length + 1)}</h2></div>
    <button type="button" class="secondary" disabled={busy} onclick={() => { section = "record"; whole = !whole; }}>{whole ? "Revenir au parcours guidé" : "Voir toute la fiche"}</button>
  </div>
  <div class="draft-toolbar"><span>{hasUnsavedChanges() ? "Saisie à enregistrer" : "Fiche enregistrée"}</span><div class="actions"><button type="button" disabled={busy} onclick={() => void save()}>{busy ? "Chiffrement en cours…" : "Enregistrer la fiche"}</button><button type="button" class="secondary" disabled={busy} onclick={onCancel}>Annuler l’édition</button></div></div>
  <p class="help">Vous pouvez enregistrer à tout moment. Les champs laissés vides resteront à examiner.</p>
  <nav class="activity-views" aria-label="Vues de l’activité">{#each [["interview", "Mener l’entretien", "interview"], ["record", "La fiche", "register"], ["analysis", "L’analyse", "analysis"], ["flows", "Les flux", "flows"], ["evidence", "Les justificatifs", "evidence"]] as [value, label, icon]}<button type="button" class="secondary" class:active={section === value} aria-current={section === value ? "page" : undefined} disabled={busy} onclick={() => section = value as typeof section}><Icon name={icon} />{label}</button>{/each}</nav>
  {#if example && section === "record"}<aside class="interview-card"><strong>Votre fil conducteur</strong><p>{example.question}</p><details><summary>Retrouver les questions métier et leurs sources</summary><InterviewPlaybook {example} /></details></aside>{/if}
  {#if section === "record" && !whole}<nav class="editor-steps" aria-label="Étapes de la fiche">{#each steps as label, index}<button type="button" class="secondary" disabled={busy} aria-current={step === index ? "step" : undefined} onclick={() => void go(index)}><span>{index + 1}</span>{label}</button>{/each}</nav><div class="step-heading illustrated-step"><Emblem name={["register", "target", "parties", "security", "systems", "eye"][step]} /><div><p class="eyebrow">Étape {step + 1} sur {steps.length}</p><h3 bind:this={sectionTitle} tabindex="-1">{steps[step]}</h3><p>{introductions[step]}</p></div></div>{/if}
  {#if section !== "interview" && draft.interviewQuestions?.length}<aside class="notice"><strong>À demander au métier</strong><ul>{#each draft.interviewQuestions as q}<li>{q}</li>{/each}</ul><button type="button" class="secondary" onclick={()=>{section="interview";step=5;}}>Reprendre les questions de l’entretien</button></aside>{/if}
  <form bind:this={form} onsubmit={(event) => { event.preventDefault(); void save(); }}>
    <fieldset disabled={busy}>
      {#if section === "interview"}<InterviewSteps bind:draft bind:documentIds bind:step {workspace} />
      {:else if section === "evidence"}
        <div class="method-intro"><p class="eyebrow">Une référence, plusieurs activités</p><h3>Relier les justificatifs déjà recensés.</h3><p>Sélectionnez les documents qui concernent cette activité. Leur titre, leur version et leur emplacement restent dans la bibliothèque commune de ce coffre ; vous ne les ressaisissez pas.</p></div>
        <fieldset class="choices evidence-picker"><legend>Références de ce coffre</legend>
          {#each workspace.documents as doc (doc.id)}<label><input type="checkbox" checked={documentIds.includes(doc.id)} onchange={(e) => documentIds = e.currentTarget.checked ? [...documentIds, doc.id] : documentIds.filter((id) => id !== doc.id)} /><span><strong>{doc.title}</strong><small>{doc.version ? `Version ${doc.version}` : "Version à préciser"} · {doc.scope}</small><small>{doc.internalRef || "Emplacement à renseigner"}</small></span></label>{/each}
          {#if !workspace.documents.length}<p>Aucune référence dans ce coffre. Enregistrez la fiche, puis utilisez « Référencer un document pour cette activité ».</p>{/if}
        </fieldset>
        <p class="help">Relier une référence ne valide pas son contenu. Détacher une référence conserve le document et les anciennes revues ; ses liens aux finalités de cette activité sont aussi retirés. Les modifications ne prennent effet qu’à l’enregistrement de la fiche.</p>
      {:else if section === "analysis"}
        <div class="method-intro"><p class="eyebrow">Faits · arguments · appréciation · suites</p><h3>Examiner les exigences RGPD de cette activité.</h3><p>Travaillez à partir d’une finalité et des opérations réellement décrites. Notez les réserves et les avis à obtenir. Les notes sont internes au dossier ; leur saisie ne vaut pas validation.</p></div>
        <KnowledgeField label="Opérations détaillées du traitement" bind:value={draft.analysis.operations} hint="Décrivez la collecte, l’enregistrement, les consultations, les calculs ou rapprochements, les transmissions, l’archivage et l’effacement, selon le fonctionnement réel." />
        <KnowledgeField label="Personnes habilitées et droits d’accès" bind:value={draft.analysis.access} hint="Décrivez les rôles, équipes ou organismes autorisés, leurs droits de lecture, modification, extraction ou suppression et le circuit d’autorisation. Pas de liste nominative." />
        <InventoryContext activities={[draft]} /><DataGroupsTable activity={draft} inventory={workspace} />
        <ReviewNotebook documents={workspace.documents.filter((d) => documentIds.includes(d.id))} bind:notes={draft.analysis.notes} questions={ANALYSIS_METHOD} guide="rgpd" prefix="Analyse" legitimateInterest={draft.role === "controller"} />
        <p class="help">Cette analyse accompagne le registre. La nécessité et la proportionnalité de l’AIPD se travaillent dans son atelier distinct. Référence : <a href="https://eur-lex.europa.eu/eli/reg/2016/679/oj?locale=fr" target="_blank" rel="noopener noreferrer">RGPD, articles 5, 6, 24, 25 et 32</a>. Après enregistrement, consignez les décisions et affectez les correctifs dans Actions & décisions.</p>
      {:else if section === "flows"}<FlowEditor bind:activity={draft} {workspace} bind:flows={draft.flows} />
      {:else}
      {#if whole || step === 0}<div class="grid-two">
        <label class="field"><span>Nom de l’activité</span><input required maxlength="160" bind:value={draft.title} /></label>
        <label class="field"><span>État de la fiche</span><select bind:value={draft.status}><option value="draft">Brouillon</option><option value="active">Active, état déclaré</option><option value="archived">Archivée, conservée dans le dossier</option></select></label>
      </div>
      <p class="help">Ce nom exprime votre finalité principale. Le rôle est fixé à la création de cette fiche. Un organisme peut avoir des activités dans les deux registres.</p>
      {/if}
      {#if whole || step === 1}
      {#if draft.role === "controller"}
        <h3>Les sous-finalités de cet ensemble</h3>
        <p class="help">Le titre de la fiche décrit la finalité principale. Précisez ici les usages distincts ; vous y relierez les groupes D1, D2… à l’étape suivante.</p>
        {#each draft.purposes as purpose, index (purpose.id)}
          <div class="subpanel">
            <h4>Sous-finalité {index + 1}</h4>
            <KnowledgeField label={`Sous-finalité ${index + 1}`} bind:value={purpose.description} reuse="purpose" hint={fieldHints.purpose} />
          </div>
        {/each}
        {#if draft.purposes.length === 0}<p class="empty">Commencez par un objectif concret : à quoi servent ces données dans cette activité ? Ajoutez une finalité pour le décrire.</p>{/if}
        <button type="button" class="secondary" disabled={draft.purposes.length >= 20} onclick={() => { if (draft.role === "controller") draft.purposes = [...draft.purposes, createPurpose(crypto.randomUUID())]; }}>Ajouter une finalité</button>
      {:else}
        <h3>Opérations réalisées pour les clients responsables</h3>
        <KnowledgeField label="Catégories d’opérations" bind:value={draft.operations} hint="Listez les opérations réalisées pour le client : hébergement, assistance, envoi… Décrivez uniquement celles de votre prestation." />
        <KnowledgeField label="Instructions documentées (complément)" bind:value={draft.instructions} hint="Retrouvez les instructions du client et leur référence avec le responsable de la prestation." />
        <fieldset class="choices"><legend>Clients responsables identifiés</legend>
          {#each workspace.parties as party (party.id)}
            <label><input type="checkbox" checked={draft.controllerIds.includes(party.id)} onchange={(event) => toggle("controllerIds", party.id, event.currentTarget.checked)} />{party.name}</label>
          {/each}
          {#if workspace.parties.length === 0}<p class="help">Enregistrez la fiche, ajoutez votre client dans Intervenants, puis revenez le sélectionner ici.</p>{/if}
        </fieldset>
        <p class="help">Cette fiche ne vous demande pas de choisir une base légale pour une opération réalisée sur instruction. Vos propres finalités relèvent d’une fiche responsable distincte.</p>
      {/if}
      {/if}
      {#if whole || step === 2}
      <DataGroupsEditor bind:activity={draft} {workspace} />
      <details class="subpanel" open={!draft.dataGroups?.length && (draft.flows.length > 0 || draft.dataCategories.state === "documented" || draft.dataSubjects.state === "documented")}><summary>Descriptions générales et flux déjà saisis</summary><p class="help">Vos anciennes déclarations sont conservées. Elles ne sont pas réparties automatiquement entre les groupes. Vous pouvez les relire ici ; les nouveaux groupes se décrivent ci-dessus.</p>
      <FlowEditor bind:activity={draft} {workspace} bind:flows={draft.flows} compact />
      {#if draft.role === "controller"}{#each draft.purposes as purpose,index}<div class="grid-two"><KnowledgeField label={`Durée ou critère de conservation ${index + 1} (description générale)`} bind:value={purpose.retention.period} reuse="period"/><KnowledgeField label={`Événement de départ ${index + 1} (description générale)`} bind:value={purpose.retention.trigger} reuse="trigger"/></div>{/each}{/if}
      <h3>Personnes, données et destinataires</h3>
      <p class="help">Rubriques article 30 pour le responsable ; compléments de documentation pour le sous-traitant.</p>
      <div class="grid-two">
        <KnowledgeField label="Catégories de personnes" bind:value={draft.dataSubjects} reuse="people" hint={fieldHints.subjects} />
        <KnowledgeField label="Catégories de données" bind:value={draft.dataCategories} reuse="data" hint={fieldHints.data} />
      </div>
      <KnowledgeField label="Catégories de destinataires" bind:value={draft.recipients} reuse="recipients" hint={fieldHints.recipients} />
      <aside class="method-callout"><Icon name="flows" size={25} /><div><strong>Les flux et le registre décrivent la même activité.</strong><p>La carte utilise les flux ci-dessus. Les catégories de personnes, données et destinataires restent votre synthèse de l’activité ; aucun rôle ni transfert n’est déduit automatiquement d’un flux.</p></div></aside>
      </details>
      {/if}
      {#if whole || step === 3}<h3>Transferts et mesures générales</h3>
      <KnowledgeField label="Transferts documentés" bind:value={draft.transfers} hint={fieldHints.transfers} />
      <KnowledgeField label="Mesures techniques et organisationnelles" bind:value={draft.securityMeasures} hint={fieldHints.security} />
      {/if}
      {#if whole || step === 4}
      <DataGroupsTable activity={draft} inventory={workspace} />
      {#if draft.role === "controller"}<h3>Examiner le fondement juridique après les faits</h3><p class="help">L’ordre de ce parcours vous aide à instruire le choix ; un fondement doit être établi avant la mise en œuvre du traitement. Si l’intérêt légitime est envisagé, son test doit prendre en compte le besoin, les personnes, les données et les garanties. Retrouvez le dossier dédié dans Dossiers DPO.</p>{#each draft.purposes as purpose,index}<div class="subpanel"><h4>Sous-finalité {index + 1} · {knowledgeText(purpose.description) || "À décrire"}</h4><KnowledgeField label={`Fondement juridique documenté ${index + 1} (complément)`} bind:value={purpose.legalBasis} hint={fieldHints.legal}/></div>{/each}{/if}
      <h3>Précisions pour votre analyse</h3>
      <div class="grid-two"><label class="field">État de l’examen des transferts<select aria-label="État de l’examen des transferts" bind:value={draft.review.transferStatus}><option value="unknown">Non examiné</option><option value="none-reviewed">Aucun transfert identifié après examen déclaré</option><option value="identified">Transfert identifié, analyse à documenter</option></select></label><label class="field">Mode de collecte déclaré<select aria-label="Mode de collecte déclaré" bind:value={draft.review.collection}><option value="unknown">Inconnu</option><option value="direct">Directe</option><option value="indirect">Indirecte</option><option value="both">Directe et indirecte</option></select></label></div>
      {#if draft.role === "controller"}<div class="grid-two"><KnowledgeField label="Examen des catégories particulières (article 9)" bind:value={draft.review.article9} hint="Documentez la condition examinée, ou la non-applicabilité motivée. Aucun classement automatique." /><KnowledgeField label="Examen des données pénales (article 10)" bind:value={draft.review.article10} hint="Examen distinct de la base légale de l’article 6." /></div>{/if}
      <fieldset class="choices"><legend>Sous-traitants déclarés de cette activité</legend>{#each workspace.parties as party}<label><input type="checkbox" checked={draft.review.subcontractorIds.includes(party.id)} onchange={(e) => draft.review.subcontractorIds = e.currentTarget.checked ? [...draft.review.subcontractorIds, party.id] : draft.review.subcontractorIds.filter((id) => id !== party.id)} />{party.name}</label>{/each}</fieldset>
      <h3>Moyens et relations (compléments)</h3>
      <div class="grid-two">
        <fieldset class="choices"><legend>Systèmes utilisés</legend>
          {#each workspace.systems as system (system.id)}<label><input type="checkbox" checked={draft.systemIds.includes(system.id)} onchange={(event) => toggle("systemIds", system.id, event.currentTarget.checked)} />{system.name}</label>{/each}
          {#if workspace.systems.length === 0}<p class="help">Aucun système documenté.</p>{/if}
        </fieldset>
        <fieldset class="choices"><legend>Autres intervenants liés</legend>
          {#each workspace.parties as party (party.id)}<label><input type="checkbox" checked={draft.participantIds.includes(party.id)} onchange={(event) => toggle("participantIds", party.id, event.currentTarget.checked)} />{party.name}</label>{/each}
          {#if workspace.parties.length === 0}<p class="help">Aucun intervenant documenté.</p>{/if}
        </fieldset>
      </div>
      <div class="field"><label for="privacy-notes">Notes internes</label><textarea id="privacy-notes" aria-describedby="privacy-notes-hint" rows="3" maxlength="4000" bind:value={draft.internalNotes}></textarea><small id="privacy-notes-hint">Évitez les données individuelles, secrets et pièces justificatives.</small></div>
      {/if}
      {#if !whole && step === 5}<div class="review-summary"><h3>Votre fiche avant enregistrement</h3><dl><dt>Activité</dt><dd>{draft.title || "À nommer"}</dd><dt>Rôle choisi</dt><dd>{draft.role === "controller" ? "Responsable de traitement" : "Sous-traitant"}</dd>{#if draft.role === "controller"}{#each draft.purposes as purpose, i}<dt>Finalité {i + 1}</dt><dd>{knowledgeText(purpose.description) || "À examiner"}</dd><dt>Fondement juridique {i + 1}</dt><dd>{knowledgeText(purpose.legalBasis) || "À examiner"}</dd><dt>Conservation {i + 1}</dt><dd>{knowledgeText(purposeRetention(draft, purpose).period) || "À examiner"}</dd>{/each}{:else}<dt>Opérations</dt><dd>{knowledgeText(draft.operations) || "À examiner"}</dd>{/if}<dt>Personnes concernées</dt><dd>{knowledgeText(activityFacts(draft, workspace).dataSubjects) || "À examiner"}</dd><dt>Données utilisées</dt><dd>{knowledgeText(activityFacts(draft, workspace).dataCategories) || "À examiner"}</dd><dt>Destinataires</dt><dd>{knowledgeText(activityFacts(draft, workspace).recipients) || "À examiner"}</dd></dl><DataGroupsTable activity={draft} inventory={workspace}/><p>Après enregistrement, ouvrez Actions & décisions pour préparer vos prochaines vérifications. Une fiche peut rester en brouillon pendant cette collecte.</p></div>{/if}
      {#if !whole}<div class="step-navigation">{#if step > 0}<button type="button" class="secondary" onclick={() => void go(step - 1)}>Étape précédente</button>{/if}{#if step < steps.length - 1}<button type="button" onclick={() => void go(step + 1)}>Continuer<Icon name="arrow" /></button>{/if}</div>{/if}
      {/if}

    </fieldset>
  </form>
</section>
