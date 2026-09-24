import { assertShare, shareRows, PROFILE_LABELS, COVERAGE_LABELS, SHARE_LIMITATION, type SharedRegister, type Knowledge } from "@rgpdesk/privacy-core";

type Child = Node | string;
// This renderer accepts only the public, validated projection. Variable values
// always become text nodes. No HTML parser, HTML insertion or external URL.
function el(tag: string, attrs: Record<string, string> = {}, ...children: Child[]): HTMLElement {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  node.append(...children);
  return node;
}
const p = (value: string, cls = "") => el('p', {class: cls}, value);
const k = (value: Knowledge, missing = 'Non renseigné'): Child => value.state === 'documented' ? value.value : el('span', {class: 'unknown'}, missing);
const pair = (label: string, value: Child) => el('div', {}, el('dt', {}, label), el('dd', {}, value));
const role = (a: SharedRegister['activities'][number]) => a.role === 'controller' ? 'Responsable de traitement' : 'Sous-traitant';
const paths = {
  people: ['M3 21v-3a6 6 0 0 1 12 0v3M16 4a3 3 0 0 1 0 6m2 4a5 5 0 0 1 3 4v3'],
  data: ['M9 8h6M9 12h6M9 16h4'],
  recipients: ['M3 5h11v14H3zM17 8l4 4-4 4M10 12h11'],
  brand: ['M2 2h19l9 9v25H2zM21 2v10h9M8 19h15M8 25h10'],
};
function icon(kind: keyof typeof paths): SVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  for (const [name,value] of Object.entries({viewBox: kind === 'brand' ? '0 0 32 38' : '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width':'1.5', 'stroke-linecap':'round', 'stroke-linejoin':'round', 'aria-hidden':'true'})) svg.setAttribute(name,value);
  for(const d of paths[kind]){const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d',d);svg.append(path);}
  if(kind==='people'||kind==='data'){
    const shape=document.createElementNS(svg.namespaceURI,kind==='people'?'circle':'rect');
    const attrs:Record<string,string>=kind==='people'?{cx:'9',cy:'7',r:'3'}:{x:'5',y:'3',width:'14',height:'18',rx:'2'};
    for(const [name,value] of Object.entries(attrs))shape.setAttribute(name,value);svg.prepend(shape);
  }
  return svg;
}

export function reportBody(register: SharedRegister): HTMLBodyElement {
  assertShare(register);
  const body = el('body') as HTMLBodyElement;
  body.append(el('header', {class:'cover'}, el('div',{class:'brand'},icon('brand'),el('span',{class:'eyebrow'},'RGPDESK / Registre documentaire')),el('h1',{},register.organization.name),p(PROFILE_LABELS[register.profile],'subtitle'),el('div',{class:'cover-meta'},el('span',{},el('strong',{},'À l’attention de'),register.recipient),el('span',{},el('strong',{},'Date de préparation déclarée'),register.createdAt.slice(0,10)))));
  const main = el('main'); body.append(main);
  const activity = (id:string|null)=>id===null?'Ensemble du périmètre':register.activities.find(a=>a.id===id)!.title;
  if(register.executive){
    const steps=register.nextSteps??[];
    const brief=(s:string)=>Array.from(s).length>180?Array.from(s).slice(0,180).join('')+'…':s;
    main.append(el('section',{class:'summary','aria-label':'Synthèse direction'},p('L’essentiel pour la direction','eyebrow'),el('h2',{},'Comprendre. Arbitrer. Agir.'),p(`Synthèse rédigée et sélectionnée pour ${register.recipient}. Les réserves du dossier restent applicables.`,'quiet'),el('dl',{class:'facts'},pair('01 / Ce qui change',register.executive.changes),pair('02 / Arbitrages demandés',register.executive.arbitrations)),el('h3',{},'03 / Prochaines actions'),steps.length?el('ul',{class:'index'},...steps.slice(0,3).map(a=>el('li',{},el('div',{},el('h3',{},brief(a.task)),p(`${a.owner||'Responsable à affecter'} · ${a.due||'Échéance à fixer'}`))))):p('Aucune action sélectionnée pour cette restitution.'),...(steps.length>3?[p(`Les ${steps.length-3} autres actions choisies figurent dans les suites détaillées.`)]:[]),p('Les intitulés longs sont abrégés ici ; les suites détaillées en conservent le texte complet. Ce résumé ne constitue pas une validation juridique. Retrouvez ensuite le périmètre, les réserves, les flux choisis et les fiches.','quiet')));
  }
  main.append(el('section',{class:'summary','aria-labelledby':'summary-title'},el('div',{class:'summary-head'},el('div',{},p('01 / Vue d’ensemble','eyebrow'),el('h2',{id:'summary-title'},'Le périmètre, en un regard.')),el('span',{class:'count'},String(register.activities.length),el('small',{},'activités sélectionnées'))),el('div',{class:'scope'},el('strong',{},'Périmètre communiqué'),p(register.scope,'pre')),p(COVERAGE_LABELS[register.coverage],'coverage'),el('ol',{class:'index'},...register.activities.map((a,i)=>el('li',{},el('span',{class:'number'},String(i+1).padStart(2,'0')),el('div',{},el('a',{href:`#activity-${i+1}`},a.title),el('small',{},role(a)))))),el('aside',{class:'reservations'},el('h3',{},'Réserves à prendre en compte'),register.reservations.length?el('ol',{},...register.reservations.map(r=>el('li',{class:'pre'},r))):p('Aucune réserve ajoutée par le rédacteur. Cela ne vaut pas validation des informations.','quiet')),p('Ce dossier présente les activités choisies, puis leurs déclarations détaillées. Il ne constitue ni un avis juridique ni une évaluation de la conformité. Les absences d’information restent signalées.','quiet')));
  if(register.format==='rgpd-share-v2'){
    const positions=register.positions??[],steps=register.nextSteps??[],flows=register.flows??[];
    main.append(el('section',{class:'activity','aria-label':'Synthèse de restitution'},p('Pour décider et suivre','eyebrow'),el('h2',{},'Les positions et leurs suites.'),p('Sélection du rédacteur pour ce destinataire. Les appréciations sont humaines et déclarées. Cette synthèse ne mesure pas la conformité.','quiet'),el('h3',{},'Positions communiquées'),positions.length?el('ul',{class:'index'},...positions.map(x=>el('li',{},el('div',{},el('small',{},activity(x.activityId)),el('h3',{},x.position),p(x.reason,'pre'))))):p('Aucune position sélectionnée pour ce partage.'),el('h3',{},'Suites communiquées'),steps.length?el('ul',{class:'index'},...steps.map(a=>el('li',{},el('div',{},el('small',{},activity(a.activityId)),el('h3',{},a.task),el('p',{},`Suivi : ${a.owner||'À affecter'}`,el('br'),`Échéance déclarée : ${a.due||'À fixer'}`))))):p('Aucune suite sélectionnée pour ce partage.')));
    const carto=el('section',{class:'activity','aria-label':'Cartographie sélectionnée'},p('Les mouvements déclarés','eyebrow'),el('h2',{},'Suivre les données.'),p('Seuls les flux explicitement sélectionnés apparaissent ici. Leur absence ne démontre pas une absence de circulation.','quiet'));
    for(const [i,f] of flows.entries())carto.append(el('figure',{},el('figcaption',{},`Flux ${i+1} · ${activity(f.activityId)}`),el('div',{class:'relationship'},...([['Origine',f.source],['Opération →',f.operation],['Destination',f.destination]] as const).map(([label,value])=>el('div',{class:'node'},el('h3',{},label),el('p',{},k(value,'À documenter'))))),el('dl',{class:'facts'},...([['Données',f.data],['Canal',f.channel],['Pays et accès distants',f.location],['Habilitations',f.access]] as const).map(([label,value])=>pair(label,k(value,'À documenter'))))));
    if(!flows.length)carto.append(p('Aucun flux sélectionné pour ce partage.'));main.append(carto);
  }
  for(const [i,a] of register.activities.entries()){
    const sheet=el('article',{class:'activity',id:`activity-${i+1}`},el('header',{class:'activity-heading'},el('span',{class:'number'},String(i+1).padStart(2,'0')),el('div',{},p(`Fiche du registre / ${role(a)}`,'eyebrow'),el('h2',{},a.title),el('small',{},'Informations déclarées pour cette activité'))),el('h3',{},'Pourquoi ces données ?'));
    if(a.role==='controller'){
      for(const [j,purpose] of a.purposes.entries())sheet.append(el('section',{class:'purpose'},el('h3',{},`Finalité ${j+1}`),el('p',{class:'pre'},k(purpose.description)),el('dl',{class:'facts'},...(register.profile==='internal-review'?[pair('Fondement juridique déclaré',k(purpose.legalBasis))]:[]),pair('Conservation déclarée',k(purpose.retention.period)),pair('Événement de départ',k(purpose.retention.trigger)))));
      if(!a.purposes.length)sheet.append(p('Aucune finalité renseignée.','unknown'));
    } else {
      const names=el('span');for(const [j,id] of a.controllerIds.entries()){if(j)names.append(el('br'));names.append(register.parties.find(p=>p.id===id)!.name);}if(!a.controllerIds.length)names.append(el('span',{class:'unknown'},'Non renseigné'));
      sheet.append(el('dl',{class:'facts'},pair('Opérations confiées',k(a.operations)),pair('Clients responsables déclarés',names)));
    }
    sheet.append(el('figure',{},el('figcaption',{},'Les personnes, les données et leurs destinataires'),el('div',{class:'relationship'},...([['people','Personnes concernées',a.dataSubjects],['data','Données utilisées',a.dataCategories],['recipients','Destinataires déclarés',a.recipients]] as const).map(([type,label,value])=>el('div',{class:'node'},el('span',{class:'node-icon'},icon(type)),el('h3',{},label),el('p',{},k(value))))),p('Repères issus de la fiche. Ce schéma ne représente pas la séquence des opérations ni une cartographie des flux.','quiet')),el('dl',{class:'facts'},pair('Transferts et garanties',k(a.transfers)),pair('Mesures de sécurité déclarées',k(a.securityMeasures))));main.append(sheet);
  }
  main.append(el('section',{class:'appendix'},p('Pour approfondir','eyebrow'),el('h2',{},'Déclarations et références complètes.'),p('Cette annexe conserve toutes les valeurs du périmètre examiné, y compris les coordonnées de l’organisation et les références de livraison. Les identifiants sont propres à ce dossier partagé.','quiet'),el('table',{},el('caption',{},'Registre et réserves partagés'),el('thead',{},el('tr',{},el('th',{scope:'col'},'Rubrique'),el('th',{scope:'col'},'Déclaration'))),el('tbody',{},...shareRows(register).map(([label,value])=>el('tr',{},el('th',{scope:'row'},label),el('td',{},el('pre',{},value))))))));
  body.append(el('footer',{},p(SHARE_LIMITATION)));return body;
}
