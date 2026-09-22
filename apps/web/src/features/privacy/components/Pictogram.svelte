<script lang="ts">
  let { kind = "register" }: { kind?: "register" | "analysis" | "delivery" | "flows" | "book" } = $props();
</script>
<svg class="desk-pictogram" viewBox="0 0 104 96" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path d="M8 76h88M16 84h72" stroke="#ced5e4" stroke-width="1.5" />
  {#if kind === "register" || kind === "book"}
    <path d="m36 14 48 7-8 58-48-7Z" fill="#b2c4ec" stroke="#1c2333" stroke-width="2" />
    <rect x="22" y="10" width="48" height="64" rx="4" fill="#ffffff" stroke="#1c2333" stroke-width="2" />
    <path d="M30 10v64M38 28h23M38 36h16M38 46h23M38 54h16" stroke="#1c2333" stroke-width="2" stroke-linecap="round" />
    <path d="M39 10v10l6-4 6 4V10" fill="#7591d3" />
    <rect x="58" y="54" width="26" height="23" rx="3" fill="#1d2536" /><path d="M65 62h12M65 68h8" stroke="#a5bcf1" stroke-width="2" />
  {:else if kind === "analysis"}
    <path d="M18 15h52v59H18Z" fill="#ffffff" stroke="#1c2333" stroke-width="2" /><path d="M25 25h29M25 34h20M25 45h16" stroke="#1c2333" stroke-width="2" stroke-linecap="round" />
    <circle cx="63" cy="51" r="21" fill="#acc1f1" stroke="#1c2333" stroke-width="2" /><path d="m78 67 12 14" stroke="#1c2333" stroke-width="7" stroke-linecap="round" /><path d="M54 46h17M54 52h13M54 58h8" stroke="#1c2333" stroke-width="2" stroke-linejoin="round" />
    <path d="M82 13v10M77 18h10" stroke="#3157d5" stroke-width="2" />
  {:else if kind === "flows"}
    <path d="M28 30h45v32H30V30M52 30V16" stroke="#1d2536" stroke-width="2" stroke-linejoin="round" />
    <rect x="14" y="17" width="30" height="24" rx="4" fill="#acc1f1" stroke="#1c2333" stroke-width="2" /><rect x="60" y="16" width="30" height="25" rx="4" fill="#ffffff" stroke="#1c2333" stroke-width="2" />
    <rect x="14" y="52" width="30" height="24" rx="4" fill="#ffffff" stroke="#1c2333" stroke-width="2" /><rect x="60" y="52" width="30" height="24" rx="4" fill="#1d2536" />
    <path d="M22 26h14M22 32h9M68 25h14M68 31h9M22 61h14M22 67h9M68 61h14M68 67h9" stroke="#6076a8" stroke-width="2" /><path d="m47 59 4 4-4 4" stroke="#1c2333" stroke-width="2" />
  {:else}
    <path d="M18 34 51 14l35 20v39H18Z" fill="#bbcaef" stroke="#1c2333" stroke-width="2" /><path d="M29 12h43v43H29Z" fill="#ffffff" stroke="#1c2333" stroke-width="2" /><path d="M38 25h25M38 33h25M38 41h16" stroke="#1c2333" stroke-width="2" stroke-linecap="round" /><path d="m18 36 33 24 35-24v38H18Z" fill="#1d2536" /><path d="m18 74 25-21m43 21L61 53" stroke="#596fa2" stroke-width="1.5" /><circle cx="80" cy="18" r="12" fill="#87a5ec" stroke="#1d2536" stroke-width="2" /><path d="m75 18 4 4 7-8" stroke="#1d2536" stroke-width="2" />
  {/if}
  <path d="M8 9h5m-2.5-2.5v5" stroke="#3157d5" stroke-width="1.5" /><circle cx="95" cy="48" r="2" fill="#8b9eca" />
</svg>
