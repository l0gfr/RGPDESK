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
    <div class="demo-guide-heading"><span class="demo-guide-number">{String(index + 1).padStart(2, "0")}<small>/ {String(DEMO_STEPS.length).padStart(2, "0")}</small></span><div><p class="eyebrow">Visite guidée · exemple fictif</p><h2>{step.title}</h2></div></div>
    <nav class="demo-guide-navigation" aria-label="Navigation de la démonstration">
      <button class="text-button" disabled={busy} onclick={() => onNavigate(previous?.panel ?? "overview")}>{previous ? "Étape précédente" : "Voir la visite"}</button>
      <button class="secondary" disabled={busy} onclick={() => onNavigate(next?.panel ?? "overview")}>{next ? `Continuer : ${next.title}` : "Retour à la visite"}<Icon name="arrow" size={16} /></button>
    </nav>
    {#if !editing && actionLabel}<button class="demo-guide-start" disabled={busy} onclick={onAction}>{actionLabel}<Icon name="arrow" size={18} /></button>{/if}
    {#key panel}<details class="demo-guide-help"><summary>À voir dans cette étape</summary><p>{step.text}</p><p>{step.result}</p>{#if editing}<p>Le menu reste accessible. Si vous avez modifié le dossier, vous pourrez reprendre votre saisie ou quitter sans enregistrer.</p>{/if}</details>{/key}
  </aside>
{/if}
