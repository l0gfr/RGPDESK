<script lang="ts">
  import { tick, untrack } from "svelte";
  import { createPurpose, knowledgeText, type Activity, type Workspace } from "@rgpdesk/privacy-core";
  import { fieldHints, type StartingPoint } from "../guidance";
  import ReviewNotebook from "./ReviewNotebook.svelte";
  import FlowEditor from "./FlowEditor.svelte";
  import { ANALYSIS_METHOD } from "../review-methods";
  import Icon from "./Icon.svelte";
  import InterviewPlaybook from "./InterviewPlaybook.svelte";
  import KnowledgeField from "./KnowledgeField.svelte";
  let { initial, workspace, busy, example, initialSection = "record", onSave, onCancel }: {
    initialSection?: "record" | "analysis" | "flows"; initial: Activity; workspace: Workspace; busy: boolean; example?: StartingPoint;
    onSave: (activity: Activity) => Promise<void>; onCancel: () => void;
  } = $props();
  let draft: Activity = $state(untrack(() => structuredClone(initial)));
  let section = $state(untrack(() => initialSection));
  let step = $state(0);
  let whole = $state(false);
  let sectionTitle: HTMLHeadingElement | undefined = $state();
  let form: HTMLFormElement | undefined = $state();
  const steps = ["L’activité", "Les objectifs", "Les données", "La protection", "Les précisions", "La relecture"];
  const introductions = [
    "Donnez un nom concret à l’activité que vous décrivez, puis avancez avec les informations disponibles.",
    "Décrivez l’objectif poursuivi, puis documentez les choix déjà examinés. Une information manquante peut attendre le prochain entretien.",
    "Suivez les informations : de qui parle-t-on, que recueille-t-on et qui peut les consulter ?",
    "Appuyez-vous sur l’équipe technique et les prestataires pour décrire les accès, les pays et les mesures réellement en place.",
    "Reliez les outils et les acteurs déjà recensés, puis consignez les examens qui demandent une attention particulière.",
    "Relisez votre description. Enregistrez même si certaines réponses manquent : vous retrouverez les questions ouvertes dans Actions & décisions.",
  ];
  async function go(next: number) {
    step = next;
    await tick();
    sectionTitle?.focus();
  }
  async function save() {
    if (!draft.title.trim()) { section = "record"; whole = false; await go(0); form?.reportValidity(); return; }
    await onSave($state.snapshot(draft));
  }
  function toggle(field: "systemIds" | "participantIds" | "controllerIds", id: string, checked: boolean) {
    if (field === "controllerIds") {
      if (draft.role === "processor") draft.controllerIds = checked ? [...draft.controllerIds, id] : draft.controllerIds.filter((item) => item !== id);
    } else draft[field] = checked ? [...draft[field], id] : draft[field].filter((item) => item !== id);
  }
</script>

<section class="panel guided-editor" aria-labelledby="activity-editor-title">
  <div class="section-heading">
    <div><p class="eyebrow">{draft.role === "controller" ? "Registre responsable" : "Registre sous-traitant"}</p><h2 id="activity-editor-title">Fiche de traitement</h2></div>
    <button type="button" class="secondary" disabled={busy} onclick={() => { section = "record"; whole = !whole; }}>{whole ? "Revenir au parcours guidé" : "Voir toute la fiche"}</button>
  </div>
  <p class="help">Vous pouvez enregistrer à tout moment. Les champs laissés vides resteront à examiner.</p>
  <nav class="activity-views" aria-label="Vues de l’activité">{#each [["record", "La fiche", "register"], ["analysis", "L’analyse", "analysis"], ["flows", "Les flux", "flows"]] as [value, label, icon]}<button type="button" class="secondary" class:active={section === value} aria-current={section === value ? "page" : undefined} disabled={busy} onclick={() => section = value as typeof section}><Icon name={icon} />{label}</button>{/each}</nav>
  {#if example && section === "record"}<aside class="interview-card"><strong>Votre fil conducteur</strong><p>{example.question}</p><details><summary>Retrouver les questions métier et leurs sources</summary><InterviewPlaybook {example} /></details></aside>{/if}
  {#if section === "record" && !whole}<nav class="editor-steps" aria-label="Étapes de la fiche">{#each steps as label, index}<button type="button" class="secondary" disabled={busy} aria-current={step === index ? "step" : undefined} onclick={() => void go(index)}><span>{index + 1}</span>{label}</button>{/each}</nav><div class="step-heading"><p class="eyebrow">Étape {step + 1} sur {steps.length}</p><h3 bind:this={sectionTitle} tabindex="-1">{steps[step]}</h3><p>{introductions[step]}</p></div>{/if}
  <form bind:this={form} onsubmit={(event) => { event.preventDefault(); void save(); }}>
    <fieldset disabled={busy}>
      {#if section === "analysis"}
        <div class="method-intro"><p class="eyebrow">Faits · arguments · appréciation · suites</p><h3>Documenter la nécessité et la proportionnalité.</h3><p>Travaillez à partir d’une finalité et des opérations réellement décrites. Notez les réserves et les avis à obtenir. Les notes sont internes au coffre ; leur saisie ne vaut pas validation.</p></div>
        <KnowledgeField label="Opérations détaillées du traitement" bind:value={draft.analysis.operations} hint="Décrivez la collecte, l’enregistrement, les consultations, les calculs ou rapprochements, les transmissions, l’archivage et l’effacement, selon le fonctionnement réel." />
        <KnowledgeField label="Personnes habilitées et droits d’accès" bind:value={draft.analysis.access} hint="Décrivez les rôles, équipes ou organismes autorisés, leurs droits de lecture, modification, extraction ou suppression et le circuit d’autorisation. Pas de liste nominative." />
        <ReviewNotebook bind:notes={draft.analysis.notes} questions={ANALYSIS_METHOD} prefix="Analyse" />
        <p class="help">Cette grille ne couvre pas à elle seule une AIPD complète. Référence : <a href="https://www.cnil.fr/fr/reglement-europeen-protection-donnees/chapitre4" target="_blank" rel="noopener noreferrer">RGPD, article 35</a>. Après enregistrement, consignez les décisions et affectez les correctifs dans Actions & décisions.</p>
      {:else if section === "flows"}<FlowEditor bind:flows={draft.flows} />
      {:else}
      {#if whole || step === 0}<div class="grid-two">
        <label class="field"><span>Nom de l’activité</span><input required maxlength="160" bind:value={draft.title} /></label>
        <label class="field"><span>État de la fiche</span><select bind:value={draft.status}><option value="draft">Brouillon</option><option value="active">Active, état déclaré</option><option value="archived">Archivée, conservée dans le coffre</option></select></label>
      </div>
      <p class="help">Le rôle est fixé à la création de cette fiche. Un organisme peut avoir des activités dans les deux registres.</p>
      {/if}
      {#if whole || step === 1}
      {#if draft.role === "controller"}
        <h3>Finalités et conservation</h3>
        <p class="help">Les finalités et la conservation relèvent des rubriques du registre responsable. Le fondement juridique de l’article 6 est un complément de documentation, à examiner séparément.</p>
        {#each draft.purposes as purpose, index (purpose.id)}
          <div class="subpanel">
            <h4>Finalité {index + 1}</h4>
            <KnowledgeField label={`Finalité ${index + 1}`} bind:value={purpose.description} hint={fieldHints.purpose} />
            <KnowledgeField label={`Fondement juridique documenté ${index + 1} (complément)`} bind:value={purpose.legalBasis} hint={fieldHints.legal} />
            <div class="grid-two">
              <KnowledgeField label={`Durée ou critère de conservation ${index + 1}`} bind:value={purpose.retention.period} hint={fieldHints.retention} />
              <KnowledgeField label={`Événement de départ ${index + 1}`} bind:value={purpose.retention.trigger} hint={fieldHints.trigger} />
            </div>
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
      {#if whole || step === 2}<h3>Personnes, données et destinataires</h3>
      <p class="help">Rubriques article 30 pour le responsable ; compléments de documentation pour le sous-traitant.</p>
      <div class="grid-two">
        <KnowledgeField label="Catégories de personnes" bind:value={draft.dataSubjects} hint={fieldHints.subjects} />
        <KnowledgeField label="Catégories de données" bind:value={draft.dataCategories} hint={fieldHints.data} />
      </div>
      <KnowledgeField label="Catégories de destinataires" bind:value={draft.recipients} hint={fieldHints.recipients} />
      <aside class="method-callout"><Icon name="flows" size={25} /><div><strong>Qui accède aux données, pour quelle opération ?</strong><p>Les catégories de destinataires figurent ici. Décrivez les habilitations dans L’analyse et les circulations concrètes dans Les flux, sans quitter cette fiche.</p><button type="button" class="text-button" onclick={() => section = "flows"}>Décrire un flux<Icon name="arrow" size={16} /></button></div></aside>
      {/if}
      {#if whole || step === 3}<h3>Transferts et mesures générales</h3>
      <KnowledgeField label="Transferts documentés" bind:value={draft.transfers} hint={fieldHints.transfers} />
      <KnowledgeField label="Mesures techniques et organisationnelles" bind:value={draft.securityMeasures} hint={fieldHints.security} />
      {/if}
      {#if whole || step === 4}<h3>Précisions pour votre analyse</h3>
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
      {#if !whole && step === 5}<div class="review-summary"><h3>Votre fiche avant enregistrement</h3><dl><dt>Activité</dt><dd>{draft.title || "À nommer"}</dd><dt>Rôle choisi</dt><dd>{draft.role === "controller" ? "Responsable de traitement" : "Sous-traitant"}</dd>{#if draft.role === "controller"}{#each draft.purposes as purpose, i}<dt>Finalité {i + 1}</dt><dd>{knowledgeText(purpose.description) || "À examiner"}</dd><dt>Fondement juridique {i + 1}</dt><dd>{knowledgeText(purpose.legalBasis) || "À examiner"}</dd><dt>Conservation {i + 1}</dt><dd>{knowledgeText(purpose.retention.period) || "À examiner"}</dd>{/each}{:else}<dt>Opérations</dt><dd>{knowledgeText(draft.operations) || "À examiner"}</dd>{/if}<dt>Personnes concernées</dt><dd>{knowledgeText(draft.dataSubjects) || "À examiner"}</dd><dt>Données utilisées</dt><dd>{knowledgeText(draft.dataCategories) || "À examiner"}</dd><dt>Destinataires</dt><dd>{knowledgeText(draft.recipients) || "À examiner"}</dd></dl><p>Après enregistrement, ouvrez Actions & décisions pour préparer vos prochaines vérifications. Une fiche peut rester en brouillon pendant cette collecte.</p></div>{/if}
      {#if !whole}<div class="step-navigation">{#if step > 0}<button type="button" class="secondary" onclick={() => void go(step - 1)}>Étape précédente</button>{/if}{#if step < steps.length - 1}<button type="button" onclick={() => void go(step + 1)}>Continuer<Icon name="arrow" /></button>{/if}</div>{/if}
      {/if}
      <div class="actions editor-save"><button type="submit">{busy ? "Chiffrement en cours…" : "Enregistrer la fiche"}</button><button type="button" class="secondary" onclick={onCancel}>Annuler l’édition</button></div>
    </fieldset>
  </form>
</section>
