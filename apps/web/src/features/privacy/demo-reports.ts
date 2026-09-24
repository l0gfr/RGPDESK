import { projectShare, renderShareFiles, projectPiaPublication, renderPiaPublication, PIA_SHARE_SECTIONS, type PiaShareSection, type ShareOptions } from "@rgpdesk/privacy-core";
import { createDemoWorkspace } from "./demo";

// Build-time, fixed editorial fiction only. No workspace argument or browser storage.
export async function buildDemoReports() {
  let sequence = 0;
  const id = () => `de000000-0000-4000-8000-${String(++sequence).padStart(12, "0")}`;
  const at = "2026-09-23T12:00:00.000Z";
  const workspace = createDemoWorkspace(id, at);
  const register = (role: "controller" | "processor") => {
    const activities = workspace.activities.filter(a => a.role === role);
    const ids = activities.map(a => a.id);
    const options: ShareOptions = {
      profile: role === "controller" ? "article30-controller" : "article30-processor",
      recipient: "Direction de Maison Sillage · destinataire fictif",
      scope: `DÉMONSTRATION FICTIVE. ${role === "controller" ? "Recrutement, relations clients et projet de badges." : "Ateliers organisés pour le compte du client fictif."} Les flux sélectionnés et les suites figurent dans ce rapport.`,
      reservations: ["Exercice pédagogique, sans activité réelle ni validation juridique. Les inconnues restent visibles.", "Les fondements juridiques, durées et transferts restent à examiner. Aucun traitement n’est autorisé par cet exemple."],
      activityIds: ids, clientId: null,
      documentIds: workspace.documents.filter(d => d.publicReference && d.activityIds.length && d.activityIds.every(a => ids.includes(a))).map(d => d.id),
      flowIds: activities.flatMap(a => a.flows.map(f => f.id)), presentation: true,
      decisionIds: workspace.decisions.filter(d => !d.activityId || ids.includes(d.activityId)).map(d => d.id),
      actionIds: workspace.actions.filter(a => !a.closure && (!a.activityId || ids.includes(a.activityId))).map(a => a.id),
      executive: role === "controller" ? {
        changes: "Le projet de badges ajoute un contrôle des accès aux activités de recrutement et de relation client. Les usages des journaux et les habilitations demandent un examen distinct.",
        arbitrations: "Comparer les variantes de contrôle d’accès et obtenir les pièces manquantes avant une nouvelle revue. Le scénario ne prévoit aucune autorisation de mise en œuvre.",
      } : {
        changes: "Les inscriptions et présences aux ateliers sont traitées pour le compte d’un client. Les deux flux du scénario sont présentés ensemble.",
        arbitrations: "Obtenir et préciser les instructions du client, notamment pour la suppression, puis vérifier les accès et la restitution des présences.",
      },
    };
    return renderShareFiles(projectShare(workspace, options, id, at))["report.html"]!;
  };
  const pia = workspace.impactAssessments[0]!;
  const publication = projectPiaPublication(workspace, {
    piaId: pia.id, reviewId: pia.reviews[0]!.id,
    sections: Object.keys(PIA_SHARE_SECTIONS) as PiaShareSection[],
    recipient: "Direction de Maison Sillage · destinataire fictif",
    scope: "DÉMONSTRATION FICTIVE. Projet de badges : toutes les rubriques partageables de la revue conservée, de son contexte à ses suites.",
    reservations: "Scénario renvoyé pour approfondissement. Les risques, garanties et alternatives restent à examiner. Aucune mise en œuvre autorisée. Les preuves et objections internes ne font pas partie de cette restitution.",
  }, id(), at);
  return [
    { slug: "registre", title: "Le registre responsable", icon: "register", caption: "3 activités · 5 flux", description: "La lecture direction, les fiches visuelles, les flux choisis, les suites et l’annexe détaillée.", html: register("controller") },
    { slug: "sous-traitance", title: "Le registre sous-traitant", icon: "parties", caption: "1 activité · 2 flux", description: "Les opérations pour un client, les acteurs, les deux flux et les points encore à éclaircir.", html: register("processor") },
    { slug: "aipd", title: "L’analyse d’impact", icon: "impact", caption: "9 rubriques · 1 revue", description: "Les principes RGPD, la nécessité, les alternatives, les risques, les mesures, les avis et la revue humaine.", html: await renderPiaPublication(publication) },
  ];
}

// Only accepts the exact controlled renderer structure, never uploaded HTML.
export function demoReportParts(html: string) {
  const styles = [...html.matchAll(/<style>([\s\S]*?)<\/style>/g)];
  const body = html.match(/<body>([\s\S]*)<\/body>/);
  if (styles.length !== 1 || !body || /<(?:script|iframe|img|form)\b|\son[a-z]+=/i.test(body[1]!)) throw new Error("Unexpected demonstration report structure");
  return { style: styles[0]![1]!, body: body[1]! };
}
