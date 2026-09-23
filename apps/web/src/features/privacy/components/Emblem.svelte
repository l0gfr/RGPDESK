<script lang="ts">
  import Icon from "./Icon.svelte";
  let { name, compact = false }: { name: string; compact?: boolean } = $props();
</script>
<span class="desk-emblem" class:compact aria-hidden="true"><Icon {name} size={compact ? 26 : 34} /></span>
