<script lang="ts">
  import { onDestroy } from "svelte";
  import { CSV_FIELDS, MAX_CSV_BYTES, FICTIONAL_CSV, parseCsv, previewCsv, commitCsv, type Workspace, type CsvTable, type CsvMapping, type CsvField } from "@rgpdesk/privacy-core";
  import Icon from "./Icon.svelte";
  let { workspace, busy, onSave }: { workspace: Workspace; busy: boolean; onSave: (next: Workspace) => Promise<void> } = $props();
  let encoding = $state<"utf-8" | "windows-1252">("utf-8");
  let delimiter = $state<"," | ";" | "\t">(";");
  let table = $state<CsvTable | null>(null); let mapping = $state<CsvMapping>([]); let error = $state(""); let reading = $state(false); let accepted = $state(false);
  let generation = 0; let fileInput: HTMLInputElement | undefined = $state();
  const labels: Record<CsvField, string> = { title: "Activité (requis)", role: "Rôle (requis)", purpose: "Finalité", legalBasis: "Base légale", retentionPeriod: "Durée ou critère", retentionTrigger: "Événement de départ", dataCategories: "Catégories de données", dataSubjects: "Personnes", recipients: "Destinataires", transfers: "Transferts", securityMeasures: "Mesures de sécurité", operations: "Opérations" };
  const rejection = { columns: "nombre de colonnes incohérent", role: "rôle non reconnu", title: "activité sans titre", invalid: "valeur invalide ou trop longue" };
  let preview = $derived.by(() => { try { return table ? previewCsv(workspace, table, mapping, () => crypto.randomUUID()) : null; } catch { return null; } });
  function reset() { generation++; table = null; mapping = []; accepted = false; error = ""; reading = false; if (fileInput) fileInput.value = ""; }
  async function read(file?: File) {
    reset(); if (!file) return; const current = generation; reading = true;
    try {
      if (file.size > MAX_CSV_BYTES) throw new Error();
      const bytes = await file.arrayBuffer(); if (current !== generation) return;
      table = parseCsv(new TextDecoder(encoding, { fatal: true }).decode(bytes), delimiter);
    } catch { if (current === generation) error = "CSV refusé : vérifiez l’encodage, le séparateur, les en-têtes uniques et les limites (2 Mio, 200 lignes, 50 colonnes, 4 000 caractères par cellule)."; }
    finally { if (current === generation) reading = false; }
  }
  function template() { reset(); delimiter = ";"; encoding = "utf-8"; table = parseCsv(FICTIONAL_CSV, ";"); }
  function mapColumn(column: number, field: string) { mapping = [...mapping.filter((m) => m.column !== column), ...(field ? [{ column, field: field as CsvField }] : [])]; accepted = false; }
  async function save() {
    if (!table || !accepted) return;
    try { await onSave(commitCsv(workspace, table, mapping, encoding, delimiter, () => crypto.randomUUID(), new Date().toISOString())); }
    catch { error = "Import non enregistré. Vérifiez le mapping, les limites et la révision du dossier."; }
  }
  onDestroy(() => { generation++; });
</script>
<section class="panel">
  <div class="section-heading"><div><p class="eyebrow">Acquisition locale</p><h2>Un registre, même à partir d’un tableur.</h2></div><span class="icon-tile"><Icon name="import" size={26} /></span></div>
  <p class="help">CSV uniquement. Chaque import ajoute de nouvelles fiches, même si leur nom existe déjà. Les cellules restent du texte ; aucune formule n’est exécutée. Le fichier brut et son nom ne sont pas conservés.</p>
  <fieldset disabled={busy || reading}>
    <div class="grid-two"><label class="field">Encodage<select aria-label="Encodage" bind:value={encoding} onchange={reset}><option value="utf-8">UTF-8 (strict)</option><option value="windows-1252">Windows-1252</option></select></label><label class="field">Séparateur<select aria-label="Séparateur" bind:value={delimiter} onchange={reset}><option value=";">Point-virgule</option><option value=",">Virgule</option><option value={"\t"}>Tabulation</option></select></label></div>
    <label class="upload-zone"><Icon name="import" size={32} /><strong>Ouvrir un CSV sur cet appareil</strong><span>2 Mio maximum · Lecture locale · Aucun envoi</span><input aria-label="Fichier CSV" type="file" accept=".csv,text/csv" bind:this={fileInput} onchange={(e) => read(e.currentTarget.files?.[0])} /></label>
    <button type="button" class="text-button" onclick={template}>Essayer le modèle fictif : association & service</button>
  </fieldset>
  {#if reading}<p role="status">Lecture locale…</p>{/if}{#if error}<p class="notice error" role="alert">{error}</p>{/if}
  {#if table}<div class="section-heading"><h3>Associer les colonnes</h3><span class="tag">Aucune association automatique</span></div>
    <div class="mapping-grid">{#each table.headers as header, column}<label class="field"><span>{column + 1}. {header}</span><select aria-label={`Associer ${header}`} disabled={busy} value={mapping.find((m) => m.column === column)?.field ?? ""} onchange={(e) => mapColumn(column, e.currentTarget.value)}><option value="">Ignorer cette colonne</option>{#each CSV_FIELDS as field}<option value={field}>{labels[field]}</option>{/each}</select></label>{/each}</div>
    {#if !preview}<p class="notice">Associez au minimum l’activité et le rôle, chacun à une seule colonne. Rôles reconnus : responsable, sous-traitant, controller, processor.</p>{:else}
      <h3>Aperçu avant enregistrement</h3><p>{preview.activities.length} fiche(s) à ajouter · {preview.rejectedRows.length} ligne(s) rejetée(s).</p>
      <p class="help">Colonnes ignorées : {preview.ignoredColumns.map((c) => `${c + 1}. ${table!.headers[c]}`).join(" · ") || "Aucune"}. Les numéros désignent les enregistrements CSV, en-tête compris.</p>
      {#if preview.ignoredCells.length}<div class="notice"><strong>Cellules non reprises pour le rôle de la fiche</strong><ul>{#each preview.ignoredCells as cell}<li>Ligne {cell.row}, colonne {cell.column + 1} ({table.headers[cell.column]}) : rubrique incompatible avec ce rôle.</li>{/each}</ul></div>{/if}
      <div class="table-scroll"><table><thead><tr><th>Ligne</th><th>Activité</th><th>Résultat</th></tr></thead><tbody>{#each table.rows as row, i}<tr><td>{i + 2}</td><td>{row[mapping.find((m) => m.field === "title")?.column ?? -1] ?? ""}</td><td>{preview.acceptedRows.includes(i + 2) ? "Nouvelle fiche, brouillon" : `Rejet : ${rejection[preview.rejectedRows.find((r) => r.row === i + 2)?.reason ?? "invalid"]}`}</td></tr>{/each}</tbody></table></div>
      <p class="help">Les valeurs absentes, « inconnu », « ? » et « n/a » restent inconnues. Les relations, contrats et états de revue doivent être renseignés séparément.</p>
      <label class="check"><input type="checkbox" bind:checked={accepted} disabled={busy} />J’ai examiné les lignes rejetées, colonnes ignorées et nouvelles fiches sans fusion.</label>
      <button disabled={busy || !accepted || !preview.activities.length} onclick={save}>Importer les fiches examinées</button>
    {/if}<button class="secondary" disabled={busy} onclick={reset}>Annuler l’import</button>
  {/if}
  {#if workspace.imports.length}<details class="subpanel"><summary>Provenances du dossier ({workspace.imports.length})</summary>{#each workspace.imports as batch}<p>{batch.at} · {batch.acceptedRows.length} ajout(s) · {batch.rejectedRows.length} rejet(s) · {batch.ignoredColumns.length} colonne(s) ignorée(s). Mapping et numéros de ligne conservés ; aucun contenu brut.</p>{/each}</details>{/if}
</section>
