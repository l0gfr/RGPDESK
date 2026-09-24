<script lang="ts">
  import { PIA_SHARE_SECTIONS, projectPiaPublication, type PiaPublication, type PiaShareOptions, type Workspace } from "@rgpdesk/privacy-core";
  import Icon from "./Icon.svelte";
  import ExportReviewToolbar from "./ExportReviewToolbar.svelte";
  import "../export-review.css";
  let exportConfirmation:HTMLElement | undefined = $state();
  import PiaReportPreview from "./PiaReportPreview.svelte";
  let { workspace, busy, onDeliver, onDownload }: { workspace: Workspace; busy: boolean; onDeliver: (p: PiaPublication, format?: "html" | "pdf") => Promise<boolean>; onDownload: (id: string, format?: "html" | "pdf") => Promise<void> } = $props();
  let options = $state<PiaShareOptions>({ piaId: "", reviewId: null, sections: [], recipient: "", scope: "", reservations: "" });
  let prepared = $state<PiaPublication | null>(null), confirmed = $state(false), error = $state("");
  let pia = $derived(workspace.impactAssessments.find((p) => p.id === options.piaId));
  function prepare() {
    try { prepared = projectPiaPublication($state.snapshot(workspace), $state.snapshot(options), crypto.randomUUID(), new Date().toISOString()); confirmed = false; error = ""; }
    catch { error = "Préparation refusée. Choisissez l’étude, les rubriques, le destinataire et le périmètre. Une décision exige une revue conservée ; les mesures exigent les scénarios de risques. Vérifiez aussi la limite de huit restitutions."; }
  }
</script>
<section class="panel" aria-label="Restitution AIPD">
  <div class="section-heading"><div><p class="eyebrow">Du dossier de travail au destinataire</p><h2>Une AIPD que l’on peut remettre.</h2></div><span class="icon-tile"><Icon name="delivery" size={28} /></span></div>
  <p>Choisissez une étude ou une revue conservée, sélectionnez les rubriques puis relisez chaque valeur. Vous obtenez un rapport HTML autonome ou un PDF via la boîte d’impression de votre navigateur.</p>
  {#if error}<p class="notice error" role="alert">{error}</p>{/if}
  {#if !prepared}<form onsubmit={(e) => { e.preventDefault(); prepare(); }}><fieldset disabled={busy}>
    <label class="field">Étude à restituer<select bind:value={options.piaId} onchange={() => { options.reviewId = null; options.sections = []; }}><option value="">Choisir une étude</option>{#each workspace.impactAssessments as p}<option value={p.id}>{workspace.activities.find((a) => a.id === p.activityId)?.title}</option>{/each}</select></label>
    <label class="field">Version de l’étude<select bind:value={options.reviewId} onchange={() => options.sections = options.sections.filter((s) => s !== "decision")}><option value={null}>Étude de travail actuelle</option>{#each pia?.reviews ?? [] as r,index}<option value={r.id}>Revue {index + 1} · {r.at}</option>{/each}</select></label>
    <label class="field">Destinataire de l’AIPD<input required maxlength="160" bind:value={options.recipient} /></label><label class="field">Périmètre de la restitution<textarea required maxlength="4000" bind:value={options.scope}></textarea></label>
    <fieldset class="choices"><legend>Rubriques à communiquer</legend>{#each Object.entries(PIA_SHARE_SECTIONS) as [key,label]}<label><input type="checkbox" disabled={(key === "decision" && !options.reviewId) || (key === "measures" && !options.sections.includes("risks"))} checked={options.sections.includes(key as keyof typeof PIA_SHARE_SECTIONS)} onchange={(e) => options.sections = e.currentTarget.checked ? [...options.sections,key as keyof typeof PIA_SHARE_SECTIONS] : options.sections.filter((s) => s !== key && !(key === "risks" && s === "measures"))} />{label}</label>{/each}</fieldset>
    <label class="field">Réserves destinées au lecteur<textarea maxlength="4000" bind:value={options.reservations}></textarea></label>
    <p class="notice">Aucune rubrique sélectionnée par défaut. Les preuves internes, objections du carnet, chemins documentaires et identifiants du coffre sont exclus. Les appréciations, avis et champs libres sélectionnés peuvent être sensibles : relisez-les avant de les partager.</p>
    <button type="submit" disabled={!options.piaId || !options.sections.length || workspace.piaPublications.length >= 8}>Prévisualiser la restitution AIPD <Icon name="arrow" /></button>
  </fieldset></form>{:else}
    <div class="review-banner"><Icon name="eye" /><div><strong>{prepared.sourceLabel}</strong><p>Destinataire : {prepared.recipient}</p><p>{prepared.scope}</p><p>Réserves : {prepared.reservations || "Aucune réserve ajoutée"}</p></div></div>
    <ExportReviewToolbar target={exportConfirmation} formats="PDF · rapport HTML" />
    <PiaReportPreview publication={prepared} />
    <details><summary>Lire toutes les valeurs sélectionnées</summary>
    <div class="table-scroll"><table><caption>Contenu exact des rubriques sélectionnées</caption><thead><tr><th>Rubrique</th><th>Déclaration</th></tr></thead><tbody>{#each prepared.rows as row}<tr><th scope="row">{row.section} / {row.label}</th><td>{row.value}</td></tr>{/each}</tbody></table></div>
    </details>
    <p class="help">L’extrait indique ses limites et n’atteste ni l’identité de l’auteur ni une validation juridique. Le rapport est en clair ; protégez son fichier. Il ne s’agit pas d’un paquet du vérificateur de registre.</p>
    <section class="export-confirmation" aria-label="Confirmation de l’export" tabindex="-1" bind:this={exportConfirmation}><h3>Choisissez votre format.</h3><p>Confirmez le contenu relu, puis préparez le fichier à remettre.</p>
    <label class="check"><input type="checkbox" disabled={busy} bind:checked={confirmed} />J’ai relu les valeurs, le périmètre, les réserves et le destinataire de cette restitution AIPD.</label>
    <div class="actions"><button disabled={busy || !confirmed} onclick={async () => { if (prepared && await onDeliver($state.snapshot(prepared))) { prepared = null; confirmed = false; } }}>Conserver et télécharger l’AIPD</button><button class="secondary" disabled={busy || !confirmed} onclick={async () => { if (prepared && await onDeliver($state.snapshot(prepared), "pdf")) { prepared = null; confirmed = false; } }}><Icon name="print" />Conserver et exporter en PDF</button><button class="secondary" disabled={busy} onclick={() => { prepared = null; confirmed = false; }}>Modifier la sélection</button></div>
    </section>
  {/if}
</section>
<section class="panel"><p class="eyebrow">Restitutions conservées dans le coffre</p><h2>Retrouver ce qui a été préparé.</h2><p>Le contenu conservé ne suit pas les modifications ultérieures de l’étude. Préparer un fichier ne prouve ni son envoi ni sa réception. Huit restitutions maximum ; elles comptent dans la limite globale du coffre.</p><ul class="records">{#each workspace.piaPublications as p}<li><div class="grow"><strong>{p.recipient}</strong><p>{p.createdAt} · {p.sourceLabel}</p></div><button class="secondary" disabled={busy} onclick={() => onDownload(p.id)}>Télécharger cette AIPD</button><button class="secondary" disabled={busy} onclick={() => onDownload(p.id, "pdf")}><Icon name="print" />Exporter en PDF</button></li>{/each}</ul></section>
