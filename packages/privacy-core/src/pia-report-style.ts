// Local, self-contained styles. The HTML export pins these exact bytes in its CSP.
export const PIA_REPORT_CSS = `
body{margin:0;background:#e8eef2}
.pia-report{--ar-ink:#243b4d;--ar-muted:#50677a;--ar-line:#b7c7d1;color:var(--ar-ink);font:16px/1.65 system-ui,sans-serif;max-width:1120px;margin:0 auto;background:#f8fafb;text-align:left}
.pia-report *{box-sizing:border-box}
.pia-report h1,.pia-report h2,.pia-report h3,.pia-report h4,.pia-report p,.pia-report dl,.pia-report dd{margin:0}
.pia-report h1,.pia-report h2{font-family:Georgia,serif;font-weight:400;line-height:1.15;letter-spacing:-.035em}
.pia-report h1{font-size:clamp(36px,5vw,58px);margin:18px 0}
.pia-report h2{font-size:clamp(28px,3vw,38px);margin:10px 0 22px}
.pia-report h3{font-size:19px;line-height:1.4;letter-spacing:-.02em}
.pia-report h4{font-size:16px;line-height:1.5}
.pia-report p,.pia-report dd,.pia-report h1,.pia-report h2,.pia-report h3,.pia-report strong,.pia-report a{overflow-wrap:anywhere;min-width:0}
.pia-report dd,.pia-report .ar-scope p,.pia-report .ar-reserve p{white-space:pre-wrap}
.pia-report svg{width:26px;height:26px;flex-shrink:0}
.pia-report a{color:#2b4c65;text-underline-offset:4px}
.pia-report a:hover{color:#172d3e;background:#dce7ed}
.pia-report a:focus-visible{outline:3px solid #375e7b;outline-offset:4px}
.pia-report .ar-eyebrow{font:500 14px/1.6 ui-monospace,monospace;letter-spacing:.07em;text-transform:uppercase;color:var(--ar-muted)}
.pia-report .ar-quiet{color:var(--ar-muted);font-size:14px;line-height:1.7;margin-top:18px}
.pia-report .ar-cover{position:relative;padding:48px;border-radius:0 0 32px 0;color:#f4f8fb;background:repeating-linear-gradient(0deg,transparent 0 3px,#d6e4f403 3px 4px),radial-gradient(ellipse at 95% 0%,#506b7c 0%,transparent 62%),linear-gradient(135deg,#203446,#2b4657);border-bottom:5px solid #91a8b9}
.pia-report .ar-brand{display:flex;gap:16px;align-items:center;margin-bottom:42px}
.pia-report .ar-brand svg{width:40px;height:40px}
.pia-report .ar-cover .ar-eyebrow{color:#c5d6e1}
.pia-report .ar-subtitle{font-size:22px;line-height:1.5;max-width:760px;color:#e2edf4}
.pia-report .ar-cover-meta{display:grid;grid-template-columns:1fr 1fr;gap:20px 36px;border-top:1px solid #8198a9;margin-top:32px;padding-top:24px;font-size:14px}
.pia-report .ar-cover-meta>div:last-child{grid-column:1/-1}
.pia-report .ar-cover-meta dt{color:#c5d6e1;margin-bottom:5px}
.pia-report main{padding:40px 48px}
.pia-report .ar-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:26px 0 10px}
.pia-report .ar-stat{display:grid;grid-template-columns:auto 1fr;align-items:center;gap:8px 14px;padding:20px;border:1px solid var(--ar-line);border-radius:3px 20px 3px 3px;background:linear-gradient(135deg,#f9fbfc,#e1eaf0)}
.pia-report .ar-stat strong{font:400 clamp(24px,3vw,36px)/1.15 Georgia,serif}
.pia-report .ar-stat>span{grid-column:1/-1;font-size:14px}
.pia-report .ar-scope-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin:28px 0}
.pia-report .ar-scope,.pia-report .ar-reserve{padding:22px;border:1px solid var(--ar-line);border-left:3px solid #7892a6}
.pia-report .ar-reserve{background:repeating-linear-gradient(135deg,transparent 0 12px,#b3946920 12px 13px),#f3f0e9;border-left-color:#9b7a49}
.pia-report .ar-scope-grid h3{margin-bottom:12px}
.pia-report .ar-position{display:flex;gap:18px;padding:24px;background:#e1eaf0;border:1px solid #a7bdcc;border-radius:3px 20px 3px 3px}
.pia-report .ar-position strong{display:block;font:400 26px/1.3 Georgia,serif;margin:5px 0 12px}
.pia-report .ar-toc{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:32px 0 54px;padding-top:24px;border-top:1px solid var(--ar-line)}
.pia-report .ar-toc>a{display:flex;align-items:center;gap:16px;padding:18px;text-decoration:none;border:1px solid #c1cfd9;background:#edf2f5;border-radius:3px 12px 3px 3px}
.pia-report .ar-toc strong{display:block;font-size:16px;line-height:1.45;font-weight:600}
.pia-report .ar-toc-icon{display:grid;place-items:center;flex-shrink:0;width:44px;height:44px;border:1px solid #a3b7c6;background:#dce6ed;border-radius:3px 12px 3px 3px}
.pia-report .ar-chapter{margin-top:52px;scroll-margin-top:24px}
.pia-report .ar-section-head{display:flex;align-items:center;gap:22px;padding:24px 0;border-top:2px solid #698399;border-bottom:1px solid var(--ar-line);margin-bottom:24px}
.pia-report .ar-section-head h2{margin:5px 0 0}
.pia-report .ar-section-head>div{flex:1;min-width:0}
.pia-report .ar-section-number{font:italic 46px/1 Georgia,serif;color:#6c8699;flex-shrink:0}
.pia-report .ar-section-head .ar-icon{padding:12px;background:#e1eaf0;border-radius:50%;display:flex}
.pia-report .ar-facts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px 28px}
.pia-report .ar-facts:empty{display:none}
.pia-report .ar-fact{padding:14px 0;border-bottom:1px solid #d2dde4;min-width:0}
.pia-report .ar-fact dt{font-size:14px;font-weight:650;color:#4a6477;margin-bottom:6px;overflow-wrap:anywhere}
.pia-report .ar-fact dd{font-size:16px;line-height:1.65}
.pia-report .ar-missing dd{border-left:2px dotted #8da2b2;padding-left:12px;color:#526b7d}
.pia-report .ar-card-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}
.pia-report .ar-card{padding:24px;background:linear-gradient(125deg,#f7fafb,#eaf0f4);border:1px solid var(--ar-line);border-radius:3px 20px 3px 3px;min-width:0}
.pia-report .ar-card h3{padding-bottom:12px;border-bottom:1px solid var(--ar-line)}
.pia-report .ar-card .ar-facts{grid-template-columns:1fr;gap:0}
.pia-report .ar-card .ar-fact:last-child{border-bottom:0}
.pia-report .ar-context-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-bottom:24px}
.pia-report .ar-context-grid .ar-card{padding:18px;border-top:3px solid #68849a}
.pia-report .ar-context-grid dt{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}
.pia-report .ar-card-head{display:flex;gap:16px;align-items:flex-start;margin-bottom:14px}
.pia-report .ar-card-head>div{min-width:0}
.pia-report .ar-card-head h3{border:0;padding:0}
.pia-report .ar-risk{padding:28px;margin-top:24px;border:1px solid #a3b9c8;border-top:4px solid #547287;border-radius:3px 24px 3px 3px;background:radial-gradient(ellipse at top right,#e0e9ef,transparent 70%),#f6f9fa;scroll-margin-top:24px}
.pia-report .ar-risk .ar-card-head>svg{width:38px;height:38px;padding:5px;border:1px solid #9bb3c4;border-radius:50%;background:#e2ebf1}
.pia-report .ar-risk h3{font:400 27px/1.25 Georgia,serif;margin-top:7px}
.pia-report .ar-levels{margin-top:22px;border-top:1px solid var(--ar-line);padding-top:20px}
.pia-report .ar-comparison{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:12px}
.pia-report .ar-stage{padding:20px;border:1px solid var(--ar-line);background:#e4edf3;border-radius:3px 14px 3px 3px}
.pia-report .ar-stage:last-child{background:#f3f6f8;border-style:dashed}
.pia-report .ar-scale{margin-top:16px}
.pia-report .ar-scale dt{font-size:14px;color:var(--ar-muted)}
.pia-report .ar-scale strong{font-size:16px;font-weight:550;display:block;margin:3px 0 10px}
.pia-report .ar-ticks{display:flex;gap:6px}
.pia-report .ar-tick{flex:1;height:7px;background:#d5e0e8;border:1px solid #8da5b6;border-radius:2px}
.pia-report .ar-filled{background:#52748c;border-color:#52748c}
.pia-report .ar-related{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:16px;padding-top:12px;font-size:14px}
.pia-report .ar-related strong{font-size:14px;font-weight:600;margin-right:8px}
.pia-report .ar-chip{display:inline-block;font:500 14px/1.5 system-ui,sans-serif;padding:7px 12px;border:1px solid #94adbf;border-radius:3px 10px 3px 3px;background:#eef4f7}
.pia-report .ar-decision>.ar-facts{padding:24px;background:#e3ecf2;border-left:4px solid #547287}
.pia-report footer{border-top:1px solid var(--ar-line);margin:0 48px;padding:24px 0 36px;font-size:14px;color:var(--ar-muted)}
@media(max-width:700px){.pia-report .ar-cover{padding:30px 22px}.pia-report main{padding:28px 22px}.pia-report .ar-brand{margin-bottom:28px}.pia-report .ar-scope-grid,.pia-report .ar-card-grid,.pia-report .ar-context-grid,.pia-report .ar-toc{grid-template-columns:1fr}.pia-report .ar-stats{gap:8px}.pia-report .ar-stat{padding:14px;grid-template-columns:1fr}.pia-report .ar-stat>span{grid-column:auto}.pia-report .ar-section-head{gap:14px}.pia-report .ar-section-number{font-size:36px}.pia-report .ar-section-head .ar-icon{display:none}.pia-report .ar-risk{padding:20px}.pia-report .ar-facts{gap:10px 16px}.pia-report footer{margin:0 22px}}
@media(max-width:420px){.pia-report .ar-cover-meta,.pia-report .ar-comparison,.pia-report .ar-facts{grid-template-columns:1fr}.pia-report .ar-cover-meta>div:last-child{grid-column:auto}.pia-report .ar-stat{padding:12px 9px}.pia-report .ar-stat strong{font-size:24px}.pia-report .ar-position{padding:18px}.pia-report .ar-risk{padding:16px}.pia-report .ar-stage{padding:16px}}
@page{margin:12mm;@bottom-right{content:counter(page);font:10pt system-ui,sans-serif;color:#50677a}}
@media print{body{background:white}.pia-report{font-size:11pt;max-width:none;background:white;color:#1e3445;print-color-adjust:exact}.pia-report .ar-cover{padding:8mm;border-radius:0;color:#1e3445;background:#e3ecf2}.pia-report .ar-cover .ar-eyebrow,.pia-report .ar-cover-meta dt,.pia-report .ar-subtitle{color:#365368}.pia-report .ar-cover-meta{border-color:#94aabb}.pia-report main{padding:5mm 0}.pia-report .ar-cover{padding:6mm}.pia-report .ar-brand{margin-bottom:5mm}.pia-report .ar-cover h1{margin:3mm 0}.pia-report .ar-cover-meta{margin-top:5mm;padding-top:3mm;gap:3mm}.pia-report .ar-intro h2{margin:2mm 0 4mm}.pia-report .ar-stats{margin:4mm 0 2mm}.pia-report .ar-stat{padding:3mm}.pia-report .ar-scope-grid{gap:4mm;margin:4mm 0}.pia-report .ar-scope,.pia-report .ar-reserve{padding:3mm}.pia-report .ar-position{padding:3mm}.pia-report .ar-position strong{font-size:16pt;margin:1mm 0 2mm}.pia-report .ar-quiet{margin-top:3mm}.pia-report .ar-fact{padding:2mm 0}.pia-report .ar-section-head{padding:4mm 0;margin-bottom:4mm}.pia-report .ar-levels{padding-top:3mm;margin-top:3mm}.pia-report .ar-stage{padding:3mm}.pia-report .ar-scale{margin-top:2mm}.pia-report .ar-related{margin-top:3mm;padding-top:2mm}.pia-report h1{font-size:30pt}.pia-report h2{font-size:21pt}.pia-report h3,.pia-report .ar-risk h3{font-size:16pt}.pia-report .ar-toc{display:none}.pia-report .ar-chapter{break-before:page;margin-top:0}.pia-report h2,.pia-report h3,.pia-report h4,.pia-report dt,.pia-report .ar-section-head{break-after:avoid}.pia-report .ar-fact,.pia-report .ar-stage,.pia-report .ar-levels{break-inside:avoid}.pia-report .ar-card-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:3mm}.pia-report .ar-context-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:3mm}.pia-report .ar-card{padding:4mm;break-inside:avoid}.pia-report .ar-risk{break-inside:avoid}.pia-report .ar-risk{padding:5mm}.pia-report .ar-fact dd{font-size:11pt;line-height:1.4}.pia-report .ar-facts{gap:2mm 5mm}.pia-report .ar-fact dt{margin-bottom:1mm}.pia-report .ar-scale strong{margin:1mm 0}.pia-report .ar-tick{height:5px}.pia-report .ar-measures .ar-card-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.pia-report .ar-eyebrow,.pia-report .ar-quiet,.pia-report .ar-fact dt,.pia-report .ar-chip,.pia-report .ar-stat>span{font-size:10.5pt}.pia-report footer{margin:0;padding:6mm 0}.pia-report a{color:inherit;text-decoration:none}}
`;
