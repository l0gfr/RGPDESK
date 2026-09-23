<script lang="ts">
  import type { EvidenceReference } from "@rgpdesk/privacy-core";
  import Icon from "./Icon.svelte";
  let { documents, historical = false, disabled = false, onOpen }: { documents: EvidenceReference[]; historical?: boolean; disabled?: boolean; onOpen?: (id: string) => void } = $props();
  let unique = $derived([...new Map(documents.map((d) => [d.id, d])).values()]);
</script>
<details class="review-evidence">
  <summary><Icon name="documents" size={21} /><span><strong>{historical ? "Références conservées avec cette position" : "Vos justificatifs, sans les ressaisir"}</strong><small>{unique.length} référence(s) liée(s) au périmètre</small></span></summary>
  <div class="review-evidence-body">
    <p class="help">{historical ? "Les renseignements ci-dessous sont ceux de la revue choisie. Le document original reste dans votre organisation." : "Retrouvez les références liées aux traitements. Rapprochez leur version et leur contenu des arguments de l’analyse ; leur présence seule ne prouve pas une appréciation."}</p>
    {#if !unique.length}<p>Aucune référence documentaire liée. Vous pouvez en ajouter dans Documents et la rattacher au traitement, sans joindre le fichier.</p>{/if}
    {#each unique as doc}<article><header><Icon name="documents" /><div><h4>{doc.title}</h4><p>{doc.version ? `Version ${doc.version}` : "Version non renseignée"} · {doc.status === "reviewed" ? "Revue déclarée" : "Déclarée, à examiner"}</p></div></header><dl><div><dt>Périmètre</dt><dd>{doc.scope || "À préciser"}</dd></div><div><dt>Où le retrouver</dt><dd>{doc.internalRef || "Localisation non renseignée"}</dd></div><div><dt>Réserves</dt><dd>{doc.reservations || "Aucune réserve saisie"}</dd></div>{#if doc.reviewedAt}<div><dt>Examen déclaré</dt><dd>{doc.reviewedAt.slice(0,10)}</dd></div>{/if}{#if doc.reviewDue}<div><dt>Prochain examen</dt><dd>{doc.reviewDue}</dd></div>{/if}</dl>{#if !historical && onOpen}<button type="button" class="text-button" {disabled} onclick={() => onOpen?.(doc.id)}>Examiner {doc.title}<Icon name="arrow" size={16} /></button>{/if}</article>{/each}
    {#if disabled && onOpen}<p class="help">Enregistrez vos modifications pour rejoindre une référence sans perdre votre travail.</p>{/if}
  </div>
</details>
