<script lang="ts">
  import { evaluateWorkspace, type Activity, type Workspace } from "@rgpdesk/privacy-core";
  import Icon from "./Icon.svelte";
  let { workspace, busy, onNavigate, onEdit }: { workspace: Workspace; busy: boolean; onNavigate: (panel: "register" | "organization" | "documents" | "actions" | "delivery" | "backup" | "import") => void; onEdit: (activity: Activity) => void } = $props();
  let findings = $derived(evaluateWorkspace(workspace, new Date().toISOString().slice(0, 10)));
  let openActions = $derived(workspace.actions.filter((action) => !action.closure));
  let nextActivity = $derived(workspace.activities.find((activity) => activity.status === "draft") ?? workspace.activities.find((activity) => activity.status !== "archived"));
  const route = [
    { panel: "organization", icon: "organization", title: "Cadrer votre mission", text: "Précisez l’organisme, les contacts et le périmètre que vous accompagnez.", action: "Décrire l’organisation" },
    { panel: "register", icon: "register", title: "Rencontrer les métiers", text: "Choisissez une activité, préparez l’entretien et consignez ce que vous apprenez.", action: "Ouvrir le registre" },
    { panel: "documents", icon: "documents", title: "Rassembler les références", text: "Retrouvez les notices, contrats et procédures qui éclairent chaque traitement.", action: "Relier les documents" },
    { panel: "actions", icon: "actions", title: "Organiser les suites", text: "Transformez une question ouverte en action, avec un responsable et une échéance.", action: "Examiner les questions" },
    { panel: "delivery", icon: "delivery", title: "Préparer votre restitution", text: "Sélectionnez les fiches utiles au destinataire et relisez le dossier avant de le transmettre.", action: "Préparer un partage" },
    { panel: "backup", icon: "backup", title: "Conserver votre travail", text: "Téléchargez une sauvegarde chiffrée et gardez une copie séparément de cet appareil.", action: "Sauvegarder le coffre" },
  ] as const;
</script>

<section class="mission-next" aria-labelledby="mission-next-title">
  <div><p class="eyebrow">{workspace.activities.length ? "Votre prochaine séance" : "Bienvenue dans votre mission"}</p><h2 id="mission-next-title">{nextActivity ? "Reprenez une activité, gardez le fil." : "Votre première fiche commence par une conversation."}</h2>
  <p>{nextActivity ? "Ouvrez une fiche pour poursuivre l’entretien ou examinez les questions restées ouvertes. Vous pouvez avancer par petites étapes." : "Choisissez un usage de données concret, puis échangez avec la personne qui le connaît. RGPDESK vous aide à poser les questions et à organiser les réponses."}</p>
  <div class="actions">{#if nextActivity}<button disabled={busy} onclick={() => onEdit(nextActivity!)}>Reprendre {nextActivity.title}<Icon name="arrow" /></button><button class="secondary" disabled={busy} onclick={() => onNavigate("actions")}>Voir les questions ouvertes</button>{:else}<button disabled={busy} onclick={() => onNavigate("register")}>Choisir ma première activité<Icon name="arrow" /></button><button class="secondary" disabled={busy} onclick={() => onNavigate("import")}>J’ai déjà un registre CSV</button>{/if}</div></div>
  <aside><Icon name="book" size={28} /><h3>Le bon réflexe</h3><p>Notez ce qui est connu. Laissez une information à examiner si vous ne l’avez pas encore. Enregistrez, puis revenez avec la réponse.</p></aside>
</section>
<nav class="mission-facts" aria-label="Accès au travail en cours"><button class="secondary" disabled={busy} onclick={() => onNavigate("register")}><strong>{workspace.activities.length}</strong> fiches au registre</button><button class="secondary" disabled={busy} onclick={() => onNavigate("actions")}><strong>{findings.length}</strong> questions à examiner</button><button class="secondary" disabled={busy} onclick={() => onNavigate("actions")}><strong>{openActions.length}</strong> actions en cours</button></nav>
<section aria-labelledby="mission-route-title"><div class="section-heading"><div><p class="eyebrow">Du premier entretien à la restitution</p><h2 id="mission-route-title">Un fil conducteur pour votre mission.</h2></div></div><div class="mission-route">{#each route as item, index}<article class="panel"><span class="route-number">0{index + 1}</span><Icon name={item.icon} size={26} /><h3>{item.title}</h3><p>{item.text}</p><button class="text-button" disabled={busy} onclick={() => onNavigate(item.panel)}>{item.action}<Icon name="arrow" size={16} /></button></article>{/each}</div></section>
<p class="help">Ce parcours organise votre travail. Les questions signalent des informations à examiner ; leur nombre n’est pas une mesure de conformité.</p>
