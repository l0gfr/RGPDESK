<script lang="ts">
  import MethodHints from "./MethodHints.svelte";
  import type { MethodHintKind } from "../method-hints";
  import EvidenceCitations from "./EvidenceCitations.svelte";
  import type { EvidenceReference, ReviewNote } from "@rgpdesk/privacy-core";
  import type { ReviewQuestion } from "../review-methods";
  import { hasNotes, REVIEW_EDITION } from "../review-methods";
  import KnowledgeField from "./KnowledgeField.svelte";
  import Icon from "./Icon.svelte";
  import LegitimateInterestGuide from "./LegitimateInterestGuide.svelte";
  let { notes = $bindable(), questions, prefix, documents = [], legitimateInterest = false, guide, edition = REVIEW_EDITION }: { guide?: MethodHintKind; documents?: EvidenceReference[]; notes: ReviewNote[]; questions: readonly ReviewQuestion[]; prefix: string; legitimateInterest?: boolean; edition?: string } = $props();
</script>
<div class="review-notebook">
  <p class="method-caption">{edition}. Vos appréciations restent à motiver, même lorsqu’un justificatif est référencé.</p>
  {#each notes as note, index (note.questionId)}
    {@const question = questions.find((item) => item.id === note.questionId)!}
    <details class="analysis-question" open={index === 0}>
      <summary><span class="question-index">{String(index + 1).padStart(2, "0")}</span><span>{question.title}<small>{hasNotes(note) ? "Notes de travail saisies" : "À documenter"}</small></span><Icon name="plus" size={18} /></summary>
      <div class="analysis-question-body">
        <p class="method-question">{question.question}</p>
        <p class="method-evidence"><Icon name="documents" size={17} /><span><strong>Sur quoi vous appuyer</strong>{question.evidence}</span></p>
        <a class="method-source" href={question.source} target="_blank" rel="noopener noreferrer">{question.reference}<span>{question.nature} · {edition.includes("23 septembre") ? "source consultée le 23 septembre 2026" : "source consultée le 22 septembre 2026"}</span></a>
        {#if legitimateInterest && note.questionId === "lawfulness"}<LegitimateInterestGuide />{/if}
        {#if guide}<MethodHints kind={guide} questionId={note.questionId} />{/if}
        <KnowledgeField label={`${prefix} ${index + 1} · Faits recueillis`} bind:value={note.facts} hint="Ajoutez seulement les faits utiles à cette question qui ne figurent pas déjà dans le contexte. Distinguez ce qui est observé, déclaré ou à vérifier." />
        <EvidenceCitations bind:citations={note.citations} {documents} prefix={`${prefix} ${index + 1}`} />
        <KnowledgeField label={`${prefix} ${index + 1} · Éléments de preuve et références`} bind:value={note.evidence} hint="Référence précise, version, date, clause ou passage utile. Conservez les fichiers dans votre organisation." />
        <KnowledgeField label={`${prefix} ${index + 1} · Objections et incertitudes`} bind:value={note.objections} hint="Consignez aussi ce qui contredit l’hypothèse et les réponses que vous n’avez pas encore." />
        <KnowledgeField label={`${prefix} ${index + 1} · Appréciation motivée`} bind:value={note.assessment} hint="Votre examen, sa portée et ses réserves. Si le point ne s’applique pas, expliquez pourquoi." />
        <KnowledgeField label={`${prefix} ${index + 1} · Correctifs et suites`} bind:value={note.followUp} hint="Notez les mesures ou informations attendues, puis affectez les suites dans Actions & décisions après enregistrement." />
      </div>
    </details>
  {/each}
</div>
