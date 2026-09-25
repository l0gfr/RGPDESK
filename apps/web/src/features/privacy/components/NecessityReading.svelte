<script lang="ts">
  import Icon from "./Icon.svelte";
  const stages = [
    { title: "Établir le besoin", icon: "target", reference: "CC1 · 1-1 et 1-2", notes: "Résultat recherché, utilité réelle", points: ["Quel besoin précis motive le traitement et ses usages ultérieurs ? Distinguez son importance, son actualité et son urgence, avec leurs justificatifs.", "Quels résultats démontrent l’efficacité attendue ? Que font déjà les mesures existantes et quel apport supplémentaire est établi ?", "Quelles objections fragilisent ce raisonnement ? Répondez-y par des éléments vérifiables ou gardez l’incertitude explicite."] },
    { title: "Examiner les limitations", icon: "rights", reference: "CC1 · 1-1.3 ; CC2 · 2-1 à 2-3", notes: "Autres moyens, étendue, effets sur les personnes", points: ["Quel droit est limité, dans quel cadre applicable et pour quel motif admis ? Distinguez ce raisonnement du fondement juridique déjà examiné dans les principes généraux.", "Comment la mesure touche-t-elle les comportements légitimes, les attentes et la possibilité réelle de refuser ? Considérez l’âge, la vulnérabilité et les effets même sans incident.", "Quels lieux, personnes, accès, circonstances et durées peuvent être restreints ? L’exercice du droit reste-t-il effectif ? Comparez les moyens praticables moins intrusifs."] },
    { title: "Mettre les effets en balance", icon: "balance", reference: "CC3", notes: "Position et suites, comparaison des alternatives", points: ["Quels bénéfices sont démontrés, et lesquels restent hypothétiques ? Quantifiez seulement ce qui peut l’être de manière étayée.", "Mettez ces bénéfices en regard des limitations et de l’importance des droits concernés. Expliquez ce qui rend une alternative préférable ou insuffisante.", "Consignez les désaccords, les conditions et les réserves de votre appréciation. Un score ne remplace pas ce raisonnement."] },
    { title: "Rendre les garanties effectives", icon: "evidence", reference: "CC4 · 4-1 et 4-2", notes: "Garanties, correctifs et mesures", points: ["Quels engagements encadrent réellement la mesure ? Examinez leur portée contraignante, leur clarté, leur précision, leur accessibilité et leur stabilité.", "Quels correctifs faut-il réaliser, avec quels responsables, moyens et contrôles ? Distinguez garanties promises, appliquées et vérifiées.", "Quels changements obligeront à réexaminer le besoin, les limitations ou les garanties ? Reliez les suites au plan d’action existant."] },
  ];
</script>
<details class="necessity-reading">
  <summary><Icon name="balance" size={24}/><span>Approfondir la nécessité et la proportionnalité<small>Quatre angles de lecture du guide d’Estelle De Marco</small></span><Icon name="plus"/></summary>
  <div class="necessity-reading-body">
    <p>Une aide complémentaire pour cet ensemble de traitements. Elle porte sur le besoin, les limitations de libertés et les garanties. Utilisez les notes et les alternatives de cette étude : aucune seconde saisie du registre n’est demandée.</p>
    {#each stages as stage,index}<details class="necessity-stage"><summary><span class="necessity-number">0{index+1}</span><Icon name={stage.icon}/><span>{stage.title}</span></summary><div><ul>{#each stage.points as point}<li>{point}</li>{/each}</ul><p class="help">Repères du guide : {stage.reference}. À traiter dans les notes « {stage.notes} » ci-dessous.</p></div></details>{/each}
    <p class="help">Adaptation RGPDESK du 25 septembre 2026 : Estelle De Marco, <cite>Guide d’analyse de nécessité et de proportionnalité</cite>, v1.2 du 20 septembre 2026, onglet « Analyse N & P », CC1 à CC4 ; bibliographie dans « Références analyse N & P ». <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a>. Synthèse reformulée, sans les exemples du classeur ; elle ne reproduit pas l’intégralité du guide.</p>
  </div>
</details>
<style>
  .necessity-reading { margin:1.5rem 0; border:1px solid #c3cdd5; border-radius:6px 22px 6px 6px; background:linear-gradient(120deg,#f4ede3,#edf2f5 60%); }
  .necessity-reading > summary { padding:1.25rem; display:flex; gap:1rem; align-items:center; cursor:pointer; }
  .necessity-reading > summary > span { flex:1; font-weight:650; }
  .necessity-reading small { display:block; font-size:.95rem; margin-top:.3rem; font-weight:400; }
  .necessity-reading-body { padding:0 clamp(1rem,3vw,1.75rem) 1.5rem; }
  .necessity-stage { margin:.8rem 0; background:#ffffffb0; border:1px solid #d0d9df; border-radius:5px; }
  .necessity-stage summary { padding:1rem; display:flex; gap:.8rem; align-items:center; cursor:pointer; }
  .necessity-number { color:#815b41; font:italic 1.5rem Georgia,serif; }
  .necessity-stage > div { padding:0 1.25rem 1rem; }
  .necessity-stage li { margin-bottom:.75rem; line-height:1.6; }
</style>
