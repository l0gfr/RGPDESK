<script lang="ts">
  import { knowledge, knowledgeText, type Knowledge } from "@rgpdesk/privacy-core";
  import { fr } from "../i18n/fr";
  let { label, value = $bindable(), hint = "" }: { label: string; value: Knowledge; hint?: string } = $props();
  const fieldId = $props.id();
</script>

<div class="field">
  <label for={fieldId}>{label}</label>
  <textarea id={fieldId} aria-describedby={`${fieldId}-hint`} rows="2" maxlength="4000" value={knowledgeText(value)} placeholder={fr.unknown}
    oninput={(event) => value = knowledge(event.currentTarget.value)}></textarea>
  <small id={`${fieldId}-hint`}>{value.state === "unknown" ? fr.unknown : "Information déclarée"}{hint ? ` · ${hint}` : ""}</small>
</div>
