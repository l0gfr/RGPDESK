import { test, expect } from "@playwright/test";
test("reference case, linked map, precise citation and four readings remain usable on small screens", async ({page}) => {
 await page.goto("/app/privacy/"); await page.getByRole("button",{name:"Explorer la démo",exact:true}).click();
 await page.getByText("Dix situations métier à explorer",{exact:true}).click();
 await page.getByRole("combobox",{name:"Choisir un cas de référence",exact:true}).selectOption("paie"); await page.getByRole("button",{name:"Ouvrir ce cas fictif",exact:true}).click();
 await expect(page.locator(".activity-records li")).toHaveCount(1);
 await page.getByRole("button",{name:"Analyse",exact:true}).click();
 const lenses=page.getByRole("navigation",{name:"Quatre lectures du même inventaire"}); await expect(lenses.getByRole("button")).toHaveCount(4);
 for(const width of [1440,390,320]) {await page.setViewportSize({width,height:1000});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 await page.setViewportSize({width:1280,height:1000}); await lenses.getByRole("button",{name:/03 \/ Risques SI/}).click();
 await expect(page.getByRole("heading",{name:"Risques SI",exact:true})).toBeVisible();
 await page.getByRole("button",{name:"Ouvrir Indisponibilité du portail en fin de mois",exact:true}).click();
 await expect(page.getByRole("group",{name:"Activités concernées, si identifiées",exact:true}).getByRole("checkbox")).toBeChecked();
 await page.getByRole("button",{name:"Fermer le dossier",exact:true}).click();
 await page.getByRole("button",{name:"Analyse",exact:true}).click(); await lenses.getByRole("button",{name:/02 \/ Nécessité/}).click();
 await expect(page.getByRole("button",{name:/3.*Nécessité/})).toHaveAttribute("aria-current","step");
 await page.getByRole("button",{name:"Analyse",exact:true}).click();
 // Opening an existing case creates no draft changes, so navigation remains immediate.
 await page.getByRole("button",{name:"Travailler l’analyse",exact:true}).click();
 await expect(page.getByLabel("Analyse 1 · Passage cité 1",{exact:true})).toHaveValue("Point 1 de l’entretien fictif");
 await page.getByLabel("Analyse 1 · Passage cité 1",{exact:true}).fill("Point 2, essai fictif");
 await page.getByRole("button",{name:"Enregistrer la fiche",exact:true}).click();
 await page.getByRole("button",{name:"Cartographie",exact:true}).click();
 await page.getByRole("button",{name:"Compléter la cartographie",exact:true}).click();
 await expect(page.getByLabel("Flux 1 · Choisir la destination",{exact:true})).toHaveValue(/^system:/);
 await expect(page.getByLabel("Flux 1 · Destination",{exact:true})).toHaveCount(0);
 await page.getByRole("button",{name:"Modifier le flux 2",exact:true}).click(); await expect(page.getByLabel("Flux 2 · Choisir la destination",{exact:true})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test("graphical sharing is opt-in, reviewed and bounded to selected flows",async({page})=>{
 await page.goto("/app/privacy/"); await page.getByRole("button",{name:"Explorer la démo",exact:true}).click();
 await page.getByRole("button",{name:"Partager un dossier",exact:true}).click();
 await page.getByRole("button",{name:"Charger la sélection d’exemple",exact:true}).click();
 await page.getByText("Ajouter une synthèse direction et des flux choisis",{exact:true}).click();
 const choices=page.getByRole("group",{name:"Flux à communiquer (60 maximum)",exact:true}); await expect(choices.getByRole("checkbox").first()).not.toBeChecked(); await choices.getByRole("checkbox").first().check();
 await page.getByRole("button",{name:"Prévisualiser le dossier",exact:true}).click(); await expect(page.getByRole("table",{name:"Contenu exact à partager"})).toContainText("Flux sélectionnés / 1");
 await expect(page.getByRole("table",{name:"Contenu exact à partager"})).not.toContainText("Flux sélectionnés / 2");
 await expect(page.getByRole("button",{name:"Confirmer et télécharger le dossier",exact:true})).toBeDisabled();
});
