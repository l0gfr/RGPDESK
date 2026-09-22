<script lang="ts">
  import type { PiaRisk } from "@rgpdesk/privacy-core";
  let { risks, residual = false }: { risks: PiaRisk[]; residual?: boolean } = $props();
  const levels = ["4", "3", "2", "1"];
  const levelText = (value: string) => value === "unknown" ? "non appréciée" : value;
  let pending = $derived(risks.filter((r) => (residual ? r.residualSeverity : r.initialSeverity) === "unknown" || (residual ? r.residualLikelihood : r.initialLikelihood) === "unknown"));
</script>
<figure class="pia-map">
  <figcaption><strong>{residual ? "Après les mesures examinées" : "Situation initiale examinée"}</strong><span>Gravité ↑ · Vraisemblance →</span></figcaption>
  <div class="pia-matrix" role="img" aria-label={`Positionnement ${residual ? "résiduel" : "initial"} déclaré des risques. Le détail textuel suit la matrice.`}>
    {#each levels as severity}{#each ["1", "2", "3", "4"] as likelihood}<div class="pia-matrix-cell"><small>{severity} / {likelihood}</small>{#each risks as risk, index}{#if (residual ? risk.residualSeverity : risk.initialSeverity) === severity && (residual ? risk.residualLikelihood : risk.initialLikelihood) === likelihood}<span title={risk.title}>R{index + 1}</span>{/if}{/each}</div>{/each}{/each}
  </div>
  <ul class="pia-map-key">{#each risks as risk, index}<li>R{index + 1} · {risk.title} : gravité {levelText(residual ? risk.residualSeverity : risk.initialSeverity)}, vraisemblance {levelText(residual ? risk.residualLikelihood : risk.initialLikelihood)}</li>{/each}</ul>
  <p>{pending.length} scénario(s) non positionné(s). Aucun niveau n’est attribué automatiquement.</p>
</figure>
