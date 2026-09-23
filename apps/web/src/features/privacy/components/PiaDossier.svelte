<script lang="ts">
  import { resolvedFlows, knowledgeText, piaOpenPoints, type PiaContent, type PiaContext, type ReviewNote } from "@rgpdesk/privacy-core";
  import { PIA_NECESSITY_METHOD } from "../review-methods";
  import { PIA_PRINCIPLE_QUESTIONS, PIA_RISK_FIELDS, PIA_ALTERNATIVE_FIELDS, PIA_MEASURE_FIELDS, SCREENING_LABELS, PIA_SOURCES } from "../pia-method";
  import { tick } from "svelte";
  import EvidenceCitations from "./EvidenceCitations.svelte";
  import Icon from "./Icon.svelte";
  import FlowMap from "./FlowMap.svelte";
  import PiaRiskMap from "./PiaRiskMap.svelte";
  let { content, context }: { content: PiaContent; context: PiaContext } = $props();
  const chapters = [
    { title: "Contexte et déclenchement", short: "Le contexte", icon: "register", help: "Retrouvez le traitement étudié, les personnes concernées et les motifs d’ouverture de l’AIPD." },
    { title: "Nécessité et proportionnalité", short: "Les choix", icon: "analysis", help: "Confrontez les objectifs, les opérations et les alternatives. Ouvrez chaque question pour lire ses faits, ses objections et ses suites." },
    { title: "Risques pour les personnes", short: "Les risques", icon: "shield", help: "Lisez les conséquences envisagées pour les personnes, les appréciations initiales et résiduelles, puis les motifs de chaque scénario." },
    { title: "Mesures et suivi", short: "Les mesures", icon: "actions", help: "Retrouvez les garanties, les scénarios auxquels elles répondent et leur suivi déclaré." },
    { title: "Avis et réexamen", short: "Les avis", icon: "documents", help: "Relisez les consultations, les réserves et l’organisation du réexamen de cette étude." },
  ] as const;
  let chapter = $state(0);
  let chapterHeading: HTMLHeadingElement | undefined = $state();
  let chapterIndex: HTMLElement | undefined = $state();
  let points = $derived(piaOpenPoints(content, context.documents));
  async function readChapter(index: number) {
    if (index < 0 || index >= chapters.length) return;
    chapter = index;
    await tick();
    chapterHeading?.focus({ preventScroll: true });
    chapterIndex?.scrollIntoView({ block: "start" });
  }
  const noteFields = { facts: "Faits", evidence: "Références", objections: "Objections", assessment: "Appréciation", followUp: "Suites" } as const;
</script>
{#snippet notes(values: ReviewNote[], titles: readonly { id: string; title: string }[])}
  {#each values as note}<details><summary>{titles.find((q) => q.id === note.questionId)?.title ?? note.questionId}</summary><dl>{#each Object.entries(noteFields) as [key, label]}<div><dt>{label}</dt><dd>{knowledgeText(note[key as keyof typeof noteFields]) || "À documenter"}</dd></div>{/each}</dl><EvidenceCitations citations={note.citations} documents={context.documents} prefix="Référence" readonly /></details>{/each}
{/snippet}
<article class="pia-dossier" aria-label="Dossier AIPD en lecture">
  <header class="pia-reader-cover">
    <div><p class="eyebrow">AIPD / Dossier de travail</p><h3 tabindex="-1">{context.activity.title}</h3><p class="pia-reader-byline">{context.organization.name} · {context.activity.role === "controller" ? "Responsable de traitement" : "Contribution sous-traitant"}</p></div>
    <span class="pia-reader-monogram" aria-hidden="true"><Icon name="analysis" size={36} /><small>ÉTUDE<br />D’IMPACT</small></span>
    <div class="pia-reader-inventory" role="group" aria-label="Contenu de cette version"><span><strong>{content.alternatives.length}</strong> alternatives décrites</span><span><strong>{content.risks.length}</strong> scénarios de risque</span><span><strong>{content.measures.length}</strong> mesures décrites</span></div>
    <p class="pia-reader-disclaimer">Informations et appréciations déclarées. Cette lecture ne constitue ni une certification ni une autorisation de traitement.</p>
  </header>
  <details class="pia-reader-points"><summary><Icon name="eye" size={20} /><span>Points à instruire<small>{points.length ? `${points.length} points signalés par les contrôles de saisie` : "Aucun manque détecté par les contrôles de saisie"}</small></span><span class="pia-disclosure" aria-hidden="true">+</span></summary>{#if points.length}<ul>{#each points as point}<li>{point}</li>{/each}</ul>{:else}<p>La justesse des éléments et la décision restent à examiner par les personnes compétentes.</p>{/if}</details>
  <nav bind:this={chapterIndex} class="pia-reader-index" aria-label="Chapitres du dossier AIPD">{#each chapters as item, index}<button type="button" class="secondary" aria-current={chapter === index ? "step" : undefined} onclick={() => void readChapter(index)}><span class="pia-reader-index-number">0{index + 1}</span><Icon name={item.icon} size={20} /><span>{item.short}</span></button>{/each}</nav>
  <div class="pia-reader-chapter-heading"><p class="eyebrow">Lecture / chapitre 0{chapter + 1}</p><h4 bind:this={chapterHeading} tabindex="-1">{chapters[chapter]!.title}</h4><p>{chapters[chapter]!.help}</p></div>
  <section class="pia-reader-section" hidden={chapter !== 0} aria-label={chapters[0].title}><dl><div><dt>Examen du champ applicable</dt><dd>{knowledgeText(content.applicability) || "À documenter"}</dd></div><div><dt>Position sur la réalisation de l’AIPD</dt><dd>{({ unknown: "Décision à instruire", required: "AIPD jugée requise", voluntary: "AIPD engagée volontairement", "not-required": "AIPD jugée non requise" })[content.screeningDecision]}</dd></div><div><dt>Motif de réalisation ou de non-réalisation</dt><dd>{knowledgeText(content.screeningReason) || "À documenter"}</dd></div><div><dt>Portée de l’organisation</dt><dd>{knowledgeText(context.scope) || "À documenter"}</dd></div><div><dt>Juridiction examinée</dt><dd>{knowledgeText(context.jurisdiction) || "À documenter"}</dd></div></dl>
    <h5 class="pia-reader-subheading">Critères examinés</h5><p class="help">Une appréciation et ses motifs pour chaque critère. Les réponses ne valent pas décision automatique sur la réalisation de l’AIPD.</p>
    <ol class="pia-reader-criteria">{#each content.screening as criterion, index}<li><span class="pia-criterion-number">{String(index + 1).padStart(2, "0")}</span><div><strong>{SCREENING_LABELS[criterion.criterionId]}</strong><p>{knowledgeText(criterion.reason) || "Motif à documenter"}</p></div><span class="pia-reader-status">{criterion.answer === "yes" ? "Identifié" : criterion.answer === "no" ? "Non identifié après examen" : "À examiner"}</span></li>{/each}</ol>
    <h5 class="pia-reader-subheading">Le traitement, en détail</h5>
    <dl>{#each [["Personnes", context.activity.dataSubjects], ["Données", context.activity.dataCategories], ["Destinataires", context.activity.recipients], ["Transferts", context.activity.transfers], ["Sécurité", context.activity.securityMeasures]] as [label, value]}<div><dt>{label}</dt><dd>{knowledgeText(value as typeof context.scope) || "À documenter"}</dd></div>{/each}</dl>
    {#if context.activity.role === "controller"}{#each context.activity.purposes as purpose, index}<h5>Finalité {index + 1}</h5><dl><div><dt>Objectif</dt><dd>{knowledgeText(purpose.description) || "À documenter"}</dd></div><div><dt>Fondement juridique</dt><dd>{knowledgeText(purpose.legalBasis) || "À documenter"}</dd></div><div><dt>Conservation / déclencheur</dt><dd>{knowledgeText(purpose.retention.period) || "À documenter"} / {knowledgeText(purpose.retention.trigger) || "À documenter"}</dd></div></dl>{/each}{:else}<dl><div><dt>Opérations confiées</dt><dd>{knowledgeText(context.activity.operations) || "À documenter"}</dd></div><div><dt>Instructions</dt><dd>{knowledgeText(context.activity.instructions) || "À documenter"}</dd></div></dl>{/if}
    <h5>Acteurs et supports liés</h5><ul>{#each context.parties as party}<li>{party.name} · {knowledgeText(party.contact) || "Contact à documenter"}</li>{/each}{#each context.systems as system}<li>{system.name} · {knowledgeText(system.description) || "Description à documenter"}</li>{/each}</ul>
    <h5>Références documentaires liées</h5><ul>{#each context.documents as doc}<li>{doc.title} · version {doc.version || "non renseignée"} · {doc.internalRef || "référence à documenter"} · {doc.reservations || "Aucune réserve saisie"}</li>{/each}</ul>
    {#if context.activity.flows.length}<FlowMap flows={resolvedFlows(context.activity, context)} />{:else}<p>Aucun flux décrit.</p>{/if}
    {@render notes(content.principles, PIA_PRINCIPLE_QUESTIONS)}
  </section>
  <section class="pia-reader-section" hidden={chapter !== 1} aria-label={chapters[1].title}><dl><div><dt>Opérations examinées</dt><dd>{knowledgeText(content.necessity.operations) || "À documenter"}</dd></div><div><dt>Accès examinés</dt><dd>{knowledgeText(content.necessity.access) || "À documenter"}</dd></div></dl>{@render notes(content.necessity.notes, PIA_NECESSITY_METHOD)}
    <h5 class="pia-reader-subheading">Alternatives étudiées</h5>{#each content.alternatives as alternative, index}<article class="pia-reader-option"><h5><span>0{index + 1}</span> Option {index + 1}</h5><dl>{#each Object.entries(PIA_ALTERNATIVE_FIELDS) as [key, label]}<div><dt>{label}</dt><dd>{knowledgeText(alternative[key as keyof typeof PIA_ALTERNATIVE_FIELDS]) || "À documenter"}</dd></div>{/each}</dl></article>{:else}<p>Aucune alternative décrite.</p>{/each}
  </section>
  <section class="pia-reader-section" hidden={chapter !== 2} aria-label={chapters[2].title}><p>{knowledgeText(content.evaluationMethod) || "Méthode d’appréciation à documenter"}</p><div class="grid-two"><PiaRiskMap risks={content.risks} /><PiaRiskMap risks={content.risks} residual /></div>
    {#each content.risks as risk, index}<details><summary>R{index + 1} · {risk.title}</summary><dl>{#each Object.entries(PIA_RISK_FIELDS) as [key, label]}<div><dt>{label}</dt><dd>{knowledgeText(risk[key as keyof typeof PIA_RISK_FIELDS]) || "À documenter"}</dd></div>{/each}<div><dt>Risque résiduel élevé, appréciation humaine</dt><dd>{risk.residualHigh === "unknown" ? "Non apprécié" : risk.residualHigh === "yes" ? "Oui" : "Non, selon les motifs saisis"}</dd></div></dl></details>{/each}
  </section>
  <section class="pia-reader-section" hidden={chapter !== 3} aria-label={chapters[3].title}>{#each content.measures as measure, index}<details><summary>Mesure {index + 1} · {measure.status === "planned" ? "Prévue" : measure.status === "implemented" ? "Mise en œuvre déclarée" : "Vérification déclarée"}</summary><p>Échéance : {measure.due || "À fixer"}. Scénarios : {measure.riskIds.map((id) => `R${content.risks.findIndex((r) => r.id === id) + 1}`).join(", ") || "Aucun lien saisi"}.</p><dl>{#each Object.entries(PIA_MEASURE_FIELDS) as [key, label]}<div><dt>{label}</dt><dd>{knowledgeText(measure[key as keyof typeof PIA_MEASURE_FIELDS]) || "À documenter"}</dd></div>{/each}</dl></details>{:else}<p>Aucune mesure complémentaire décrite.</p>{/each}</section>
  <section class="pia-reader-section" hidden={chapter !== 4} aria-label={chapters[4].title}><dl><div><dt>Avis du DPO</dt><dd>{knowledgeText(content.dpoAdvice) || "À documenter"}</dd></div><div><dt>Consultation des personnes</dt><dd>{knowledgeText(content.peopleConsultation) || "À documenter"}</dd></div><div><dt>Consultation préalable de l’autorité</dt><dd>{knowledgeText(content.authorityConsultation) || "À documenter"}</dd></div><div><dt>Surveillance des changements</dt><dd>{knowledgeText(content.monitoring) || "À documenter"}</dd></div><div><dt>Prochain réexamen</dt><dd>{content.reviewDue || "À fixer"}</dd></div></dl></section>
  <nav class="pia-reader-pagination" aria-label="Changer de chapitre"><button type="button" class="text-button" disabled={chapter === 0} onclick={() => void readChapter(chapter - 1)}>Chapitre précédent</button><span>0{chapter + 1} / 05</span><button type="button" class="secondary" disabled={chapter === chapters.length - 1} onclick={() => void readChapter(chapter + 1)}>Chapitre suivant<Icon name="arrow" size={16} /></button></nav>
  <footer><a href={PIA_SOURCES.law} target="_blank" rel="noopener noreferrer">RGPD, articles 35 et 36</a> · <a href={PIA_SOURCES.method} target="_blank" rel="noopener noreferrer">Méthode CNIL, février 2018</a> · <a href={PIA_SOURCES.criteria} target="_blank" rel="noopener noreferrer">G29, WP248 rév.01, annexe 2</a></footer>
</article>
