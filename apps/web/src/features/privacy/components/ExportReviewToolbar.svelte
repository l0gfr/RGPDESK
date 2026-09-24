<script lang="ts">
  import Icon from "./Icon.svelte";
  let {target, formats}: {target:HTMLElement | undefined; formats:string} = $props();
</script>
<div class="draft-toolbar export-review-toolbar" role="region" aria-label="Accès à l’export du rapport">
  <div><strong>Votre rapport à remettre</strong><span>{formats} · après confirmation de votre relecture</span></div>
  <button type="button" onclick={() => { target?.focus({preventScroll:true}); target?.scrollIntoView({block:"start"}); }}><Icon name="print" />Accéder à l’export</button>
</div>
