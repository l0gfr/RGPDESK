<script lang="ts">
  import { businessGuides, businessSources, sourceConsultation, type BusinessGuide, type BusinessSourceId } from "../business-guides";
  import type { StartingPoint } from "../guidance";
  import Icon from "./Icon.svelte";
  let { example }: { example: StartingPoint } = $props();
  let guide: BusinessGuide = $derived(businessGuides[example.id]);
  let sources = $derived([...new Set<BusinessSourceId>([guide.attentionSource, ...guide.questions.map((question) => question.source)])]);
</script>

<div class="business-playbook">
  <div class="interview-brief"><p><strong>Périmètre de l’entretien</strong><br />{guide.scope}</p><p><strong>Interlocuteurs à solliciter selon votre organisation</strong><br />{example.team}.</p><p><strong>À réunir si disponible</strong><br />{example.prepare}</p></div>
  <aside class="business-attention"><Icon name="book" size={23} /><div><strong>Le repère métier</strong><p>{guide.attention}</p><a href={businessSources[guide.attentionSource].url} target="_blank" rel="noopener noreferrer">{businessSources[guide.attentionSource].title} · {guide.attentionLocation}</a></div></aside>
  <p class="help">Questions d’entretien proposées par RGPDESK à partir des ressources liées. Adaptez-les à votre situation. Les documents ci-dessous sont à consulter auprès de l’équipe ; seules leurs références sont à consigner dans le coffre.</p>
  <ol class="business-questions">
    {#each guide.questions as question, index}
      <li><span class="question-number">0{index + 1}</span><div><h4>{question.topic}</h4><p class="question-ask">{question.ask}</p><p class="question-evidence"><strong>À rapprocher</strong> {question.evidence}</p><a class="question-source" href={businessSources[question.source].url} target="_blank" rel="noopener noreferrer">{businessSources[question.source].title}<span>{question.location}</span></a></div></li>
    {/each}
  </ol>
  <div class="business-outcome"><Icon name="actions" size={24} /><div><strong>À la fin de l’entretien</strong><p>Dans la fiche, consignez les faits établis. Pour chaque réponse manquante, notez qui la recherche et quel document manque. Après enregistrement, utilisez <b>Préparer les questions de cette activité</b> pour organiser les actions.</p></div></div>
  <details class="business-sources"><summary>Sources et portée de cette trame</summary><p>Consultation des sources : {guide.consultedAt ?? sourceConsultation}. Les questions ci-dessus sont une aide au travail, pas un questionnaire officiel de la CNIL. Le texte du règlement, les recommandations et les exemples n’ont pas la même portée. Aucun choix de base légale ou de conservation n’est repris automatiquement.</p><ul>{#each sources as id}<li><a href={businessSources[id].url} target="_blank" rel="noopener noreferrer">{businessSources[id].title}</a><br /><small>{businessSources[id].nature} · {businessSources[id].edition}</small></li>{/each}</ul></details>
</div>
