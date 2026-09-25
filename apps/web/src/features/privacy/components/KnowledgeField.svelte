<script lang="ts">
  import { knowledge, knowledgeText, type Knowledge } from "@rgpdesk/privacy-core";
  import { tick } from "svelte";
  import DeclarationPicker from "./DeclarationPicker.svelte";
  import type { DeclarationKind } from "../reusable-declarations";
  import { fr } from "../i18n/fr";
  let { label, value = $bindable(), hint = "", reuse }: { label: string; value: Knowledge; hint?: string; reuse?: DeclarationKind } = $props();
  const fieldId = $props.id();
  let input: HTMLTextAreaElement | undefined = $state();
  let reused = $state(false);
  async function useDeclaration(text: string) { value = knowledge(text); reused = true; await tick(); input?.focus({ preventScroll: true }); }
</script>

<div class="field" class:reusable-field={reuse !== undefined}>
  <label for={fieldId}>{label}</label>
  <textarea bind:this={input} id={fieldId} aria-describedby={`${fieldId}-hint`} rows="2" maxlength="4000" value={knowledgeText(value)} placeholder={fr.unknown}
    oninput={(event) => { value = knowledge(event.currentTarget.value); reused = false; }}></textarea>
  <small id={`${fieldId}-hint`}>{value.state === "unknown" ? fr.unknown : "Information déclarée"}{hint ? ` · ${hint}` : ""}</small>
  {#if reuse}<DeclarationPicker kind={reuse} {label} current={knowledgeText(value)} multiple={reuse === "channel" || reuse === "location" || reuse === "access"} onUse={(text) => void useDeclaration(text)} />{/if}
  {#if reused}<small role="status">Texte repris dans ce champ, à adapter à votre situation.</small>{/if}
</div>
