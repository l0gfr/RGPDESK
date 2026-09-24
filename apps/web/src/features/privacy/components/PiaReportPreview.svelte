<script lang="ts">
  import { onMount } from "svelte";
  import type { PiaPublication } from "@rgpdesk/privacy-core";
  import reportStyle from "../assets/demo-report-pia.css?url";
  import { piaPreviewBody } from "../pia-preview";
  let {publication}:{publication:PiaPublication}=$props();
  let host:HTMLDivElement; let error=$state(false);
  onMount(()=>{
    const root=host.attachShadow({mode:'open'});
    try {
      const link=document.createElement('link');link.rel='stylesheet';link.href=reportStyle;
      root.append(link,piaPreviewBody(publication));
      host.focus({preventScroll:true});host.scrollIntoView({block:'start'});
      const navigate=(event:Event)=>{
        const target=event.target instanceof Element?event.target.closest('a'):null;
        if(!target)return;
        event.preventDefault();
        const href=target.getAttribute('href');
        if(!href?.startsWith('#pia-'))return;
        const element=root.getElementById(href.slice(1));
        element?.setAttribute('tabindex','-1');element?.focus();element?.scrollIntoView({block:'start'});
      };
      root.addEventListener('click',navigate);
      return ()=>{root.removeEventListener('click',navigate);root.replaceChildren();};
    }catch{root.replaceChildren();error=true;}
  });
</script>
<p class="help">Voici la présentation du fichier à remettre. Le sommaire et les liens entre scénarios et mesures permettent de parcourir votre sélection avant de la confirmer.</p>
{#if error}<p role="alert">L’aperçu graphique n’a pas pu être affiché. Le tableau détaillé reste disponible.</p>{/if}
<div class="report-preview" role="region" tabindex="-1" bind:this={host} aria-label="Aperçu du rapport AIPD à remettre"></div>
