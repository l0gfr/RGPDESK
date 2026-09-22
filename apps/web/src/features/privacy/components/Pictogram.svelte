<script lang="ts">
  let { kind = "register" }: { kind?: "register" | "analysis" | "delivery" | "flows" | "book" } = $props();
</script>
<svg class="desk-pictogram" viewBox="0 0 104 96" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path d="M8 76h88M16 84h72" stroke="#d9ddd5" stroke-width="1.5" />
  {#if kind === "register" || kind === "book"}
    <path d="m36 14 48 7-8 58-48-7Z" fill="#dae9b5" stroke="#1f302b" stroke-width="2" />
    <rect x="22" y="10" width="48" height="64" rx="4" fill="#fbfaf6" stroke="#1f302b" stroke-width="2" />
    <path d="M30 10v64M38 28h23M38 36h16M38 46h23M38 54h16" stroke="#1f302b" stroke-width="2" stroke-linecap="round" />
    <path d="M39 10v10l6-4 6 4V10" fill="#bacf79" />
    <rect x="58" y="54" width="26" height="23" rx="3" fill="#20332d" /><path d="M65 62h12M65 68h8" stroke="#dbf3a3" stroke-width="2" />
  {:else if kind === "analysis"}
    <path d="M18 15h52v59H18Z" fill="#fbfaf6" stroke="#1f302b" stroke-width="2" /><path d="M25 25h29M25 34h20M25 45h16" stroke="#1f302b" stroke-width="2" stroke-linecap="round" />
    <circle cx="63" cy="51" r="21" fill="#dceeaf" stroke="#1f302b" stroke-width="2" /><path d="m78 67 12 14" stroke="#1f302b" stroke-width="7" stroke-linecap="round" /><path d="M53 52h6l4-10 4 16 4-7h5" stroke="#1f302b" stroke-width="2" stroke-linejoin="round" />
    <path d="M82 13v10M77 18h10" stroke="#be774f" stroke-width="2" />
  {:else if kind === "flows"}
    <path d="M28 30h45v32H30V30M52 30V16" stroke="#20332d" stroke-width="2" stroke-linejoin="round" />
    <rect x="14" y="17" width="30" height="24" rx="4" fill="#dceeaf" stroke="#1f302b" stroke-width="2" /><rect x="60" y="16" width="30" height="25" rx="4" fill="#fbfaf6" stroke="#1f302b" stroke-width="2" />
    <rect x="14" y="52" width="30" height="24" rx="4" fill="#fbfaf6" stroke="#1f302b" stroke-width="2" /><rect x="60" y="52" width="30" height="24" rx="4" fill="#20332d" />
    <path d="M22 26h14M22 32h9M68 25h14M68 31h9M22 61h14M22 67h9M68 61h14M68 67h9" stroke="#839771" stroke-width="2" /><path d="m47 59 4 4-4 4" stroke="#1f302b" stroke-width="2" />
  {:else}
    <path d="M18 34 51 14l35 20v39H18Z" fill="#dfedbd" stroke="#1f302b" stroke-width="2" /><path d="M29 12h43v43H29Z" fill="#fbfaf6" stroke="#1f302b" stroke-width="2" /><path d="M38 25h25M38 33h25M38 41h16" stroke="#1f302b" stroke-width="2" stroke-linecap="round" /><path d="m18 36 33 24 35-24v38H18Z" fill="#20332d" /><path d="m18 74 25-21m43 21L61 53" stroke="#738874" stroke-width="1.5" /><circle cx="80" cy="18" r="12" fill="#c9ea89" stroke="#20332d" stroke-width="2" /><path d="m75 18 4 4 7-8" stroke="#20332d" stroke-width="2" />
  {/if}
  <path d="M8 9h5m-2.5-2.5v5" stroke="#a17e55" stroke-width="1.5" /><circle cx="95" cy="48" r="2" fill="#b6c78e" />
</svg>
