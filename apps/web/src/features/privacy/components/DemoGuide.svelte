<script lang="ts">
  import { DEMO_STEPS, type DemoPanel } from "../demo-journey";
  import Icon from "./Icon.svelte";
  let { panel, busy, editing = false, actionLabel, onAction, onNavigate }: {
    panel: string; busy: boolean; editing?: boolean; actionLabel?: string;
    onAction: () => void; onNavigate: (panel: DemoPanel | "overview") => void;
  } = $props();
  let index = $derived(DEMO_STEPS.findIndex((s) => s.panel === panel));
  let step = $derived(DEMO_STEPS[index]);
  let next = $derived(DEMO_STEPS[index + 1]);
  let previous = $derived(DEMO_STEPS[index - 1]);
</script>
{#if step}
  <aside class="demo-guide" aria-label="Repère de démonstration">
    <div class="demo-guide-heading"><span class="demo-guide-number">{String(index + 1).padStart(2, "0")}<small>/ {String(DEMO_STEPS.length).padStart(2, "0")}</small></span><div><p class="eyebrow">Votre fil conducteur · exemple fictif</p><h2>{step.title}</h2><p>{step.text}</p></div></div>
    {#if editing}
      <p class="demo-guide-hint"><Icon name="eye" size={18} /><span>{panel === "pia" ? "L’étude est ouverte. Dans Dossier & historique, choisissez un chapitre ou une revue conservée. Pour reprendre la visite, utilisez « Fermer l’étude » ; si vous avez modifié son contenu, enregistrez-le ou choisissez « Quitter sans enregistrer »." : panel === "dpo" ? "Le dossier est ouvert. Parcourez ses faits, sa chronologie et sa revue. Enregistrez vos essais ou quittez le dossier pour reprendre la visite." : "Vous êtes dans la fiche. Essayez ses vues « La fiche », « L’analyse » et « Les flux ». Utilisez « Enregistrer la fiche » pour garder vos essais pendant la visite, ou « Annuler l’édition » pour revenir."}</span></p>
    {:else if actionLabel}<button class="demo-guide-start" disabled={busy} onclick={onAction}>{actionLabel}<Icon name="arrow" size={18} /></button>{/if}
    <nav class="demo-guide-navigation" aria-label="Navigation de la démonstration">
      <button class="text-button" disabled={busy || editing} onclick={() => onNavigate(previous?.panel ?? "overview")}>{previous ? "Étape précédente" : "Voir la visite"}</button>
      <span>{editing ? "Reprenez la visite après avoir fermé ce dossier." : step.result}</span>
      <button class="secondary" disabled={busy || editing} onclick={() => onNavigate(next?.panel ?? "overview")}>{next ? `Continuer : ${next.title}` : "Retour à la visite"}<Icon name="arrow" size={16} /></button>
    </nav>
  </aside>
{/if}
