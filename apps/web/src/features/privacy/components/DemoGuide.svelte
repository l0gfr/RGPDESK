<script lang="ts">
  import { DEMO_STEPS, type DemoPanel } from "../demo-journey";
  import Icon from "./Icon.svelte";
  let { panel, busy, onNavigate }: { panel: string; busy: boolean; onNavigate: (panel: DemoPanel | "overview") => void } = $props();
  let index = $derived(DEMO_STEPS.findIndex((s) => s.panel === panel));
  let step = $derived(DEMO_STEPS[index]);
  let next = $derived(DEMO_STEPS[index + 1]);
</script>
{#if step}<aside class="demo-guide" aria-label="Repère de démonstration"><span class="demo-guide-number">{String(index + 1).padStart(2, "0")}<small>/ {String(DEMO_STEPS.length).padStart(2, "0")}</small></span><div><p class="eyebrow">Dans cet exemple</p><h2>{step.title}</h2><p>{step.text}</p></div><button class="secondary" disabled={busy} onclick={() => onNavigate(next?.panel ?? "overview")}>{next ? "Étape suivante" : "Retour à la visite"}<Icon name="arrow" size={17} /></button></aside>{/if}
