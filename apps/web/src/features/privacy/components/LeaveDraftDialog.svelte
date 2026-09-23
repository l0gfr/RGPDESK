<script lang="ts">
  import { onMount } from "svelte";
  let { onStay, onDiscard }: { onStay: () => void; onDiscard: () => void } = $props();
  let dialog: HTMLDialogElement | undefined = $state();
  let stay: HTMLButtonElement | undefined = $state();
  onMount(() => { dialog?.showModal(); stay?.focus(); });
</script>
<dialog bind:this={dialog} class="leave-draft-dialog" aria-labelledby="leave-draft-title" aria-describedby="leave-draft-description" oncancel={(event) => { event.preventDefault(); onStay(); }}>
  <p class="eyebrow">Votre saisie est toujours là</p>
  <h2 id="leave-draft-title">Avant de changer de rubrique</h2>
  <p id="leave-draft-description">Les dernières saisies n’ont pas été enregistrées. Reprenez-les pour les enregistrer, ou abandonnez-les pour poursuivre. Les données déjà enregistrées seront conservées.</p>
  <div class="actions"><button bind:this={stay} onclick={onStay}>Reprendre ma saisie</button><button class="secondary" onclick={onDiscard}>Quitter sans enregistrer</button></div>
</dialog>
