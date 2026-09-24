<script lang="ts">
  import { onMount } from "svelte";
  import type { SharedRegister } from "@rgpdesk/privacy-core";
  import reportStyle from "../assets/demo-report-register.css?url";
  import readableStyle from "../assets/demo-report-readable.css?url";
  import { reportBody } from "../report-preview";
  let {register}:{register:SharedRegister}=$props();
  let host:HTMLDivElement;let error=$state(false);
  onMount(()=>{
    const root=host.attachShadow({mode:'open'});
    try {
      const body=reportBody(register);
      for(const href of [reportStyle,readableStyle]){const link=document.createElement('link');link.rel='stylesheet';link.href=href;root.append(link);}
      root.append(body);
      host.focus({preventScroll:true});host.scrollIntoView({block:'start'});
      const navigate=(event:Event)=>{const target=event.target instanceof Element?event.target.closest('a'):null;if(!target)return;event.preventDefault();const id=target.getAttribute('href')?.slice(1);if(id){const el=root.getElementById(id);el?.setAttribute('tabindex','-1');el?.focus();el?.scrollIntoView({block:'start'});}};
      root.addEventListener('click',navigate);
      return ()=>{root.removeEventListener('click',navigate);root.replaceChildren();};
    } catch {root.replaceChildren();error=true;}
  });
</script>
<p class="help">Le contenu et les schémas sont ceux du rapport téléchargé. L’aperçu agrandit les petits caractères pour la lecture à l’écran. Consultez aussi l’annexe détaillée ci-dessous.</p>
{#if error}<p role="alert">L’aperçu graphique n’a pas pu être affiché. Le tableau du contenu reste disponible.</p>{/if}
<div class="report-preview" role="region" tabindex="-1" bind:this={host} aria-label="Aperçu du rapport à remettre"></div>
