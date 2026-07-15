/* ============================================================
   TTL demo — "Cherries" driven live by the AI data checker.
   No demo chrome: the app is the demo. All narration is spoken.
   Presenter keys: Space pause/replay-beat · ←/→ beats · R restart
   ?freeze=N (1..7) jumps to the end-state of beat N.
   ============================================================ */
(() => {
"use strict";

const $  = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

const fitEl = $("#fit"), app = $("#app"), cursor = $("#cursor"), pip = $("#pip");

/* ---------------- fit-to-viewport ---------------- */
let scale = 1;
function fit(){
  scale = Math.min(innerWidth/1600, innerHeight/900);
  fitEl.style.transform = `translate(-50%,-50%) scale(${scale})`;
}
addEventListener("resize", fit); fit();

/* ---------------- data ---------------- */
const FIELDS = ["Building","Floor","Room","Position","Component","Accessibility","Lab",
  "Next Inspection","Material Risk","Quantity","Survey Type","Action","Product Type",
  "Asbestos Type","Surface Treatment","Condition","Recommendations","Comments"];
const DD = new Set(["Building","Floor","Room","Position","Accessibility","Lab","Next Inspection",
  "Survey Type","Action","Product Type","Asbestos Type","Surface Treatment","Condition"]);

const S005_START = {Building:"Main",Floor:"Ground",Room:"Living Room",Position:"Ceiling",
  Component:"Textured Coating To Ceiling",Accessibility:"Easily Accessible",Lab:"The Testing Lab PLC",
  "Next Inspection":"","Material Risk":"",Quantity:"20 Sqr Mtrs","Survey Type":"Refurbishment",
  Action:"Awaiting Result","Product Type":"Textured Coating","Asbestos Type":"Sample S005 - awaiting cert",
  "Surface Treatment":"",Condition:"",Recommendations:"",Comments:"Textured coating to plasterbord ceiling."};
const S005_END = {...S005_START,Accessibility:"N/A","Next Inspection":"No Further Action Required",
  "Material Risk":"0 (VL)",Action:"No Further Action Required","Product Type":"N/A","Asbestos Type":"NADIS",
  "Surface Treatment":"N/A",Condition:"N/A",Recommendations:"No further action required",
  Comments:"Textured coating to plasterboard ceiling."};

const S013_START = {Building:"Main",Floor:"First",Room:"Bathroom",Position:"Ceiling",
  Component:"Textured Coating To Ceiling",Accessibility:"N/A",Lab:"The Testing Lab PLC",
  "Next Inspection":"No Further Action Required","Material Risk":"0 (VL)",Quantity:"6 Sqr Mtrs",
  "Survey Type":"Refurbishment",Action:"No Further Action Required","Product Type":"N/A",
  "Asbestos Type":"Chrysotile","Surface Treatment":"N/A",Condition:"N/A",
  Recommendations:"No further action required",Comments:"Textured coating to plasterboard ceiling."};
const S013_END = {...S013_START,"Asbestos Type":"NADIS"};

const S018 = {Building:"Main",Floor:"External",Room:"Front Extension",Position:"Roof",
  Component:"Roofing Felt",Accessibility:"N/A",Lab:"The Testing Lab PLC",
  "Next Inspection":"No Further Action Required","Material Risk":"0 (VL)",Quantity:"3 Sqr Mtrs",
  "Survey Type":"Refurbishment",Action:"No Further Action Required","Product Type":"N/A",
  "Asbestos Type":"NADIS","Surface Treatment":"N/A",Condition:"N/A",
  Recommendations:"No further action required",Comments:"Roofing felt on front extension roof, extension is hallway and stairs."};

function gen(ref, room, pos, comp, qty, asb){
  return {Building:"Main",Floor:"Ground",Room:room,Position:pos,Component:comp,
    Accessibility:"N/A",Lab:"The Testing Lab PLC","Next Inspection": asb==="Chrysotile"?"12 Months":"No Further Action Required",
    "Material Risk": asb==="Chrysotile"?"4 (L)":"0 (VL)",Quantity:qty,"Survey Type":"Refurbishment",
    Action: asb==="Chrysotile"?"Remove":"No Further Action Required",
    "Product Type": asb==="Chrysotile"?"Thermo Plastic Floor Tiles":"N/A","Asbestos Type":asb,
    "Surface Treatment": asb==="Chrysotile"?"Composite Material":"N/A",Condition: asb==="Chrysotile"?"Good Condition":"N/A",
    Recommendations: asb==="Chrysotile"?"Remove prior to refurbishment works":"No further action required",
    Comments:`${comp} — ${room.toLowerCase()}.`};
}

/* Non-suspect record verbatim from the issued report (Lab = In-House Database, lowercase NFA) */
function nsm(floor, room, pos, comp, comments){
  return {Building:"Main",Floor:floor,Room:room,Position:pos,Component:comp,Accessibility:"N/A",
    Lab:"In-House Database","Next Inspection":"No further action required","Material Risk":"0 (VL)",
    Quantity:"N/A","Survey Type":"Refurbishment",Action:"No further action required","Product Type":"N/A",
    "Asbestos Type":"Non suspect material","Surface Treatment":"N/A",Condition:"N/A",
    Recommendations:"No further action required",Comments:comments};
}
const RECORDS = {
  S001: gen("S001","Hallway","Ceiling","Textured Coating To Ceiling","4 Sqr Mtrs","NADIS"),
  S002: nsm("Ground","Hallway","Walls & Floor","Walls & Floor","Plaster to brickwork walls, screed floor underneath modern lino."),
  S003: gen("S003","Kitchen / Diner","Floor","Floor Tiles & Bitumen","8 Sqr Mtrs","Chrysotile"),
  S004: nsm("Ground","Kitchen / Diner","Ceiling, Walls & Floor","Ceiling, Walls & Floor","Plaster to plasterboard ceiling, plaster to brickwork walls, screed floor underneath modern lino."),
  S005: S005_START,
  S006: nsm("Ground","Living Room","Walls & Floor","Walls & Floor","Paper to plaster to brickwork walls, screed floor underneath carpet."),
  S009: gen("S009","Kitchen / Diner","Flue","Cement Flue","1.5 Lin Mtrs","Chrysotile"),
  S010: gen("S010","Landing","Ceiling","Textured Coating To Ceiling","5 Sqr Mtrs","NADIS"),
  S012: nsm("First","Bathroom","Walls Internal","Tile Adhesive","Ceramic tile and adhesive to plaster, brickwork walls."),
  S013: S013_START,
  S014: nsm("First","Bathroom","Walls & Floor","Walls & Floor","Plaster to brickwork walls, timber floor underneath modern lino."),
  S015: nsm("First","Bathroom","Bath Panel","Behind Bath Panel","Timber floor, copper pipes, plastic water pipes, electrical wires found behind timber cladding bath panel."),
  S016: nsm("First","Bathroom","Boxing","Behind Boxing","Copper pipes found behind timber boxing."),
  S017: nsm("First","Loft","Ceiling, Walls & Floor","Ceiling, Walls & Floor","Timber and modern felt ceiling, blockwork, brickwork walls, plasterboard floor underneath mmmf insulation, plastic flue pipe, tenants belongings."),
  S018: S018,
};
const ASM_ORDER = Object.keys(RECORDS);
/* every record has its real photo. ts=null → the photo carries its own baked-in
   timestamp (crops from the issued report pages) — no overlay drawn. */
const PHOTOS = {
  S001:["assets/photo_s001.png","28-11-2025, 09:42:11"],
  S002:["assets/photo_s002.png","28-11-2025, 09:45:36"],
  S003:["assets/photo_s003.png","28-11-2025, 09:51:48"],
  S004:["assets/photo_s004.png",null],
  S005:["assets/photo_s005.png","28-11-2025, 09:57:07"],
  S006:["assets/photo_s006.png",null],
  S009:["assets/photo_s009.png","28-11-2025, 10:01:22"],
  S010:["assets/photo_s010.png","28-11-2025, 10:03:17"],
  S012:["assets/photo_s012.png","28-11-2025, 10:04:05"],
  S013:["assets/photo_s013.png","28-11-2025, 10:05:12"],
  S014:["assets/photo_s014.png",null],
  S015:["assets/photo_s015.png",null],
  S016:["assets/photo_s016.png",null],
  S017:["assets/photo_s017.png",null],
  S018:["assets/photo_s018.png","28-11-2025, 10:26:39"],
};
/* photos stored the wrong way round (MQP121 s3.3.1 — checker rotates, original kept as # copy) */
const PHOTO_FIXED = {};   // ref -> true once the agent has rotated it

/* ============================================================
   RULES ENGINE — the checks are computed live from the record,
   the lab certificate and the MQP121 rule set. Nothing below is
   a hardcoded outcome: change a record or a cert result and the
   demo's edits, queries and routing change with them.
   ============================================================ */
const CERT = { S001:"NADIS", S003:"Chrysotile", S005:"NADIS", S009:"Chrysotile",
               S010:"NADIS", S013:"NADIS", S018:"NADIS" };           // lab certificate results (sampled items only)
const SPELLFIX = [["plasterbord","plasterboard"],["cieling","ceiling"],["asbestoes","asbestos"],["kitchin","kitchen"],
  ["Assisi Environmental","The Testing Lab Ltd"]];   // MQP121 appendix: legacy name on older tasked jobs
const JUDGEMENT = new Set(["S018"]);   // presumption calls the assistant must not make alone

/* NADIS cascade per MQP121 s3.4.3 */
const NADIS_CASCADE = [["Asbestos Type","NADIS"],["Product Type","N/A"],["Surface Treatment","N/A"],
  ["Condition","N/A"],["Accessibility","N/A"],["Action","No Further Action Required"],
  ["Recommendations","No further action required"],["Next Inspection","No Further Action Required"],
  ["Material Risk","0 (VL)"]];

function planFor(ref){
  const r = RECORDS[ref], cert = CERT[ref];
  const plan = { ref, edits:[], typo:null, query:null, route:null };
  if(cert === "NADIS"){
    if(/awaiting/i.test(r["Asbestos Type"] || "")){
      NADIS_CASCADE.forEach(([f,v]) => { if(r[f] !== v) plan.edits.push([f,v]); });         // s3.4.3
    } else if(!["NADIS","Non suspect material"].includes(r["Asbestos Type"])){
      plan.query = `Cert for ${ref} returned NADIS; record states ${r["Asbestos Type"]}. ` +  // s5.2
        `Please confirm asbestos type. If cert correct, type reverts to NADIS; if type correct, action and next inspection must change.`;
    }
  }
  for(const [w,c] of SPELLFIX){                                                             // s3.1.2 spelling
    if((r.Comments||"").includes(w)){ plan.typo=[w,c]; plan.edits.push(["Comments", r.Comments.replace(w,c)]); }
  }
  if(JUDGEMENT.has(ref)) plan.route = "L. Simpson";                                          // HITL routing
  return plan;
}
const pv = (plan, f) => (plan.edits.find(e=>e[0]===f) || [,""])[1];
function setIf(plan, f){ const v = pv(plan, f); if(v) setVal(f, v); }

const S012_QUERY = "Photo attached to S012 does not correspond to the recorded component (tile adhesive to bathroom wall); it appears to be from a different location. Please confirm the component and re-attach the correct photo.";
function dEmail(q){ return `On 02/12/2025 08:14, cherries@thetestinglab.eu wrote:
> Darren Surveyor,
> Please respond to EVERY query within the [] below that query. Do not change the subject or remove text from the email.
>
> InternalRef:[0000412]
> Assessment #S012 Bathroom/Walls Internal/Tile Adhesive
> Q: ${q}
> R: []
>
> Kind Regards,
> Paul Rigby
> The Testing Lab PLC`; }
function drEmail(q){ return `On 02/12/2025 09:02, darren.reynolds@thetestinglab.eu wrote:
> InternalRef:[0000412]
> Assessment #S012 Bathroom/Walls Internal/Tile Adhesive
> Q: ${q}
> R: [Component correct - tile adhesive to bathroom wall. Correct photo re-attached, apologies.]
>
> Neil Barratt`; }

/* grid rows: [ref, client, scheme, address, cd,d,p,c,s, site, post, area, type, surveyor, pm, dchk, uchk, date, status, value, colour] */
const GRID = [
["J316185","Kestrel Living","Void Refurbishment","2 Oakwell Court,,Barnsley","1","0","1","1","1","Kestrel Living","S70 2TA","Barnsley","Refurbishment Asbe","Craig Sutton","Julie Harker","Not Selected","Not Selected","02/12/2025 08:00","Survey Report Received","£78.00","pink"],
["J316201","Meridian Housing","Planned Repairs","14 Millgate Road,,Rotherham","1","0","1","1","1","Meridian Housing","S60 1BY","Rotherham","Refurbishment Asbe","Ian Metcalfe","Sonia Bexley","Not Selected","Not Selected","02/12/2025 08:00","Survey Report Received","£77.50","pink"],
["J316332","Ongo Homes","Void Refurbishments 25/26","45 Jeffrey Lane,,Brumby","1","0","1","1","1","Ongo Homes","DN16 2AL","Scunthorpe","Refurbishment Asbe","Neil Barratt","Julie Harker","Not Selected","Not Selected","28/11/2025 16:32","Survey Report Received","£78.00","pink",'rowJob'],
["J316204","Beacon Homes","Voids","3 Sandhill Gardens,,Sheffield","1","0","1","1","1","Beacon Homes","S2 4HH","Sheffield","Refurbishment Asbe","Owen Pryce","Julie Harker","Not Selected","Not Selected","02/12/2025 07:45","Survey Report Received","£76.50","pink"],
["J316118","Riverside Homes","Victory Refurbishment","7 Mill Hill Road,,Doncaster","1","0","1","1","1","Riverside Homes","DN4 8QT","Doncaster","Refurbishment Asbe","Dean Halliwell","Julie Harker","Not Selected","Not Selected","01/12/2025 16:00","Survey Report Received","£81.00","pink"],
["J316102","Northgate Voids","Voids Management","55 Linton Road,,Wakefield","1","0","1","1","1","Northgate Voids","WF1 4HH","Wakefield","Management Asbest","Ross Fenwick","Mark Ridley","Not Selected","Not Selected","01/12/2025 15:30","Management Asbest","£95.03","pink"],
["J316095","Selby Homes Trust","Responsives","10 Barnburgh Lane,,Doncaster","1","0","1","1","1","Selby Homes Trust","DN5 8QP","Doncaster","Refurbishment Asbe","Carl Dawson","Mark Ridley","Not Selected","Not Selected","01/12/2025 15:00","Survey Report Received","£103.70","pink"],
["J316054","Rowanvale Council","SHDF Externals","4 Hawthorn Avenue,,Rotherham","1","0","1","1","1","Rowanvale Council","S66 8BT","Rotherham","Refurbishment Asbe","Wayne Ellison","Julie Harker","Not Selected","Not Selected","01/12/2025 14:00","Survey Report Received","£105.00","pink"],
["J316010","Meridian Housing","Planned Ceilings","Rooms 1 to 7, 9 Wortley Road","1","1","1","1","1","Meridian Housing","S71 1AA","Barnsley","Refurbishment Asbe","Ian Metcalfe","Sonia Bexley","Not Selected","Not Selected","01/12/2025 11:00","Data Pre Checked","£77.50","orange"],
["J315998","Pennine Works","SM Voids","157 Kimberworth Road,,Rotherham","1","1","1","1","1","Pennine Works","S61 1HE","Rotherham","Management Asbest","Gary Prentice","Mark Ridley","Not Selected","Not Selected","01/12/2025 10:30","Data Pre Checked","£86.00","orange"],
["J315977","Northgate Housing","Occupied","13 Hill Top View,,Normanton","1","1","1","1","1","Northgate Housing","WF6 1LZ","Normanton","Refurbishment Asbe","Ross Fenwick","Mark Ridley","Not Selected","Not Selected","01/12/2025 09:30","Data Pre Checked","£100.47","orange"],
["J315924","Kestrel Living","Newtile Voids","4 Reeve Lodge,,Barnsley","1","1","1","1","1","Kestrel Living","S75 3AN","Barnsley","Refurbishment Asbe","Adam Naylor","Julie Harker","Not Selected","Not Selected","01/12/2025 08:30","Data Pre Checked","£81.00","orange"],
["J315880","Campus Living","Survey","12 Fitzalan Road,,Sheffield","1","1","1","1","1","Campus Living","S7 1RJ","Sheffield","Management Asbest","Lee Bramall","Sonia Bexley","Not Selected","Not Selected","01/12/2025 08:15","Data Pre Checked","£95.00","orange"],
["J315832","Rowanvale Council","SHDF Externals","2 Hollytree Avenue,,Rotherham","1","1","1","1","1","Rowanvale Council","S66 8DY","Rotherham","Refurbishment Asbe","Scott Ferris","Julie Harker","Not Selected","Not Selected","01/12/2025 08:05","Data Pre Checked","£105.00","orange"],
["J315790","Harbour Care","Scheme","Spring House,39 Billing Road","1","1","1","1","1","Harbour Care","S1 2BA","Sheffield","Management Asbest","Craig Sutton","Mark Ridley","Not Selected","Not Selected","01/12/2025 07:50","Data Pre Checked","£300.00","orange"],
];

/* ---------------- DOM builders ---------------- */
function buildGrid(){
  $("#gridBody").innerHTML = GRID.map(r=>{
    const [ref,client,scheme,addr,cd,d,p,c,s,site,post,area,type,surv,pm,dchk,uchk,date,status,val,colour,id] = r;
    const cb=v=>`<td class="c-chk"><span class="cb${v==="1"?" on":""}"></span></td>`;
    return `<tr class="r-${colour}" data-ref="${ref}" data-colour="${colour}"${id?` id="${id}"`:""}><td>${ref}</td><td class="c-ico">📁</td><td class="c-ico">📄</td><td class="c-ico"></td>
      <td>${client}</td><td>${scheme}</td><td>${addr}</td>${cb(cd)}${cb(d)}${cb(p)}${cb(c)}${cb(s)}
      <td>${site}</td><td>${post}</td><td>${area}</td><td>${type}</td><td>${surv}</td><td>${pm}</td>
      <td>${dchk}</td><td>${uchk}</td><td>${date}</td><td class="c-status">${status}</td><td class="num">${val}</td></tr>`;
  }).join("");
}
function buildAsmList(){
  $("#asmRows").innerHTML = ASM_ORDER.map(ref=>
    `<div class="asm-row" id="asm_${ref}"><span class="n">${ref}</span><span class="c">${RECORDS[ref].Component}</span><span class="tick">✓</span></div>`).join("");
}

/* ---------------- which job the run targets ---------------- */
const HERO = "J316332";
const GRIDBYREF = {}; GRID.forEach(r=>GRIDBYREF[r[0]]=r);
let RUNJOB = HERO;                          // the job "Run AI Agent" will work on
const HERO_HEADER = {                       // matches the static HTML for J316332
  status:"Survey Report Received",
  client:"Ongo Homes", clientAddr:"Ongo House, High Street,<br>Scunthorpe, DN15 6NL",
  contact:"Repairs Team", tel:"01724 279900", email:"asbestos@ongo.co.uk",
  site:"Ongo Homes", siteAddr:"(4231) 45 Jeffrey Lane,<br>Brumby,<br>Scunthorpe, DN16 2AL",
  custRef:"2519917", surv1:"Neil Barratt", pm:"Julie Harker",
  title:"Refurbishment Asbestos Survey J316332&nbsp; - &nbsp;Ongo Homes (I)",
};
function headerFor(ref){
  if(ref===HERO) return {...HERO_HEADER};
  const r=GRIDBYREF[ref]; if(!r) return null;
  const client=r[1], addr=r[3], area=r[11], post=r[10], type=r[12], surv=r[13], pm=r[14], status=r[18];
  const street = addr.split(",")[0].trim();
  const lines = `${street}<br>${area}<br>${post}`;
  const cleanType = type.startsWith("Management") ? "Management" : type.startsWith("Pre") ? "Pre-Demolition" : "Refurbishment";
  return { status, client, clientAddr:lines, contact:"", tel:"", email:"",
    site:client, siteAddr:lines, custRef:"", surv1:surv, pm,
    title:`${cleanType} Asbestos Survey ${ref}&nbsp; - &nbsp;${client} (I)` };
}
function applyJobHeader(ref){
  const h=headerFor(ref); if(!h) return;
  $("#jobTitle").innerHTML = `${h.title}&nbsp; - &nbsp;Status Is '${h.status}'&nbsp; Job last uploaded at 07:58:41 on 28/11/2025`;
  $("#hClient").innerHTML=h.client; $("#hClientAddr").innerHTML=h.clientAddr;
  $("#hContact").textContent=h.contact; $("#hTel").textContent=h.tel; $("#hEmail").textContent=h.email;
  $("#hSite").innerHTML=h.site; $("#hSiteAddr").innerHTML=h.siteAddr; $("#hCustRef").textContent=h.custRef;
  setDDText($("#hSurv1"), h.surv1); setDDText($("#hPM"), h.pm);
}
function buildFields(){
  $("#afFields").innerHTML = FIELDS.map(f=>{
    const id = "f_"+f.replace(/[^A-Za-z]/g,"");
    const full = (f==="Comments"||f==="Recommendations") ? " full" : "";
    const dd = DD.has(f) ? " dd" : "";
    const arrow = DD.has(f) ? `<span class="dd-a">▼</span>` : "";
    return `<div class="af${full}"><label>${f}</label><div class="av${dd}" id="${id}"><span class="vtext"></span>${arrow}</div></div>`;
  }).join("");
}
const fEl = f => $("#f_"+f.replace(/[^A-Za-z]/g,""));

function loadRecord(ref){
  const rec = RECORDS[ref];
  FIELDS.forEach(f=>{ const el=fEl(f); el.querySelector(".vtext").textContent = rec[f] ?? ""; el.classList.remove("hot","ok","bad"); });
  const ph = PHOTOS[ref];
  const img=$("#phImg"), ts=$("#phTs");
  if(ph){ img.src=ph[0]; img.style.visibility="visible"; ts.textContent=ph[1]||"";
          img.classList.toggle("unrot", !!PHOTO_FIXED[ref]); }
  else{ img.style.visibility="hidden"; ts.textContent=""; img.classList.remove("unrot"); }
  $("#mraScore").textContent = rec["Material Risk"] || "–";
  $("#mraScore").className = /H\)/.test(rec["Material Risk"]||"") ? "hi":"vl";
  $("#priScore").textContent = rec["Material Risk"] ? (rec["Material Risk"].startsWith("0")?"0":"4") : "–";
  $$("#asmRows .asm-row").forEach(r=>r.classList.remove("sel"));
  const row=$("#asm_"+ref); if(row) row.classList.add("sel");
}
function setVal(f, v, hot=true){
  const el=fEl(f); el.querySelector(".vtext").textContent=v;
  if(hot){ el.classList.add("hot"); setTimeout(()=>el.classList.remove("hot"), 1400); }
}
function tickRow(ref, flag=false){ const r=$("#asm_"+ref); r.classList.add(flag?"flag":"done"); if(flag) r.querySelector(".tick").textContent="!"; }
function showConfirm(msg){ $("#cfMsg").innerHTML=msg; show($("#dlgConfirm")); }
function flashOk(f){ const el=fEl(f); el.classList.add("ok"); setTimeout(()=>el.classList.remove("ok"), 1400); }

/* ---- document text checks (scope / site info) ---- */
const DOC_SCAN = ["#scopeLast","#methodLast","#siteP1"];
const ORIG_DOCS = {};
function snapshotDocs(){ DOC_SCAN.forEach(s=>{ if(!(s in ORIG_DOCS)) ORIG_DOCS[s]=$(s).textContent; }); }
function restoreDocs(){ DOC_SCAN.forEach(s=>{ if(ORIG_DOCS[s]!=null) $(s).textContent=ORIG_DOCS[s]; }); }
function docPlan(){
  const out=[];
  DOC_SCAN.forEach(s=>{ const t=$(s).textContent;
    SPELLFIX.forEach(([w,c])=>{ if(t.includes(w)) out.push({sel:s, wrong:w, right:c}); }); });
  return out;
}
function applyDocFix(f){ const el=$(f.sel); el.textContent = el.textContent.replace(f.wrong, f.right); }
function animateWordFix(my, f){
  const el=$(f.sel), txt=el.textContent;
  el.innerHTML = txt.replace(f.wrong, `<span class="selword pending">${f.wrong}</span>`);
  const w=el.querySelector(".selword");
  if(w){ const b=rectOf(w); cursorTo(b.x, b.y, 650); }   // cursor onto the misspelt word
  after(my, 700, ()=>{ clickFx(); if(w) w.classList.remove("pending"); });   // select it
  after(my, 1050, ()=>{
    const [before, after_] = txt.split(f.wrong);
    el.innerHTML = `${before}<span class="typed"></span><span class="caret"></span>${after_}`;
    const typed=el.querySelector(".typed"), caret=el.querySelector(".caret");
    let i=0;
    (function step(){ if(my!==genN) return;
      if(i<f.right.length){ typed.textContent+=f.right[i++]; timers.push(setTimeout(step, 55+Math.random()*40)); }
      else caret.remove(); })();
  });
}
/* ---- grid sort (double-click the Date column header, per the banner text) ---- */
function sortGridByDate(){
  const body=$("#gridBody");
  const key=tr=>{ const [d,t]=tr.querySelector("td:nth-child(21)").textContent.split(" ");
    const [dd,mm,yy]=d.split("/"); return `${yy}${mm}${dd}${t||""}`; };
  [...body.children].sort((a,b)=>key(a)<key(b)?-1:1).forEach(tr=>body.appendChild(tr));
}

/* ---------------- window / tab / status helpers ---------------- */
function show(el){ el.classList.remove("hidden"); }
function hide(el){ el.classList.add("hidden"); }
function switchTab(tabId){
  $$(".jtabrow .jt").forEach(t=>t.classList.remove("on"));
  $("#"+tabId).classList.add("on");
  hide($("#subrowAsb")); hide($("#subrowText"));
  $$(".jpanel").forEach(p=>hide(p));
  if(tabId==="tabAsbestos"){ show($("#subrowAsb")); show($("#panAssessments")); }
  if(tabId==="tabText"){ show($("#subrowText")); show($("#panScope")); }
  if(tabId==="tabDrawing"){ show($("#panDrawing")); }
  if(tabId==="tabMessages"){ show($("#panMessages")); }
}
function switchSub(subId){
  $$("#subrowAsb .jst").forEach(t=>t.classList.remove("on"));
  $("#"+subId).classList.add("on");
  $$(".jpanel").forEach(p=>hide(p));
  if(subId==="stAssessments") show($("#panAssessments"));
  if(subId==="stSiteInfo") show($("#panSiteInfo"));
}
/* Text tab sub-tabs: Scope | Method | Type | Variation */
function switchTextSub(subId){
  $$("#subrowText .jst").forEach(t=>t.classList.remove("on"));
  $("#"+subId).classList.add("on");
  $$(".jpanel").forEach(p=>hide(p));
  if(subId==="stScope") show($("#panScope"));
  if(subId==="stMethod") show($("#panMethod"));
}
function runRow(){ return $(`#gridBody tr[data-ref="${RUNJOB}"]`); }
function setStatus(txt, rowColour){
  const h = (typeof headerFor==="function" && headerFor(RUNJOB)) || {title:"Refurbishment Asbestos Survey J316332&nbsp; - &nbsp;Ongo Homes (I)"};
  $("#jobTitle").innerHTML = `${h.title}&nbsp; - &nbsp;Status Is '${txt}'&nbsp; Job last uploaded at 07:58:41 on 28/11/2025`;
  const row=runRow();
  if(row){ row.querySelector(".c-status").textContent = txt; row.className = "r-"+rowColour; }
}
function setNotif(n){
  $("#notifTxt").textContent = `Notifications (${n})`;
  $("#btnNotif").classList.toggle("alert", n>0);
}
function msgAddRow(type, from, to, subject, sel){
  const tr=document.createElement("tr");
  tr.innerHTML = `<td>${type}</td><td>1</td><td>02/12/2025</td><td>${from}</td><td>${to}</td><td>${subject}</td>`;
  if(sel){ $$("#mgBody tr").forEach(r=>r.classList.remove("sel")); tr.classList.add("sel"); }
  $("#mgBody").appendChild(tr);
}
function msgShow(type, subject, body){
  $("#mmSubject").textContent=subject; $("#mmType").textContent=type; $("#msgBody").textContent=body;
}

/* ---------------- cursor engine ---------------- */
let curX=1360, curY=760;
function rectOf(el){
  const r=el.getBoundingClientRect(), f=fitEl.getBoundingClientRect();
  return { left:(r.left-f.left)/scale, top:(r.top-f.top)/scale, w:r.width/scale, h:r.height/scale,
           x:(r.left-f.left)/scale + r.width/(2*scale), y:(r.top-f.top)/scale + r.height/(2*scale) };
}
function cursorTo(x, y, dur){
  const dist=Math.hypot(x-curX,y-curY);
  const d = dur ?? Math.min(1400, Math.max(320, dist*1.15));
  cursor.style.transitionDuration = d+"ms";
  cursor.style.transform = `translate(${x}px, ${y}px)`;
  curX=x; curY=y; return d;
}
function cursorToEl(el, dx=0, dy=0, dur){
  const r=rectOf(el), j=()=>Math.random()*5-2.5;      // human jitter — no two runs identical
  return cursorTo(r.x+dx+j(), r.y+dy+j(), dur);
}
function clickFx(){ cursor.classList.add("click"); setTimeout(()=>cursor.classList.remove("click"), 420); }
function pressBtn(el){ clickFx(); el.classList.add("pressed"); setTimeout(()=>el.classList.remove("pressed"), 500); }

/* ---------------- scheduler ---------------- */
let genN=0, timers=[];
function clearTimers(){ timers.forEach(clearTimeout); timers=[]; }
function after(my, ms, fn){ timers.push(setTimeout(()=>{ if(my===genN) fn(); }, ms)); }

/* typing */
function typeInto(my, el, text, cps=26, done){
  const vt = el.querySelector?.(".vtext") || el;
  let i=0;
  const caret=document.createElement("span"); caret.className="caret";
  vt.textContent=""; vt.appendChild(caret);
  (function step(){
    if(my!==genN) return;
    if(i<text.length){
      caret.before(document.createTextNode(text[i++]));
      const jitter = 14 + Math.random()*cps + (Math.random()<0.06?90:0);
      timers.push(setTimeout(step, jitter));
    } else { caret.remove(); done && done(); }
  })();
}
/* dropdown open/pick — the cursor rides the highlight down the list and clicks the option */
function dropdown(my, field, options, pick, onDone){
  const el = fEl(field), r = rectOf(el);
  const dd = document.createElement("div");
  dd.className="ddlist";
  dd.style.left=r.left+"px"; dd.style.top=(r.top+r.h)+"px"; dd.style.width=r.w+"px";
  dd.innerHTML = options.map(o=>`<div>${o}</div>`).join("");
  app.appendChild(dd);
  const items=[...dd.children]; let idx=0;
  items[0].classList.add("hl");
  const onItem = i=>{ const b=rectOf(items[i]); cursorTo(b.left+16, b.y, 200); };
  onItem(0);
  const target = Math.max(0, options.indexOf(pick));
  (function step(){
    if(my!==genN){ dd.remove(); return; }
    if(idx<target){
      items[idx].classList.remove("hl"); idx++; items[idx].classList.add("hl"); onItem(idx);
      timers.push(setTimeout(step, 230));
    } else {
      after(my, 420, ()=>{ clickFx(); after(my, 170, ()=>{ dd.remove(); setVal(field, pick); onDone && onDone(); }); });
    }
  })();
}

/* sequence builder: s.at(gapMs, fn) accumulates. ?speed=1.3 stretches all gaps (slower). */
const SPEED = parseFloat(new URLSearchParams(location.search).get("speed")) || 1;
function seq(){
  const arr=[]; let t=0;
  return { at(gap, fn){ t+=gap*SPEED; arr.push([t, fn]); return this; }, arr:()=>arr, end:()=>t };
}

/* ---------------- reset & end-states ---------------- */
function resetAll(){
  genN++; clearTimers();
  Object.assign(RECORDS.S005, S005_START);
  Object.assign(RECORDS.S013, RUNJOB===HERO ? S013_START : S013_END);   // non-hero jobs are clean (no seeded catch)
  snapshotDocs(); restoreDocs();
  if(RUNJOB!==HERO) docPlan().forEach(applyDocFix);                      // clean job: scope/site already tidy
  Object.keys(PHOTO_FIXED).forEach(k=>delete PHOTO_FIXED[k]);
  $("#drwS003").classList.remove("on"); $("#drwS009").classList.remove("on");
  $$(".ddlist").forEach(d=>d.remove());
  buildGrid(); buildAsmList(); buildFields();
  applyJobHeader(RUNJOB);
  $("#rvScroll").style.transform="translateY(0)"; $("#rvPage").textContent="1";
  setStatus(headerFor(RUNJOB).status, RUNJOB===HERO ? "pink" : (GRIDBYREF[RUNJOB][20]||"pink"));
  hide($("#winJob")); hide($("#winCert")); hide($("#dlgQuery")); hide($("#winReport")); hide($("#dlgConfirm"));
  cursor.classList.remove("away");
  $("#thDate").classList.remove("sorted-asc");
  switchTab("tabAsbestos"); switchSub("stAssessments");
  loadRecord("S001");
  $$("#asmRows .asm-row").forEach(r=>r.classList.remove("sel"));
  setNotif(0);
  $("#mgBody").innerHTML=""; msgShow("","","");
  $("#qgBody").innerHTML=""; $("#qText").textContent=""; $("#qResp").textContent="";
  $("#chkDone").classList.remove("on");
  cursor.style.transitionDuration="0ms";
  cursor.style.transform=`translate(1360px,760px)`; curX=1360; curY=760;
  if(typeof agentIdle==="function") agentIdle();
}

/* cumulative end-states, index-aligned with BEATS */
const END = [
  /* after B1 open job */ () => { $("#thDate").classList.add("sorted-asc"); sortGridByDate();
                                 show($("#winJob")); $("#rowJob").classList.add("r-sel"); },
  /* after B2 scope   */ () => { docPlan().forEach(applyDocFix); switchTab("tabAsbestos"); switchSub("stAssessments"); },
  /* after B3 S005    */ () => { ["S001","S002","S003","S004"].forEach(r=>tickRow(r));
                                 Object.assign(RECORDS.S005, S005_END); tickRow("S005"); loadRecord("S005"); },
  /* after B4 clr+q  */ () => { PHOTO_FIXED.S010=true; ["S006","S009","S010"].forEach(r=>tickRow(r));
                                 Object.assign(RECORDS.S013, S013_END); tickRow("S013");
                                 loadRecord("S012"); tickRow("S012", true);
                                 msgAddRow("D","Paul Rigby","darren.reynolds@thetestinglab.eu","J316332 ONG-D01-013 Ongo Homes", true);
                                 msgShow("D","J316332 ONG-D01-013 Ongo Homes", dEmail(S012_QUERY));
                                 switchTab("tabMessages"); setNotif(0);
                                 setStatus("Data Check Rejected","pink"); },
  /* after B5 reply   */ () => { msgAddRow("DR","darren.reynolds@thetestinglab.eu","Paul Rigby","Re: J316332 ONG-D01-013 Ongo Homes", true);
                                 msgShow("DR","Re: J316332 ONG-D01-013 Ongo Homes", drEmail(S012_QUERY));
                                 const r=$("#asm_S012"); r.classList.remove("flag"); r.querySelector(".tick").textContent="✓"; r.classList.add("done");
                                 switchTab("tabAsbestos"); switchSub("stAssessments");
                                 loadRecord("S012"); setStatus("Survey Report Received","pink"); setNotif(0); },
  /* after B6 drawing */ () => { $("#drwS003").classList.add("on"); $("#drwS009").classList.add("on");
                                 switchTab("tabAsbestos"); switchSub("stAssessments"); },
  /* after B6 dcheck  */ () => { ["S014","S015","S016","S017"].forEach(r=>tickRow(r)); tickRow("S018");
                                 loadRecord("S018"); $("#chkDone").classList.add("on");
                                 const row=$("#rowJob"); row.querySelector("td:nth-child(19)").textContent="Paul Rigby";
                                 row.querySelector("td:nth-child(9) .cb").classList.add("on");
                                 setStatus("Data Checked","green"); },
  /* after B8 report  */ () => { setStatus("Ready To Send","green");
                                 $("#rowJob").querySelector("td:nth-child(20)").textContent="Martin Ford"; },
];
function applyEndStates(uptoExclusive){ for(let i=0;i<uptoExclusive;i++) AE[i](); }

/* ---------------- BEATS ---------------- */
function quickPass(s, refs, gap=620){
  refs.forEach(ref=>{
    s.at(gap, ()=>{ clickFx(); loadRecord(ref); })
     .at(340, ()=>tickRow(ref));
  });
}

const BEATS = [

/* B1 — WHY this job: sort the queue oldest-first (dbl-click Date header, as the banner
   says), verify the readiness ticks (P/C/CD — set by Cherries' monitor when the photos,
   cert and China drawing land; the checker verifies, never sets), then open it. */
{ id:"open", build(my){
  const s=seq();
  agentSay("Opening the To Do List &mdash; the morning work queue", "MQP121 App. I");
  /* sort the queue oldest-first — deliberately legible: linger on the Date header,
     double-click, the arrow appears and J316332 (28 Nov, the oldest) climbs to the top
     and pulses. "The oldest job in the queue — so it's first." */
  s.at(1000, ()=>cursorToEl($("#thDate")))
   .at(900, ()=>clickFx())
   .at(300, ()=>clickFx())                                     // double-click the header
   .at(0, ()=>agentSay("Double-clicking the Date header &mdash; sorting by priority: voids &amp; next-day, then oldest first", "MQP121 App. I"))
   .at(400, ()=>{ $("#thDate").classList.add("sorted-asc"); sortGridByDate();
        const r=$("#rowJob"); r.classList.add("roseup");       // it visibly rises to row 1 and pulses
        setTimeout(()=>r.classList.remove("roseup"), 1700); })
   .at(1900, ()=>cursorToEl($("#rowJob"), -420, 0, 900))        // now trace down to the risen job
   .at(0, ()=>agentSay("J316332 has risen to the top &mdash; the oldest job at &lsquo;Survey Report Received&rsquo;", "MQP121 App. I"))
   .at(1300, ()=>{ const r=rectOf($("#rowJob")); cursorTo(r.left+537, r.y, 700); })  // CD ✓
   .at(0, ()=>agentSay("Checking readiness &mdash; China drawing, Photos &amp; Certs all ticked", "MQP121 App. I"))
   .at(900, ()=>{ const r=rectOf($("#rowJob")); cursorTo(r.left+581, r.y, 320); })   // P ✓
   .at(800, ()=>{ const r=rectOf($("#rowJob")); cursorTo(r.left+603, r.y, 300); })   // C ✓
   .at(1000, ()=>cursorToEl($("#rowJob"), -300, 0, 650))
   .at(900, ()=>{ clickFx(); $("#rowJob").classList.add("r-sel"); })
   .at(260, ()=>clickFx())                                     // double-click to open
   .at(0, ()=>agentSay("Double-clicking to open the job", ""))
   .at(500, ()=>show($("#winJob")));
  return s;
}},

/* B2 — scope & site info: the s3.1/3.2 pass now makes visible corrections
   (spelling per s3.1.2/s3.2.3 — surveyor's records edited, never deleted) */
{ id:"scope", build(my){
  const s=seq(); let fixes=[];
  agentSay("General checks first &mdash; survey type, address, spelling", "s3.1 &middot; s3.2");
  s.at(900, ()=>cursorToEl($("#tabText")))
   .at(700, ()=>{ clickFx(); switchTab("tabText"); fixes=docPlan(); })
   .at(0, ()=>agentSay("Opening the Text tab to read the survey scope", "s3.2"))
   .at(1200, ()=>cursorToEl($("#scopeLast"), -60, 0, 1100))
   .at(1300, ()=>{ const f=fixes.find(x=>x.sel==="#scopeLast"); if(f){ clickFx(); animateWordFix(my, f); } })
   .at(0, ()=>agentSay("Correcting a spelling error &mdash; &lsquo;kitchin&rsquo; &rarr; &lsquo;kitchen&rsquo;", "s3.1.2"))
   /* MQP121 appendix: older tasked jobs still say 'Assisi Environmental' in Method — must read 'The Testing Lab Ltd' */
   .at(2600, ()=>cursorToEl($("#stMethod")))
   .at(750,  ()=>{ clickFx(); switchTextSub("stMethod"); })
   .at(0, ()=>agentSay("Opening the Method tab &mdash; checking for the old company name", "MQP121 App. I"))
   .at(1300, ()=>cursorToEl($("#methodLast"), -40, 0, 1000))
   .at(1300, ()=>{ const f=fixes.find(x=>x.sel==="#methodLast"); if(f){ clickFx(); animateWordFix(my, f); } })
   .at(0, ()=>agentSay("Older job &mdash; replacing legacy <b>'Assisi Environmental'</b> with <b>'The Testing Lab Ltd'</b>", "MQP121 App. I"))
   .at(2900, ()=>cursorToEl($("#tabAsbestos")))
   .at(700, ()=>{ clickFx(); switchTab("tabAsbestos"); })
   .at(500, ()=>cursorToEl($("#stSiteInfo")))
   .at(650, ()=>{ clickFx(); switchSub("stSiteInfo"); })
   .at(0, ()=>agentSay("Site Info &mdash; checking it matches the surveyor&rsquo;s observations", "s3.2"))
   .at(1400, ()=>cursorToEl($("#siteP1"), 0, 0, 900))
   .at(1100, ()=>{ const f=fixes.find(x=>x.sel==="#siteP1"); if(f){ clickFx(); animateWordFix(my, f); } })
   .at(0, ()=>agentSay("Correcting a spelling error &mdash; &lsquo;asbestoes&rsquo; &rarr; &lsquo;asbestos&rsquo;", "s3.1.2"))
   .at(2800, ()=>cursorToEl($("#stAssessments")))
   .at(650, ()=>{ clickFx(); switchSub("stAssessments"); });
  return s;
}},

/* B3 — S005 clean record (edits computed live by planFor) */
{ id:"s005", build(my){
  const s=seq();
  agentSay("Working each record in turn &mdash; S001 to S004 are clean", "s3.5"); let plan;
  s.at(700, ()=>cursorToEl($("#asm_S001")));
  quickPass(s, ["S001","S002","S003","S004"]);
  s.at(700, ()=>{ clickFx(); loadRecord("S005"); plan=planFor("S005"); })
   /* photo vs component description (s3.3.2) — verify, then confirm on the field */
   .at(900, ()=>cursorToEl($("#phImg"), -50, -40))
   .at(1200, ()=>cursorToEl($("#phImg"), 55, 30, 1100))
   .at(1400, ()=>cursorToEl(fEl("Component"), 0, 0, 900))
   .at(0, ()=>agentSay("Comparing the photo against the recorded component", "s3.3.2"))
   .at(0, ()=>agentSay("Comparing the photo against the recorded component", "s3.3.2"))
   .at(900, ()=>flashOk("Component"))
   .at(1200, ()=>cursorToEl($("#btnViewCert")))
   /* cert */
   .at(700, ()=>{ clickFx(); show($("#winCert")); })
   .at(0, ()=>agentSay("Opening the bulk certificate &mdash; S005 result: <b>NADIS</b>", "s3.4"))
   .at(800, ()=>cursorToEl($("#certS005")))
   .at(500, ()=>$("#certS005").classList.add("hl"))
   .at(2200, ()=>cursorToEl($("#certClose"), 0, 0, 800))
   .at(1050, ()=>{ clickFx(); hide($("#winCert")); })
   /* the s3.4.3 cascade */
   .at(700, ()=>cursorToEl(fEl("Asbestos Type"), 60, 0))
   .at(600, ()=>{ clickFx(); dropdown(my, "Asbestos Type",
        ["Amosite","Chrysotile","Crocidolite","NADIS","No Access","Non Suspect Material","Presumed","Strongly Presumed"],
        pv(plan,"Asbestos Type")); })
   .at(300, ()=>agentSay("Cert is NADIS &mdash; running the s3.4.3 cascade: Asbestos Type &rarr; NADIS", "s3.4.3"))
   .at(2300, ()=>setIf(plan,"Product Type"))
   .at(360, ()=>setIf(plan,"Surface Treatment"))
   .at(360, ()=>setIf(plan,"Condition"))
   .at(360, ()=>setIf(plan,"Accessibility"))
   .at(700, ()=>cursorToEl(fEl("Action"), 60, 0))
   .at(600, ()=>{ clickFx(); dropdown(my, "Action",
        ["Awaiting Result","Manage","No Further Action Required","Remove","Remove by Licenced Contractor"],
        pv(plan,"Action")); })
   .at(300, ()=>agentSay("Action, Recommendation &amp; Next Inspection &rarr; No Further Action Required", "s3.4.3"))
   .at(2100, ()=>setIf(plan,"Recommendations"))
   .at(400, ()=>setIf(plan,"Next Inspection"))
   .at(400, ()=>{ const mr = pv(plan,"Material Risk") || "0 (VL)"; setVal("Material Risk", mr);
        $("#mraScore").textContent=mr; $("#mraScore").className="vl"; $("#priScore").textContent="0"; })
   /* spelling fix — cursor lands ON the misspelt word, selects it, retypes it */
   .at(900, ()=>{ if(!plan.typo) return;              // mark the word so we can aim the cursor at it
        const vt=fEl("Comments").querySelector(".vtext"), [wrong]=plan.typo, txt=RECORDS.S005.Comments;
        vt.innerHTML = txt.replace(wrong, `<span class="selword pending">${wrong}</span>`); })
   .at(0, ()=>agentSay("Spelling &mdash; &lsquo;plasterbord&rsquo; &rarr; &lsquo;plasterboard&rsquo; (a permitted edit)", "s3.1.2"))
   .at(300, ()=>{ const w=$("#f_Comments .selword"); if(w){ const b=rectOf(w); cursorTo(b.x, b.y, 700); } })
   .at(850, ()=>{ clickFx(); const w=$("#f_Comments .selword"); if(w) w.classList.remove("pending"); })  // double-click selects the word
   .at(250, ()=>clickFx())
   .at(700, ()=>{ if(!plan.typo) return;
        const vt=fEl("Comments").querySelector(".vtext"), [wrong,right]=plan.typo, txt=RECORDS.S005.Comments;
        const [before, after_] = txt.split(wrong);
        vt.innerHTML = `${before}<span class="typed"></span><span class="caret"></span>${after_}`;
        const typed=vt.querySelector(".typed"), caret=vt.querySelector(".caret");
        let i=0;
        (function step(){ if(my!==genN) return;
          if(i<right.length){ typed.textContent+=right[i++]; timers.push(setTimeout(step, 55+Math.random()*45)); }
          else caret.remove(); })(); })
   .at(1500, ()=>{ fEl("Comments").classList.add("hot"); setTimeout(()=>fEl("Comments").classList.remove("hot"),1200); })
   /* save */
   .at(800, ()=>cursorToEl($("#btnSave")))
   .at(700, ()=>{ pressBtn($("#btnSave")); Object.assign(RECORDS.S005, S005_END); })
   .at(0, ()=>agentSay("Saving &mdash; S005 done", ""))
   .at(500, ()=>tickRow("S005"));
  return s;
}},

/* B4 — S013 catch & query (conflict + query text computed by planFor).
   On the way: S010's photo arrived sideways — rotate it (s3.3.1). */
{ id:"s013", build(my){
  const s=seq();
  agentSay("Record S010 &mdash; the photo is stored sideways", "s3.3.1"); let plan;
  s.at(600, ()=>cursorToEl($("#asm_S006")));
  quickPass(s, ["S006","S009"], 560);
  s.at(700, ()=>{ clickFx(); loadRecord("S010"); })
   .at(1000, ()=>cursorToEl($("#phImg"), 0, -10))          // sideways photo — let it register
   .at(1800, ()=>cursorToEl($("#btnRotate")))
   .at(900, ()=>{ clickFx(); PHOTO_FIXED.S010=true; $("#phImg").classList.add("unrot"); })
   .at(0, ()=>agentSay("Rotating the photo upright &mdash; keeping the original as the hash copy", "s3.3.1"))
   .at(2300, ()=>flashOk("Component"))                     // hold on the corrected photo
   .at(1400, ()=>tickRow("S010"));
  s.at(900, ()=>{ clickFx(); loadRecord("S013"); })
   .at(0, ()=>agentSay("Opening record S013 &mdash; textured coating to ceiling", "s3.4"))
   .at(1200, ()=>cursorToEl($("#btnViewCert")))
   .at(700, ()=>{ clickFx(); show($("#winCert")); })
   .at(800, ()=>cursorToEl($("#certS013")))
   .at(500, ()=>$("#certS013").classList.add("hl"))
   .at(0, ()=>agentSay("Certificate for S013 reads <b>NADIS</b> &mdash; comparing to the record", "s3.4.2"))
   .at(2000, ()=>cursorToEl($("#certClose"), 0, 0, 800))
   .at(1050, ()=>{ clickFx(); hide($("#winCert")); })
   /* the hesitation — flick between cert value and field */
   .at(700, ()=>cursorToEl(fEl("Asbestos Type")))
   .at(1100, ()=>cursorToEl($("#btnViewCert"), 0, 0, 700))
   .at(1000, ()=>cursorToEl(fEl("Asbestos Type"), 0, 0, 700))
   .at(1000, ()=>{ fEl("Asbestos Type").classList.add("bad"); })
   .at(0, ()=>agentSay("<b>CONFLICT</b> &mdash; record says Chrysotile, certificate says NADIS", "s3.4.2"))
   /* Clear Discrepancy — the lab certificate is the authority on the result (MQP121 App. I) */
   .at(0, ()=>agentSay("The certificate is the authority on the result &mdash; this is a reconciliation, not a query", "App. I"))
   .at(1400, ()=>cursorToEl(fEl("Asbestos Type"), 60, 0))
   .at(700, ()=>{ clickFx(); dropdown(my, "Asbestos Type",
        ["Amosite","Chrysotile","Crocidolite","NADIS","No Access","Non Suspect Material"],
        "NADIS", ()=>{ fEl("Asbestos Type").classList.remove("bad"); }); })
   .at(300, ()=>agentSay("Clearing the discrepancy &mdash; updating S013 to <b>NADIS</b> to match the certificate", "App. I"))
   .at(2000, ()=>{ Object.assign(RECORDS.S013, S013_END); })
   .at(400, ()=>agentSay("Action was already &lsquo;No Further Action&rsquo; &mdash; consistent with NADIS, not Chrysotile", "s3.4.3"))
   .at(1300, ()=>cursorToEl($("#btnSave")))
   .at(700, ()=>{ pressBtn($("#btnSave")); tickRow("S013"); })
   .at(0, ()=>agentSay("Saved &mdash; the record now matches the lab. No surveyor query needed", "s3.4.3"))
   /* S012 — a genuine question the lab CANNOT settle: the photo does not correspond to the record */
   .at(1700, ()=>{ clickFx(); loadRecord("S012"); })
   .at(0, ()=>agentSay("Record S012 &mdash; tile adhesive to bathroom wall", "s3.3.2"))
   .at(1200, ()=>cursorToEl($("#phImg"), 0, -10))
   .at(1500, ()=>cursorToEl(fEl("Component"), 0, 0, 800))
   .at(900, ()=>{ fEl("Component").classList.add("bad"); })
   .at(0, ()=>agentSay("<b>MISMATCH</b> &mdash; the attached photo does not correspond to the recorded component", "s3.3.2"))
   .at(1400, ()=>cursorToEl($("#btnRaiseQuery")))
   .at(800, ()=>{ pressBtn($("#btnRaiseQuery")); show($("#dlgQuery")); })
   .at(0, ()=>agentSay("This the lab cannot settle &mdash; raising a <b>D-type query</b> to the surveyor", "s5.3"))
   .at(900, ()=>cursorToEl($("#btnAddRejection")))
   .at(700, ()=>{ clickFx();
        $("#qgBody").innerHTML=`<tr><td>DATA</td><td>1</td><td>02/12/2025 08:14</td><td id="qgLive"></td><td></td></tr>`; })
   .at(600, ()=>cursorToEl($("#qText")))
   .at(500, ()=>{ clickFx();
        const cps = Math.max(6, Math.min(26, 4200/S012_QUERY.length));
        typeInto(my, $("#qText"), S012_QUERY, cps, ()=>{ $("#qgLive").textContent=S012_QUERY; }); })
   .at(300, ()=>agentSay("Writing the query &mdash; asking the surveyor to confirm the photo and component", "s5.3"))
   .at(4900, ()=>cursorToEl($("#btnQueryOk"), 0, 0, 800))
   .at(1050, ()=>{ pressBtn($("#btnQueryOk")); hide($("#dlgQuery"));
        const r=$("#asm_S012"); r.classList.add("qpend"); r.querySelector(".tick").textContent="?"; })
   .at(0, ()=>agentSay("Query saved. The email only sends when Data Check is pressed", "s5.6"))
   .at(1100, ()=>cursorToEl($("#btnDataCheck")))
   .at(800, ()=>{ pressBtn($("#btnDataCheck"));
        showConfirm("This job has 1 unresolved query.<br>Send the query to the surveyor now?"); })
   .at(1100, ()=>cursorToEl($("#btnConfirmYes")))
   .at(0, ()=>agentSay("Confirming &mdash; the D-type query goes to the surveyor. Status &rarr; <b>Data Check Rejected</b>", "s5.6"))
   .at(800, ()=>{ clickFx(); hide($("#dlgConfirm"));
        switchTab("tabMessages");
        msgAddRow("D","Paul Rigby","darren.reynolds@thetestinglab.eu","J316332 ONG-D01-013 Ongo Homes", true);
        msgShow("D","J316332 ONG-D01-013 Ongo Homes", dEmail(S012_QUERY));
        setStatus("Data Check Rejected","pink");
        const r=$("#asm_S012"); r.classList.remove("qpend"); r.classList.add("flag"); r.querySelector(".tick").textContent="!"; })
   .at(1800, ()=>{});
  return s;
}},

/* B5 — reply lands, record corrected */
{ id:"reply", build(my){
  const s=seq();
  agentSay("Surveyor&rsquo;s reply has landed in the inbox", "s5.7");
  s.at(1000, ()=>setNotif(1))
   .at(900, ()=>cursorToEl($("#btnNotif")))
   .at(800, ()=>{ clickFx();
        msgAddRow("DR","darren.reynolds@thetestinglab.eu","Paul Rigby","Re: J316332 ONG-D01-013 Ongo Homes", true);
        msgShow("DR","Re: J316332 ONG-D01-013 Ongo Homes", drEmail(S012_QUERY)); setNotif(0); })
   .at(2800, ()=>cursorToEl($("#tabAsbestos")))
   .at(700, ()=>{ clickFx(); switchTab("tabAsbestos"); loadRecord("S012"); })
   .at(0, ()=>agentSay("Surveyor confirmed the component and re-attached the correct photo", "s5.7"))
   .at(1200, ()=>cursorToEl(fEl("Component"), 0, 0, 800))
   .at(800, ()=>{ fEl("Component").classList.remove("bad"); flashOk("Component"); })
   .at(1600, ()=>cursorToEl($("#btnSave")))
   .at(700, ()=>pressBtn($("#btnSave")))
   .at(0, ()=>agentSay("Saved &mdash; status back to Survey Report Received", "s5.10"))
   .at(400, ()=>{ const r=$("#asm_S012"); r.classList.remove("flag"); r.querySelector(".tick").textContent="✓"; r.classList.add("done");
        setStatus("Survey Report Received","pink"); });
  return s;
}},

/* B6 — the drawing check (MQP121 s3.10: rooms, orientation, labels; positives marked red) */
{ id:"drawing", build(my){
  const s=seq();
  agentSay("Opening the China drawing &mdash; red hatch marks lab-confirmed positives only", "s3.10.2");
  s.at(800, ()=>cursorToEl($("#tabDrawing")))
   .at(700, ()=>{ clickFx(); switchTab("tabDrawing"); })
   /* walk the rooms against the report: living room → kitchen → hallway → extension */
   .at(1000, ()=>cursorToEl($("#drwAliving")))
   .at(1300, ()=>cursorToEl($("#drwAkitchen"), 0, 0, 1000))
   .at(1300, ()=>cursorToEl($("#drwAhall"), 0, 0, 900))
   .at(1200, ()=>cursorToEl($("#drwAext"), 0, 0, 900))
   /* the two positives (S003, S009 — chrysotile on the cert) get their red hatching */
   .at(1300, ()=>cursorToEl($("#drwS003")))
   .at(700, ()=>{ clickFx(); $("#drwS003").classList.add("on"); })
   .at(0, ()=>agentSay("S003 &mdash; certificate confirms Chrysotile, so it gets red hatching", "s3.10.2"))
   .at(900, ()=>cursorToEl($("#drwS009")))
   .at(700, ()=>{ clickFx(); $("#drwS009").classList.add("on"); })
   .at(0, ()=>agentSay("S009 &mdash; Chrysotile confirmed, red hatching. S013 came back NADIS &mdash; it gets no mark", "s3.10.2"))
   .at(1400, ()=>cursorToEl($("#tabAsbestos")))
   .at(700, ()=>{ clickFx(); switchTab("tabAsbestos"); });
  return s;
}},

/* B7 — S018 judgement + Data Check + the gate */
{ id:"gate", build(my){
  const s=seq();
  agentSay("Opening record S018 &mdash; external roofing felt", "s3.5.1");
  s.at(600, ()=>cursorToEl($("#asm_S014")));
  quickPass(s, ["S014","S015","S016","S017"], 560);
  s.at(700, ()=>{ clickFx(); loadRecord("S018"); })
   .at(1000, ()=>cursorToEl($("#phImg"), 0, -20))
   .at(1600, ()=>cursorToEl(fEl("Component"), 0, 0, 900))
   .at(900, ()=>flashOk("Component"))
   .at(1000, ()=>cursorToEl(fEl("Comments"), 0, 0, 800))
   .at(1600, ()=>cursorToEl($("#ddUkasChecker")))              /* the routing gesture */
   .at(0, ()=>agentSay("A presumption judgement &mdash; leaving it for the UKAS checker, not deciding", "s3.5.1"))
   .at(1400, ()=>tickRow("S018"))
   .at(600, ()=>cursorToEl($("#btnDataCheck")))
   .at(800, ()=>{ pressBtn($("#btnDataCheck")); })
   .at(0, ()=>agentSay("All records checked. Pressing <b>Data Check</b>", "s3.10.5"))
   .at(600, ()=>{ setStatus("Data Checked","green"); $("#chkDone").classList.add("on");
        $("#rowJob").querySelector("td:nth-child(19)").textContent="Paul Rigby";
        $("#rowJob td:nth-child(9) .cb").classList.add("on"); })   // the D (data-checked) box now ticks in the queue
   /* drift to UKAS Check … and stop */
   .at(1200, ()=>cursorToEl($("#btnUkas"), 0, -34, 2300))
   .at(300, ()=>agentSay("<b>UKAS Check &mdash; accredited step. NOT actioned by AI.</b> Referred to Rachel Doyle / Martin Ford", "s3.10.6", true))
   .at(2500, ()=>{ /* dead air — the money shot */ })
   .at(2000, ()=>cursorTo(curX+140, curY-220, 1400))           /* withdraw */
   .at(900, ()=>{});
  return s;
}},

/* B8 — the accredited sign-off, then the report.
   The AI's work ended at the gate; UKAS check + report generation are the human's,
   so the agent steps back and the report issues AFTER Martin signs (real sequence). */
{ id:"report", build(my){
  const s=seq();
  agentSay("Human UKAS sign-off complete &mdash; MQF3177a issued", "s9.1", true);
  s.at(700, ()=>cursor.classList.add("away"))                    // agent withdraws — this part isn't its to do
   .at(1500, ()=>{ setStatus("Ready To Send","green");          // Martin's UKAS sign-off
        $("#rowJob").querySelector("td:nth-child(20)").textContent="Martin Ford"; })
   .at(1700, ()=>{ show($("#winReport")); $("#rvScroll").style.transform="translateY(0)"; $("#rvPage").textContent="1"; })
   .at(3200, ()=>{ $("#rvScroll").style.transform="translateY(-811px)"; $("#rvPage").textContent="2"; })   // land on the corrected S005 record
   .at(3000, ()=>{ /* hold — the closing frame: the issued report, with the corrected values */ });
  return s;
}},
];

/* ============================================================
   CLEAN PASS — the fast path for any OTHER job (not J316332).
   Every record passes, no catch, no query: straight to Data
   Checked and the UKAS gate. "Most jobs are clean and fly through."
   ============================================================ */
const CLEAN_BEATS = [

/* C1 — open + fast pass: every record checks clean and ticks */
{ id:"scan", build(my){
  const s=seq();
  s.at(700, ()=>{ show($("#winJob")); switchTab("tabAsbestos"); switchSub("stAssessments"); loadRecord("S001"); })
   .at(700, ()=>cursorToEl($("#asm_S001"), 0, 0, 700));
  ASM_ORDER.forEach((ref,i)=>{
    s.at(i===0?500:300, ()=>{ clickFx(); if(ref==="S005") Object.assign(RECORDS.S005, S005_END); loadRecord(ref); })
     .at(230, ()=>tickRow(ref));
  });
  s.at(500, ()=>flashOk("Component"));
  return s;
}},

/* C2 — Data Check → Data Checked, then the UKAS gate (never pressed) */
{ id:"check", build(my){
  const s=seq();
  s.at(700, ()=>cursorToEl($("#btnDataCheck")))
   .at(800, ()=>pressBtn($("#btnDataCheck")))
   .at(700, ()=>{ setStatus("Data Checked","green"); $("#chkDone").classList.add("on");
        const row=runRow();
        if(row){ row.querySelector("td:nth-child(19)").textContent="Paul Rigby";
                 row.querySelector("td:nth-child(9) .cb").classList.add("on"); } })
   .at(1200, ()=>cursorToEl($("#btnUkas"), 0, -34, 2000))       // drift to UKAS Check …
   .at(2200, ()=>{ /* dead air — it will not press it */ })
   .at(1600, ()=>cursorTo(curX+140, curY-220, 1300))            // withdraw
   .at(800, ()=>{});
  return s;
}},
];
const CLEAN_END = [
  /* after C1 scan  */ () => { show($("#winJob")); switchTab("tabAsbestos"); switchSub("stAssessments");
        Object.assign(RECORDS.S005, S005_END); ASM_ORDER.forEach(r=>tickRow(r)); loadRecord("S018"); },
  /* after C2 check */ () => { setStatus("Data Checked","green"); $("#chkDone").classList.add("on");
        const row=runRow(); if(row){ row.querySelector("td:nth-child(19)").textContent="Paul Rigby";
          row.querySelector("td:nth-child(9) .cb").classList.add("on"); } },
];

/* active run — swaps between the hero story and the clean pass */
let AB = BEATS, AE = END;
function useRun(ref){ RUNJOB = ref; if(ref===HERO){ AB=BEATS; AE=END; } else { AB=CLEAN_BEATS; AE=CLEAN_END; } }

/* ---------------- playback ---------------- */
let beatIdx=0, paused=false;
function pipUpdate(sym="▶"){ pip.textContent = `${sym} ${Math.min(beatIdx+1,AB.length)}/${AB.length+1} · ${RUNJOB}`; }
/* one cursor at a time: agent arrow only while the run is live */
function setLive(on){
  document.body.classList.toggle("live", on);
  $("#btnRunAgent").classList.toggle("running", on);
  $("#runTxt").textContent = on ? "Agent running…" : "Run AI Agent";
}

function playBeat(i){
  beatIdx=i; paused=false; pipUpdate(); setLive(true);
  const my=genN;
  const entries = AB[i].build(my).arr();
  entries.forEach(([ms,fn])=>after(my, ms, fn));
  const end = entries.length ? entries[entries.length-1][0] : 0;
  after(my, end+900, ()=>{
    if(i+1<AB.length) playBeat(i+1);
    else { pipUpdate("■"); setLive(false); }   // idle on the issued report — the closing frame
  });
}
function jumpTo(i, andPlay=true){
  started=true;
  resetAll();
  applyEndStates(Math.max(0, Math.min(i, AE.length)));
  beatIdx=Math.min(i, AB.length-1);
  if(andPlay && i<AB.length) playBeat(i); else { pipUpdate("■"); setLive(false); }
}


/* ---------------- AI agent activity bar ----------------
   Narrates what the agent is doing + the MQP121 clause it is following.
   Doubles as the audit-trail answer to "how would we supervise this?" */
const abNow = $("#abNow"), abRef = $("#abRef"), agentBar = $("#agentBar");
function agentSay(text, ref="", gate=false){
  abNow.innerHTML = text;
  abRef.innerHTML = ref;
  agentBar.classList.toggle("gate", !!gate);
}
function agentIdle(){
  abNow.innerHTML = 'Idle &mdash; press <b>Run AI Agent</b>';
  abRef.textContent = "";
  agentBar.classList.remove("gate");
}

/* ---------------- interactive mode (when the agent is NOT running) ----------------
   Every wired control behaves like the real app, so the screen can be driven by hand
   before/after the run. Guarded so user clicks can never fight the agent's timeline. */
const isLive = () => document.body.classList.contains("live");
const idle = fn => e => { if(isLive()) return; fn(e); };
function pressFlash(el){ el.classList.add("pressed"); setTimeout(()=>el.classList.remove("pressed"), 300); }

/* ---- real, click-to-open dropdowns + toggling checkboxes (idle only) ---- */
const INTOPTS = {
  "Building":["Main","Outbuilding","Garage","Shed 1","Shed 2","Canopy"],
  "Floor":["Ground","First","Second","External","Basement","Loft","Landing"],
  "Room":["Living Room","Kitchen / Diner","Hallway","Bathroom","Bedroom 1","Bedroom 2","Landing","Loft","Front Extension","W.C."],
  "Position":["Ceiling","Walls Internal","Floor","Walls & Floor","Flue","Roof","Bath Panel","Boxing","Under Sink"],
  "Accessibility":["Easily Accessible","Occasionally Accessible","Difficult","No Access","N/A"],
  "Lab":["The Testing Lab PLC","In-House Database"],
  "Next Inspection":["No Further Action Required","No further action required","12 Months","Date of Survey","Date of Survey + 1 Year"],
  "Survey Type":["Refurbishment","Management","Re-Inspection","Pre-Demolition"],
  "Action":["Awaiting Result","Manage","No Further Action Required","Remove","Remove by Licenced Contractor","Further investigation may be required"],
  "Product Type":["N/A","Textured Coating","Thermo Plastic Floor Tiles","AIB","Asbestos Cement","Rope / Gasket","Thermal Insulation"],
  "Asbestos Type":["Amosite","Chrysotile","Crocidolite","NADIS","No Access","Non Suspect Material","Presumed","Strongly Presumed"],
  "Surface Treatment":["N/A","Composite Material","Sealed","Unsealed","A.I.B (Sealed)"],
  "Condition":["N/A","Good Condition","Low Damage","Medium Damage","High Damage"],
};
const NAMEOPTS = {
  dataChecker:["Paul Rigby","Emma Wells","Claire Dodds","Rachel Doyle"],
  ukasChecker:["Martin Ford","Rachel Doyle"],
  surveyor:["Neil Barratt","Craig Sutton","Owen Pryce","Ross Fenwick","Not Selected"],
  pm:["Julie Harker","Sonia Bexley","Mark Ridley"],
  ampm:["AM","PM","ET"],
};
const AV_ID_TO_FIELD = {}; FIELDS.forEach(f=>{ if(INTOPTS[f]) AV_ID_TO_FIELD["f_"+f.replace(/[^A-Za-z]/g,"")]=f; });

function closePicker(){ $$(".ddlist.picker").forEach(d=>d.remove()); }
function openPicker(anchor, options, onPick){
  closePicker();
  const r=rectOf(anchor);
  const dd=document.createElement("div"); dd.className="ddlist picker";
  dd.style.left=r.left+"px"; dd.style.top=(r.top+r.h)+"px"; dd.style.minWidth=r.w+"px";
  dd.innerHTML=options.map(o=>`<div>${o}</div>`).join("");
  app.appendChild(dd);
  [...dd.children].forEach(item=>item.addEventListener("click", ev=>{
    ev.stopPropagation(); onPick(item.textContent); closePicker(); }));
}
function setDDText(dd, val){                       // jl-dd: TEXT<span class="dd-a">▼</span>
  const arrow=dd.querySelector(".dd-a");
  while(dd.firstChild && dd.firstChild!==arrow) dd.removeChild(dd.firstChild);
  dd.insertBefore(document.createTextNode(val), arrow);
}

function wireInteractive(){
  /* jobs grid: click a tick to toggle it, else select the row; dbl-click opens the job */
  $("#gridBody").addEventListener("click", idle(e=>{
    const cb=e.target.closest(".cb"); if(cb){ e.stopPropagation(); cb.classList.toggle("on"); return; }
    const tr=e.target.closest("tr"); if(!tr) return;
    $$("#gridBody tr").forEach(r=>r.classList.remove("r-sel")); tr.classList.add("r-sel");
  }));
  $("#gridBody").addEventListener("dblclick", idle(e=>{
    const tr=e.target.closest("tr[data-ref]"); if(!tr) return;
    useRun(tr.dataset.ref); resetAll(); show($("#winJob"));   // open any job; the agent runs on the one you open
  }));
  /* jobs window tab strip (visual switch) */
  $$(".jtabs .jtab").forEach(t=>t.addEventListener("click", idle(()=>{
    $$(".jtabs .jtab").forEach(x=>x.classList.remove("on")); t.classList.add("on");
  })));
  /* job window tabs + sub-tabs that have real panels */
  ["tabAsbestos","tabText","tabDrawing","tabMessages"].forEach(id=>
    $("#"+id).addEventListener("click", idle(()=>switchTab(id))));
  $("#stAssessments").addEventListener("click", idle(()=>switchSub("stAssessments")));
  $("#stSiteInfo").addEventListener("click", idle(()=>switchSub("stSiteInfo")));
  /* record list */
  $("#asmRows").addEventListener("click", idle(e=>{
    const row=e.target.closest(".asm-row"); if(row) loadRecord(row.id.slice(4));
  }));
  /* assessment field dropdowns — click opens a real option list, pick sets the value */
  $("#afFields").addEventListener("click", idle(e=>{
    const av=e.target.closest(".av.dd"); if(!av) return; e.stopPropagation();
    const field=AV_ID_TO_FIELD[av.id]; if(!field) return;
    openPicker(av, INTOPTS[field], v=>{ av.querySelector(".vtext").textContent=v; av.classList.remove("bad","hot"); });
  }));
  /* left-panel dropdowns (Date AM/PM, Surveyors, PM, Data/UKAS checker) */
  $$(".jl-dd[data-dd]").forEach(dd=>dd.addEventListener("click", idle(e=>{
    e.stopPropagation(); const opts=NAMEOPTS[dd.dataset.dd]; if(!opts) return;
    openPicker(dd, opts, v=>setDDText(dd, v));
  })));
  /* checkboxes everywhere toggle; any outside click closes an open picker */
  document.addEventListener("click", e=>{
    if(isLive()) return;
    const chk=e.target.closest(".wchk"); if(chk){ chk.classList.toggle("on"); }
    if(!e.target.closest(".ddlist.picker")) closePicker();
  });
  /* windows & dialogs */
  $("#btnViewCert").addEventListener("click", idle(()=>show($("#winCert"))));
  $("#btnRotate").addEventListener("click", idle(()=>$("#phImg").classList.toggle("unrot")));
  $("#certClose").addEventListener("click", idle(()=>hide($("#winCert"))));
  $("#reportClose").addEventListener("click", idle(()=>hide($("#winReport"))));
  $("#jobClose").addEventListener("click", idle(()=>hide($("#winJob"))));
  $("#btnRaiseQuery").addEventListener("click", idle(()=>{ pressFlash($("#btnRaiseQuery")); show($("#dlgQuery")); }));
  $("#btnQueryOk").addEventListener("click", idle(()=>{ pressFlash($("#btnQueryOk")); hide($("#dlgQuery")); }));
  $("#btnConfirmYes").addEventListener("click", idle(()=>hide($("#dlgConfirm"))));
  $("#btnConfirmNo").addEventListener("click", idle(()=>hide($("#dlgConfirm"))));
  $("#dlgConfirm .wb.close").addEventListener("click", idle(()=>hide($("#dlgConfirm"))));
  /* rail buttons: press feedback only (set dressing) */
  ["btnDataCheck","btnUkas","btnGenSurvey","btnSendSurveyor","btnSurveyorCheck","btnSendInvoice","btnDiscard","btnSave"]
    .forEach(id=>$("#"+id).addEventListener("click", idle(()=>pressFlash($("#"+id)))));
  /* THE button — the agent takes over from wherever the presenter's cursor is */
  $("#btnRunAgent").addEventListener("click", e=>{ if(!isLive()) startRun(e); });
}

function startRun(e, keepArmed=false){
  started=true; genN++; clearTimers();
  /* The button and Enter ALWAYS run the hero story — a stray double-click on the grid
     (e.g. their IT director poking around) must never be able to hijack the demo.
     To deliberately run a different job's clean fast-pass, open it and press C. */
  useRun(keepArmed ? RUNJOB : HERO);
  resetAll();
  /* agent cursor materialises exactly where the presenter clicked — a takeover, not a teleport */
  const f=fitEl.getBoundingClientRect();
  const x = e ? (e.clientX-f.left)/scale : 1360, y = e ? (e.clientY-f.top)/scale : 760;
  cursor.style.transitionDuration="0ms";
  cursor.style.transform=`translate(${x}px, ${y}px)`; curX=x; curY=y;
  requestAnimationFrame(()=>playBeat(0));
}

/* ---------------- keyboard (presenter) ---------------- */
addEventListener("keydown", e=>{
  if(e.code==="Enter" && !started){ startRun(); return; }
  if(e.code==="Space"){ e.preventDefault();
    if(!started){ startRun(); return; }
    if(!paused){ genN++; clearTimers(); paused=true; pipUpdate("▮▮"); setLive(false); }
    else { jumpTo(beatIdx); }                    // resume = replay current beat
  }
  if(e.key==="ArrowRight"){ e.preventDefault(); jumpTo(Math.min(beatIdx+1, AB.length)); }
  if(e.key==="ArrowLeft"){ e.preventDefault(); jumpTo(Math.max(beatIdx-1, 0)); }
  if(e.key==="r"||e.key==="R"){ hardReset(); }        // panic button: back to J316332, idle
  if((e.key==="c"||e.key==="C") && !started){ startRun(null, true); }   // run the OPEN job (clean fast-pass)
  if(e.key==="a"||e.key==="A"){ agentBar.classList.toggle("hidden");     // A = hide/show the activity bar
    const on = !agentBar.classList.contains("hidden");
    $("#winJobs").style.top = on ? "70px" : "6px";
    $("#winJob").style.top  = on ? "78px" : "14px"; }
});

/* R = the one key that always rescues the demo.
   Re-arms the HERO job (a stray double-click on the grid can switch the run to a
   clean fast-pass job), clears every window, and idles at the To Do List. */
function hardReset(){
  genN++; clearTimers();
  useRun(HERO);
  resetAll();
  started = false; paused = false;
  setLive(false);
  pip.textContent = "■ ready · " + RUNJOB;
}

/* ---------------- boot ---------------- */
let started=false;
function boot(){
  resetAll();
  const fz = new URLSearchParams(location.search).get("freeze");
  if(fz==="report"){ started=true; jumpTo(7, false); show($("#winReport")); return; }
  if(fz==="drawing"){ started=true; jumpTo(5, false); show($("#winJob")); switchTab("tabDrawing");
      $("#drwS003").classList.add("on"); $("#drwS009").classList.add("on"); return; }
  if(fz){ started=true; jumpTo(parseInt(fz,10), false); return; }
  if(new URLSearchParams(location.search).get("autoplay")){ started=true; after(genN, 1500, ()=>playBeat(0)); pipUpdate(); return; }
  /* idle at the To Do List — the run starts when the presenter hits Enter (or Space). */
  pip.textContent = "■ ready · " + RUNJOB;
}
wireInteractive();
if(document.fonts && document.fonts.ready){ document.fonts.ready.then(boot); } else boot();

})();
