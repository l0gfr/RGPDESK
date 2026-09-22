<script lang="ts">
  let { name = "folder", size = 20 }: { name?: string; size?: number } = $props();
  const paths: Record<string, string> = {
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
</script>
<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="desk-icon"><path d={paths[name] ?? paths.folder} /></svg>
