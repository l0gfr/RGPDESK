import { createPiaRisk, knowledge, type PiaRisk } from "@rgpdesk/privacy-core";

// Local editorial prompts, not legal findings. Never infer applicability from a vault.
export interface RightsPrompt {
  id: string;
  article: "8" | "9" | "10" | "11" | "14";
  title: string;
  question: string;
  limit: string;
  source: string;
  reference: string;
  edition: string;
}
export const RIGHTS_CATALOGUE_REVIEWED = "25 septembre 2026";
const guides = "https://ks.echr.coe.int/documents/d/echr-ks/";
export const RIGHTS_PROMPTS: readonly RightsPrompt[] = [
  { id: "autonomy", article: "8", title: "Autonomie et choix personnels", question: "L’usage prévu peut-il restreindre les choix personnels ou les relations que la personne souhaite développer ?", limit: "L’autonomie ne protège pas toute activité souhaitée. L’application aux mécanismes commerciaux d’influence demande un examen du contexte.", source: guides + "guide_art_8_eng#page=77", reference: "Guide article 8 · §§ 287–288 et 292 · p. 77–78", edition: "28 février 2026 · anglais" },
  { id: "workplace", article: "8", title: "Vie privée au travail", question: "Le suivi prévu des communications réduit-il l’espace de vie privée des salariés, même si les accès sont autorisés ?", limit: "Examiner information, intrusion, justification, autres moyens, conséquences et recours ; le guide traite notamment de la surveillance par l’employeur.", source: guides + "guide_art_8_eng#page=156", reference: "Guide article 8 · §§ 653–655 · p. 156–157", edition: "28 février 2026 · anglais" },
  { id: "banking", article: "8", title: "Données bancaires et vie privée", question: "Les accès prévus aux informations bancaires exposent-ils des aspects de la vie privée ou des échanges professionnels protégés ?", limit: "Le passage concerne un contrôle fiscal et ses garanties. Il ne consacre pas un secret bancaire absolu.", source: guides + "guide_art_8_eng#page=70", reference: "Guide article 8 · § 251 · p. 70", edition: "28 février 2026 · anglais" },
  { id: "health", article: "8", title: "Santé et stigmatisation", question: "Les partages prévus d’informations de santé peuvent-ils exposer les personnes à la stigmatisation ou à l’exclusion ?", limit: "La protection des informations médicales est forte mais non absolue ; contextualiser le partage et ses garanties.", source: guides + "guide_data_protection_fre#page=15", reference: "Guide protection des données · §§ 31–33 · p. 15–16", edition: "31 août 2025 · français" },
  { id: "reputation", article: "8", title: "Réputation et portrait durable", question: "L’agrégation d’informations peut-elle enfermer une personne dans un portrait durable et incomplet ?", limit: "Le passage porte sur des archives accessibles et leur mise en balance avec la liberté d’information, pas sur tout profilage.", source: guides + "guide_data_protection_fre#page=79", reference: "Guide protection des données · §§ 313–317 · p. 79–80", edition: "31 août 2025 · français" },
  { id: "tracking", article: "8", title: "Identification dans l’espace public", question: "Le traitement permet-il de reconnaître ou de suivre une personne au-delà de la finalité décrite ?", limit: "Le cas examiné concerne la reconnaissance faciale policière d’un manifestant. Sa transposition à un autre contexte doit être justifiée.", source: guides + "guide_data_protection_fre#page=41", reference: "Guide protection des données · § 145 · p. 41", edition: "31 août 2025 · français" },
  { id: "beliefs", article: "9", title: "Convictions et liberté de ne pas les révéler", question: "Le parcours oblige-t-il à révéler des convictions, directement ou par un choix dont on peut les déduire ?", limit: "Distinguer révélation imposée et information volontaire nécessaire à une demande d’aménagement ; plusieurs exemples concernent des procédures publiques.", source: guides + "guide_art_9_fre#page=28", reference: "Guide article 9 · §§ 68–70 · p. 28–29", edition: "5 mars 2026 · français" },
  { id: "expression", article: "10", title: "Expression et réactions en ligne", question: "L’usage des publications ou réactions en ligne peut-il décourager une expression protégée ou conduire à une sanction ?", limit: "Le cas porte sur un licenciement lié à des mentions « J’aime ». Il ne protège pas indistinctement tous les contenus.", source: guides + "guide_art_10_fre#page=138", reference: "Guide article 10 · § 729 · p. 138–139", edition: "28 février 2026 · français" },
  { id: "journalism", article: "10", title: "Confidentialité des sources journalistiques", question: "Les données exploitées peuvent-elles identifier une source journalistique et compromettre sa relation avec un journaliste ?", limit: "Piste à examiner si le traitement touche ces activités ; les cas cités concernent surveillance et données de communications.", source: guides + "guide_art_10_fre#page=76", reference: "Guide article 10 · §§ 390–392 · p. 76", edition: "28 février 2026 · français" },
  { id: "assembly", article: "11", title: "Participation à une réunion pacifique", question: "L’identification des participants ou l’utilisation prévue de ces données peut-elle dissuader de participer ?", limit: "Les passages traitent de mesures publiques. Un fichier privé d’inscriptions ne constitue pas, à lui seul, une atteinte établie.", source: guides + "guide_art_11_eng#page=20", reference: "Guide article 11 · §§ 82–84 · p. 20", edition: "28 février 2026 · anglais" },
  { id: "union", article: "11", title: "Liberté syndicale", question: "Les décisions alimentées par les données peuvent-elles pénaliser l’adhésion, la non-adhésion ou la représentation syndicale ?", limit: "Le guide examine sanctions et incitations dans les relations de travail ; il ne crée pas d’immunité générale contre le licenciement.", source: guides + "guide_art_11_eng#page=45", reference: "Guide article 11 · §§ 260–264 · p. 45", edition: "28 février 2026 · anglais" },
  { id: "discrimination", article: "14", title: "Discrimination directe ou indirecte", question: "Une règle ou un classement peut-il désavantager un groupe protégé, même avec des données exactes et sans intention discriminatoire ?", limit: "L’article 14 se rattache au champ d’un autre droit conventionnel. Une différence de résultat ne suffit pas à conclure : examiner comparaison et justification.", source: guides + "guide_art_14_art_1_protocol_12_fre#page=12", reference: "Guide article 14 · §§ 2–3 et 32–35 · p. 6, 12–13", edition: "31 août 2025 · français" },
];
const fold = (value: string) => value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("fr");
const aliases: Readonly<Record<string, string>> = { banking: "banque compte paiement transaction", beliefs: "religion religieuse croyance", workplace: "surveillance employeur salarié", reputation: "profil profilage", union: "syndicat" };
export function findRightsPrompts(query: string, article = ""): readonly RightsPrompt[] {
  const words = fold(query.slice(0, 160)).trim().split(/\s+/).filter(Boolean);
  return RIGHTS_PROMPTS.filter(item => (!article || item.article === article) && words.every(word => fold(`${item.title} ${item.question} ${item.limit} ${item.reference} ${aliases[item.id] ?? ""}`).includes(word)));
}
/** Explicit user choice creates only a named subject to investigate. No event, level or conclusion. */
export function riskFromRightsPrompt(promptId: string, id: string): PiaRisk | null {
  const prompt = RIGHTS_PROMPTS.find(item => item.id === promptId);
  if (!prompt) return null;
  return { ...createPiaRisk(id), title: `${prompt.title} · à examiner`, rights: knowledge(`Droit à examiner : ${prompt.title}.\nRepère : ${prompt.reference}, édition ${prompt.edition}.\n${prompt.source}\nApplicabilité et effets dans ce contexte à motiver.`) };
}
