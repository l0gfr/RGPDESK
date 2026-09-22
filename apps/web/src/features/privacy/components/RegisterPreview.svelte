<script lang="ts">
  import Icon from "./Icon.svelte";
</script>

<figure class="register-preview" aria-labelledby="preview-caption">
  <figcaption id="preview-caption"><span class="preview-orbit" aria-hidden="true"></span>Du concret, dès la première fiche <span>Exemple fictif</span></figcaption>
  <div class="preview-sheet">
    <div class="preview-sheet-heading"><span class="preview-monogram">A</span><div><small>ASSOCIATION FICTIVE LES ALIZÉS</small><strong>Registre des traitements</strong></div><Icon name="register" size={27} /></div>
    <div class="preview-columns"><span>Activité documentée</span><span>État de travail</span></div>
    <div class="preview-activity"><span class="preview-item-icon"><Icon name="parties" size={21} /></span><div><strong>Gestion des adhésions</strong><small>Registre responsable</small></div><span class="preview-status">Brouillon</span></div>
    <div class="preview-detail"><div><small>FINALITÉ</small><p>Suivre les inscriptions et les renouvellements.</p></div><div><small>PERSONNES CONCERNÉES</small><p>Adhérents de l’association</p></div><div class="preview-open-question"><Icon name="eye" size={17} /><span>Base légale et conservation : à examiner</span></div></div>
    <div class="preview-bottom"><span><Icon name="documents" size={17} /> Références documentaires</span><span><Icon name="actions" size={17} /> Actions à suivre</span></div>
  </div>
  <div class="preview-delivery"><span class="preview-delivery-icon"><Icon name="delivery" size={24} /></span><div><strong>Votre prochain dossier, prêt à relire.</strong><small>Sélection des fiches → revue → téléchargement</small></div><Icon name="arrow" size={22} /></div>
</figure>
