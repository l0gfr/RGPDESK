<script lang="ts">
  import { onMount } from "svelte";
  import type { PdfReport } from "../pdf-export";
  import { reportBody } from "../report-preview";
  import { piaPreviewBody } from "../pia-preview";
  import registerStyle from "../assets/demo-report-register.css?url";
  import readingStyle from "../assets/demo-report-readable.css?url";
  import piaStyle from "../assets/demo-report-pia.css?url";
  import "../pdf-export.css";
  let {report, beforePrint, onClose}: {report:PdfReport; beforePrint:()=>Promise<boolean>; onClose:()=>void} = $props();
  onMount(() => {
    // Only the reviewed projection enters this separate print surface. No HTML
    // parsing, window sharing, iframe, user-supplied URL or private master copy.
    const previousFocus = document.activeElement;
    const previousTitle = document.title;
    const container = document.createElement("section");
    container.setAttribute("data-rgpdesk-pdf", "");
    container.setAttribute("role", "dialog");
    container.setAttribute("aria-modal", "true");
    container.setAttribute("aria-labelledby", "pdf-export-title");
    const toolbar = document.createElement("header"); toolbar.className = "pdf-toolbar";
    const heading = document.createElement("h1"); heading.id = "pdf-export-title"; heading.textContent = "Votre rapport en PDF";
    const help = document.createElement("p"); help.textContent = "Choisissez « Enregistrer au format PDF » dans la boîte d’impression, au format A4. Seul ce rapport sera imprimé. Le PDF obtenu est une copie en clair à protéger.";
    const status = document.createElement("p"); status.setAttribute("role", "status"); status.textContent = "Préparation de la mise en page…";
    const print = document.createElement("button"); print.type = "button"; print.textContent = "Enregistrer au format PDF"; print.disabled = true;
    const close = document.createElement("button"); close.type = "button"; close.className = "pdf-close"; close.textContent = "Revenir au dossier";
    const actions = document.createElement("div"); actions.className = "pdf-actions"; actions.append(print, close);
    toolbar.append(heading, help, actions, status);
    const host = document.createElement("div"); host.className = "pdf-report";
    const root = host.attachShadow({mode:"open"});
    const link = document.createElement("link"); link.rel = "stylesheet"; link.href = report.kind === "pia" ? piaStyle : registerStyle;
    const reading = document.createElement("link"); reading.rel = "stylesheet"; reading.href = readingStyle;
    let alive = true, ready = false, printing = false, loaded = 0;
    link.onload = reading.onload = () => { if (alive && ++loaded === 2) { ready = true; print.disabled = false; status.textContent = "Rapport prêt. L’enregistrement se fait dans la boîte d’impression de votre navigateur."; } };
    link.onerror = reading.onerror = () => { if (alive) status.textContent = "Mise en page indisponible. Revenez au dossier et réessayez après avoir rechargé l’application."; };
    try { root.append(link, reading, report.kind === "pia" ? piaPreviewBody(report.publication) : reportBody(report.register)); }
    catch { status.textContent = "Ce rapport ne peut pas être préparé. Revenez au dossier pour vérifier la restitution."; }
    container.append(toolbar, host);
    const siblings = [...document.body.children].filter((el): el is HTMLElement => el instanceof HTMLElement);
    const inertBefore = siblings.map(el => [el, el.inert] as const);
    document.body.append(container);
    document.body.setAttribute("data-rgpdesk-pdf-open", "");
    document.title = report.kind === "pia" ? "RGPDESK - AIPD" : "RGPDESK - Registre";
    for (const el of siblings) el.inert = true;
    close.focus();
    close.onclick = onClose;
    print.onclick = async () => {
      if (!ready || printing) return;
      printing = true; print.disabled = true;
      try {
        const allowed = await beforePrint();
        if (!alive) return;
        if (!allowed) { status.textContent = "Le coffre a changé ou n’est plus disponible. Revenez au dossier avant de préparer à nouveau ce rapport."; return; }
        window.print();
        if (alive) status.textContent = "Impression demandée au navigateur. Choisissez la destination PDF et confirmez l’enregistrement. Vérifiez ensuite le fichier sur votre disque.";
      } catch { if (alive) status.textContent = "Impression indisponible. Revenez au dossier et réessayez."; }
      finally { if (alive) { printing = false; print.disabled = !ready; } }
    };
    const navigate = (event:Event) => {
      const anchor = event.target instanceof Element ? event.target.closest("a") : null;
      if (!anchor) return;
      event.preventDefault();
      const href = anchor.getAttribute("href");
      if (!href?.startsWith("#")) return;
      const target = root.getElementById(href.slice(1));
      target?.setAttribute("tabindex", "-1"); target?.focus(); target?.scrollIntoView({block:"start"});
    };
    root.addEventListener("click", navigate);
    const keys = (event:KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); onClose(); return; }
      if (event.key !== "Tab") return;
      const controls = [...container.querySelectorAll<HTMLButtonElement>("button:not(:disabled)"), ...root.querySelectorAll<HTMLAnchorElement>("a[href]")];
      const active = root.activeElement ?? document.activeElement;
      const first = controls[0], last = controls[controls.length-1];
      if (event.shiftKey && (active === first || !controls.includes(active as HTMLButtonElement))) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && (active === last || !controls.includes(active as HTMLButtonElement))) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener("keydown", keys);
    return () => {
      alive = false; ready = false; link.onload = link.onerror = reading.onload = reading.onerror = null;
      root.removeEventListener("click", navigate); document.removeEventListener("keydown", keys);
      print.onclick = close.onclick = null; root.replaceChildren(); container.remove();
      document.body.removeAttribute("data-rgpdesk-pdf-open"); document.title = previousTitle;
      for (const [el, inert] of inertBefore) el.inert = inert;
      if (previousFocus instanceof HTMLElement && previousFocus !== document.body && previousFocus.isConnected) previousFocus.focus();
      else document.querySelector<HTMLElement>(".workspace-heading h1")?.focus();
    };
  });
</script>
