import {test,expect} from "@playwright/test";
test("register progress leads to the missing facts without adding another input",async({page})=>{
 await page.goto('/app/privacy/#demo/registre');const overview=page.getByRole('region',{name:'Avancement documentaire',exact:true});await expect(overview).toBeVisible();await expect(overview.locator('.dp-total')).toHaveCount(3);
 for(const width of [1280,768,390,320]){await page.setViewportSize({width,height:950});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);const point=page.locator('.progress-record .dp-point').first();const cell=await point.boundingBox();const label=await point.locator('strong').boundingBox();expect(label!.x+label!.width).toBeLessThanOrEqual(cell!.x+cell!.width+1);expect(cell!.width).toBeGreaterThan(65);}
 await page.setViewportSize({width:1280,height:950});
 await page.getByRole('button',{name:'Lire Recrutement · exemple fictif',exact:true}).click();const reader=page.getByRole('article',{name:'Lecture de l’activité'});await expect(reader.locator('.dp-point')).toHaveCount(6);await reader.getByRole('button',{name:'Conservation',exact:true}).click();await expect(page.getByRole('button',{name:'Enregistrer la fiche',exact:true})).toBeVisible();
});
test("passive report exposes readable states and numeric anchors on narrow screens and in print",async({browser,baseURL})=>{
 const context=await browser.newContext({javaScriptEnabled:false,baseURL});const page=await context.newPage();try{
 await page.goto('/app/privacy/demo/registre/');const report=page.getByRole('region',{name:'Avancement documentaire',exact:true});await expect(report.locator('.dp-row')).toHaveCount(3);await expect(report.locator('.dp-point')).toHaveCount(18);await expect(report.getByText('Aucun score de conformité.',{exact:false})).toBeVisible();
 for(const width of[1440,390,320]){await page.setViewportSize({width,height:950});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(await report.locator('.dp-point small').first().evaluate(el=>parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(14);}
 await page.setViewportSize({width:1100,height:950});await page.emulateMedia({media:'print'});await expect(report.locator('.dp-total')).toHaveCount(3);await report.locator('.dp-row-title').first().click();await expect(page).toHaveURL(/#activity-1$/);
 }finally{await context.close();}
});
