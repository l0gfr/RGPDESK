<script lang="ts">
  let { name = "folder", size = 20 }: { name?: string; size?: number } = $props();
  const paths: Record<string, string> = {
    flows: "M3 3h6v6H3ZM15 15h6v6h-6ZM6 9v9h9M15 3h6v6h-6ZM9 6h6M18 9v6",
    analysis: "M4 3h11l4 4v5M4 3v18h7M8 7h3M8 11h4M8 15h2M21 16a5 5 0 1 1-10 0 5 5 0 0 1 10 0M20 20l3 3",
    overview: "M3 3h7v7H3ZM14 3h7v7h-7ZM3 14h7v7H3ZM14 14h7v7h-7Z",
    folder: "M3 7a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v9H3Z",
    register: "M5 3h14v18H5ZM9 7h6M9 11h6M9 15h4M3 6h4M3 10h4M3 14h4M3 18h4",
    organization: "M4 21V7l8-4 8 4v14M8 21v-5h8v5M8 8h1M15 8h1M8 12h1M15 12h1M2 21h20",
    parties: "M15 21v-3a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v3M9 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8M17 3a4 4 0 0 1 0 7M21 21v-3a4 4 0 0 0-3-3.87",
    systems: "M3 4h18v12H3ZM8 21h8M12 16v5M7 8h3M7 12h7",
    documents: "M5 3h9l5 5v13H5ZM14 3v6h5M9 13h6M9 17h4",
    actions: "m4 6 2 2 4-4M13 6h7m-16 8 2 2 4-4M13 14h7M13 20h7",
    import: "M12 3v12m-4-4 4 4 4-4M4 15v6h16v-6",
    delivery: "M3 9v12h18V9M3 9l9-6 9 6M3 9l9 6 9-6M8 18h8",
    backup: "M5 3h12l4 4v14H3V3h2ZM7 3v6h10V3M7 21v-8h10v8",
    lock: "M5 10h14v11H5ZM8 10V7a4 4 0 0 1 8 0v3M12 14v3",
    shield: "m12 2 9 4v6c0 5-9 10-9 10S3 17 3 12V6Zm-4 10 3 3 5-6",
    arrow: "M4 12h16m-6-6 6 6-6 6", plus: "M12 5v14M5 12h14",
    eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Zm13 0a3 3 0 1 0-6 0 3 3 0 0 0 6 0",
    clock: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0M12 6v6l4 2",
    book: "M12 5v16M12 5C8 2 4 3 2 4v15c4-2 7-1 10 2 3-3 6-4 10-2V4c-4-2-7-1-10 1",
    check: "m5 12 4 4L19 6", chevron: "m9 5 7 7-7 7", key: "M14 8a5 5 0 1 1-5-5 5 5 0 0 1 5 5Zm-1 3 8 8v2h-3v-3h-3l-3-3",
  };
  const accents: Record<string, string> = {
    flows: "M3 3h6v6H3ZM15 15h6v6h-6ZM15 3h6v6h-6Z",
    analysis: "M4 3h11l4 4v5M4 3v18h7M8 7h3M8 11h4M8 15h2M21 16a5 5 0 1 1-10 0 5 5 0 0 1 10 0M20 20l3 3",
    overview: "M3 3h7v7H3ZM14 14h7v7h-7Z", folder: "M3 8h18v13H3Z",
    register: "M5 3h14v18H5Z", organization: "M4 8 12 3l8 5v13H4Z",
    parties: "M13 6a4 4 0 1 1-8 0 4 4 0 0 1 8 0M3 18c0-6 12-6 12 0v3H3Z",
    systems: "M3 4h18v12H3Z", documents: "M5 3h9v6h5v12H5Z",
    actions: "M2 2h9v8H2ZM2 10h9v8H2Z", import: "M4 15h16v6H4Z",
    delivery: "M3 9 12 3l9 6v12H3Z", backup: "M3 3h4v6h10V3l4 4v14H3Z",
    lock: "M5 10h14v11H5Z", shield: "m12 2 9 4v6c0 5-9 10-9 10S3 17 3 12V6Z",
    eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z",
    clock: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0", book: "M12 5v16c3-3 6-4 10-2V4c-4-2-7-1-10 1",
  };
</script>
<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="desk-icon">{#if accents[name]}<path d={accents[name]} fill="currentColor" fill-opacity=".16" stroke="none" />{/if}<path d={paths[name] ?? paths.folder} /></svg>
