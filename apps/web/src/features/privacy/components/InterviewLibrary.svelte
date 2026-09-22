<script lang="ts">
  import { startingPoints } from "../guidance";
  import Icon from "./Icon.svelte";
  import InterviewPlaybook from "./InterviewPlaybook.svelte";
</script>

<section class="interview-library" aria-labelledby="trames-metier">
  <p class="eyebrow">Sur le terrain, avec les équipes</p>
  <h2 id="trames-metier">Préparez votre prochain entretien métier.</h2>
  <p>Choisissez l’activité que vous allez examiner. Retrouvez les questions à poser, les documents à rapprocher et les ressources officielles qui éclairent chaque point.</p>
  <p class="help">Ces six trames couvrent des situations courantes. Elles ne remplacent pas l’examen du contexte ni des règles propres à votre secteur.</p>
  <div class="interview-library-list">{#each startingPoints as example, index}<details class="business-chapter" id={`entretien-${example.id}`}><summary><span class="business-chapter-icon"><Icon name={example.icon} size={28} /></span><span><small>TRAME 0{index + 1}</small><strong>{example.title}</strong><span>{example.question}</span></span><Icon name="chevron" size={20} /></summary><InterviewPlaybook {example} /></details>{/each}</div>
</section>
