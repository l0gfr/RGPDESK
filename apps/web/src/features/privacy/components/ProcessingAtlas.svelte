<script lang="ts">
  import Icon from "./Icon.svelte";
</script>
<figure class="processing-atlas" aria-label="Exemple fictif de cartographie d’un recrutement">
  <figcaption><span class="atlas-caption-icon"><Icon name="flows" size={19} /></span>ATLAS D’UNE ACTIVITÉ<span>EXEMPLE FICTIF</span></figcaption>
  <div class="atlas-heading"><span>01</span><div><p>RECRUTEMENT</p><h2>Suivez les données.<br />Posez les bonnes questions.</h2></div></div>
  <div class="atlas-canvas">
    <div class="atlas-node atlas-origin"><span><Icon name="parties" size={25} /></span><div><small>LA COLLECTE</small><strong>Candidats</strong><p>CV · coordonnées</p></div></div>
    <div class="atlas-connector"><span>Transmettent</span><Icon name="arrow" size={21} /></div>
    <div class="atlas-node atlas-system"><span><Icon name="systems" size={25} /></span><div><small>LE SUPPORT</small><strong>Outil de recrutement</strong><p>Réception des candidatures</p></div></div>
    <div class="atlas-branch" aria-hidden="true"></div>
    <div class="atlas-access"><span><Icon name="eye" size={20} /></span><div><small>L’ACCÈS</small><strong>Qui peut consulter ?</strong><p>Habilitations à documenter</p></div><span class="atlas-question">?</span></div>
  </div>
  <div class="atlas-foot"><span class="atlas-open-dot"></span><span>Un fait saisi. Une question éclaircie.</span><Icon name="analysis" size={19} /></div>
</figure>
