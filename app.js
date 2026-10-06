
// -----------------------------------------------------------------------------
// FinOps Atlas application
// -----------------------------------------------------------------------------
// Data is normalized into a hierarchy, then rendered as an interactive SVG.

// Hierarchy levels and shared formatting helpers
const TYPES=['Tenant','Subscription','Resource group','Resource','Component'];
const COL=i=>`var(--c${i})`;
let cur='USD',root,sel,uid=0,byId={},LM=[0,0,0,0,0],DAYS=[];
window._outlierRows=[];
window._recommendationRows=[];
let hierarchyMode='normal';
function setAzureTheme(enabled){document.documentElement.dataset.theme=enabled?'azure':'';const b=document.getElementById('azureThemeToggle');if(b)b.setAttribute('aria-pressed',String(enabled));try{localStorage.setItem('finops-azure-theme',enabled?'1':'0')}catch(e){}}
function toggleAzureTheme(){setAzureTheme(document.documentElement.dataset.theme!=='azure')}
try{setAzureTheme(localStorage.getItem('finops-azure-theme')==='1')}catch(e){setAzureTheme(false)}
// Supply rows returned by the Fabric `daily cost outliers` function here.
function setOutlierRows(rows){window._outlierRows=rows||[];if(root)render()}
const fmt=v=>new Intl.NumberFormat('en',{style:'currency',currency:cur,maximumFractionDigits:v>=1000?0:2}).format(v);
const pct=v=>(v*100).toFixed(v<.1?1:0)+'%';
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const cut=(s,n)=>s.length>n?s.slice(0,n-1)+'…':s;

// -----------------------------------------------------------------------------
// Data layer
// Swap sample() for a Fabric KQL call when connecting live Azure cost data.
// CSV rows are normalized into the same internal shape as the sample data.
// -----------------------------------------------------------------------------
const IC={vm:'<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',disk:'<rect x="3" y="7" width="18" height="10" rx="2"/><path d="M3 13h18M7 15.3h.01"/>',nic:'<rect x="4" y="7" width="16" height="9" rx="1.5"/><path d="M8 16v3M12 16v3M16 16v3M8 11v1M12 11v1M16 11v1"/>',ip:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3.5 3.5 3.5 14.5 0 18M12 3c-3.5 3.5-3.5 14.5 0 18"/>',storage:'<rect x="3" y="4" width="18" height="6" rx="1.5"/><rect x="3" y="14" width="18" height="6" rx="1.5"/><path d="M7 7h.01M7 17h.01"/>',sql:'<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',aks:'<path d="M12 2l8.5 5v10L12 22l-8.5-5V7z"/><circle cx="12" cy="12" r="3"/>',cosmos:'<circle cx="12" cy="12" r="2.2"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(45 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(-45 12 12)"/>',app:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M6.5 6.5h.01"/>',log:'<path d="M5 20v-6M10 20V6M15 20v-9M20 20v-4"/>',net:'<path d="M3 12h4l3-7 4 14 3-7h4"/>',def:'<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="12" cy="12" r="2.5"/>'};
document.getElementById('defs').innerHTML=Object.entries(IC).map(([k,v])=>`<symbol id="i-${k}" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${v}</g></symbol>`).join('');
const icon=t=>{t=(t||'').toLowerCase();return/disk/.test(t)?'disk':/networkinterface|network interface|\bnic\b/.test(t)?'nic':/publicip|public ip|ip address/.test(t)?'ip':/virtualmachine|virtual machine|compute/.test(t)?'vm':/kubernetes|container service|aks/.test(t)?'aks':/sql/.test(t)?'sql':/cosmos/.test(t)?'cosmos':/storage|blob/.test(t)?'storage':/app service|sites|web/.test(t)?'app':/log analytics|insights|monitor/.test(t)?'log':/bandwidth|network|transfer|load balancer/.test(t)?'net':'def'};
function sample(){
 let s=7;const rnd=()=>(s=(s*16807)%2147483647)/2147483647;
 const subs={'Prod-Platform':['rg-aks-prod','rg-data-lake','rg-network-hub','rg-sql-prod','rg-appsvc-prod'],
 'Prod-Customer':['rg-web-frontend','rg-api-gateway','rg-cosmos-prod','rg-search'],
 'Dev-Test':['rg-dev-aks','rg-dev-data','rg-sandbox'],'Shared-Services':['rg-monitoring','rg-security','rg-backup','rg-identity']};
 const SV={'Virtual Machines':['vm','vm',[['Compute (VM hours)','vm',1],['OS disk','disk',.18],['Data disk','disk',.12],['Network interface','nic',.03],['Public IP','ip',.04]]],
 'Storage':['st','storage',[['Blob storage','storage',.6],['Transactions','net',.25],['Data transfer','net',.15]]],
 'Azure SQL':['sql','sql',[['vCore compute','sql',.7],['Data storage','disk',.2],['Backup storage','storage',.1]]],
 'Kubernetes Service':['aks','aks',[['Node pool VMs','vm',.7],['Managed disks','disk',.15],['Load balancer','net',.1],['Public IP','ip',.05]]],
 'Cosmos DB':['cosmos','cosmos',[['Provisioned RU/s','cosmos',.75],['Storage','storage',.2],['Bandwidth','net',.05]]],
 'Bandwidth':['net','net',[['Data transfer out','net',.8],['Inter-region','net',.2]]],
 'Log Analytics':['law','log',[['Data ingestion','log',.85],['Retention','storage',.15]]],
 'App Service':['app','app',[['Plan compute','app',.8],['SSL / domains','ip',.1],['Bandwidth','net',.1]]]};
 const names=Object.keys(SV),days=[...Array(60)].map((_,i)=>new Date(Date.now()-(59-i)*864e5).toISOString().slice(0,10));
 const rows=[];let k0=0;
 for(const [sub,rgs] of Object.entries(subs)){const k=sub.startsWith('Prod')?1:sub.startsWith('Shared')?.5:.22;
  for(const rg of rgs){const rk=.3+rnd()*1.6;
   for(let i=0;i<4+Math.floor(rnd()*6);i++){const sv=names[Math.floor(rnd()*names.length)],[pf,ic,cs]=SV[sv],tot=Math.pow(rnd(),2)*9000*k*rk+40,
    res=`${pf}-${rg.replace('rg-','')}-${String(i+1).padStart(2,'0')}`,loc=['uksouth','ukwest','northeurope'][Math.floor(rnd()*3)],spike=k0++%17==5;
    for(const [comp,cic,fr] of cs)days.forEach((date,j)=>{const wk=[0,6].includes(new Date(date).getUTCDay());
     let v=tot*fr/60*(1+.004*j)*(.85+rnd()*.3)*(k<.3&&wk?.4:1);if(spike&&j>=48&&j<=52)v*=3.2;
     rows.push({tenant:'contoso.onmicrosoft.com',sub,rg,res,service:sv,loc,comp,ic,cic,date,cost:v})})}}}
 return rows}
function parseCSV(t){const out=[];let r=[],c='',q=false;
 for(let i=0;i<t.length;i++){const ch=t[i];
  if(q){if(ch=='"'){if(t[i+1]=='"'){c+='"';i++}else q=false}else c+=ch}
  else if(ch=='"')q=true;else if(ch==','){r.push(c);c=''}
  else if(ch=='\n'||ch=='\r'){if(ch=='\r'&&t[i+1]=='\n')i++;r.push(c);c='';if(r.length>1||r[0])out.push(r);r=[]}
  else c+=ch}
 if(c||r.length){r.push(c);out.push(r)}return out}
function fromCSV(text){
 const [h,...d]=parseCSV(text);const g=n=>h.findIndex(x=>n.includes(x.trim().toLowerCase().replace(/[^a-z]/g,'')));
 const I={t:g(['tenantid','tenantname','billingaccountname']),s:g(['subscriptionname','subscriptionid']),rg:g(['resourcegroup','resourcegroupname']),
  id:g(['resourceid','instanceid','resourcename']),sv:g(['servicename','metercategory','consumedservice']),
  l:g(['resourcelocation','location']),c:g(['costinbillingcurrency','costinusd','pretaxcost','cost']),cu:g(['billingcurrency','currency']),
  d:g(['date','usagedate','chargeperiodstart']),m:g(['metername','metersubcategory','metercategory'])};
 if(I.c<0||I.s<0)throw new Error('Needs subscription and cost columns');
 const pd=v=>{let m=/^(\d{4})-(\d\d)-(\d\d)/.exec(v||'');if(m)return m[0];m=/^(\d\d?)\/(\d\d?)\/(\d{4})/.exec(v||'');return m?`${m[3]}-${m[1].padStart(2,'0')}-${m[2].padStart(2,'0')}`:''};
 const v=(r,i)=>i>=0?(r[i]||''):'';
 return d.filter(r=>r.length>I.c).map(r=>{if(I.cu>=0&&r[I.cu])cur=r[I.cu];const rid=v(r,I.id),sv=v(r,I.sv),comp=v(r,I.m);
  return{tenant:v(r,I.t)||'Tenant',sub:v(r,I.s)||'(none)',rg:v(r,I.rg)||'(no resource group)',res:(rid||'(unassigned)').split('/').pop(),
  service:sv,loc:v(r,I.l),comp,ic:icon(rid.split('/providers/').pop()+' '+sv),cic:icon(comp+' '+sv),date:pd(v(r,I.d)),cost:parseFloat(r[I.c])||0}})}

// Temporary fictional outliers for the sample dataset. This mirrors the shape
// returned by the future Fabric `daily cost outliers` function.
function makeSampleOutliers(rows){
 const totals=new Map();
 rows.forEach(r=>{const key=`${r.res}|${r.date}`;totals.set(key,(totals.get(key)||0)+r.cost)});
 const resources=[...new Set(rows.map(r=>r.res))].sort(),anomalyResources=new Set([2,17,33,48].map(i=>resources[i]).filter(Boolean));
 return [...totals.entries()].map(([key,total],i)=>{
  const [resource,date]=key.split('|'),resourceIndex=resources.indexOf(resource);
  const anomaly=anomalyResources.has(resource)&&((resourceIndex%2===0&&date.endsWith('-15'))||(resourceIndex%2===1&&date.endsWith('-08')));
  return{ChargePeriodStart:date,ResourceName:resource,TotalCost:total,isAnomaly:anomaly,Direction:anomaly?(resourceIndex%2?'Down':'Up'):'None'};
 });
}

// Five fictional cost recommendations for the sample dataset.
function makeSampleRecommendations(rows){
 const resources=[...new Set(rows.map(r=>r.res))].sort().slice(0,5),templates=[
  ['Rightsize underutilized compute','Reduce VM size based on sustained low utilization.'],
  ['Remove unattached disk','Delete an unattached managed disk no longer in use.'],
  ['Move storage to a cooler tier','Use a lower-cost access tier for infrequently accessed data.'],
  ['Review idle public IP','Release a public IP address that is not associated with active compute.'],
  ['Optimize SQL capacity','Scale reserved capacity to match the observed workload profile.']];
 return resources.map((resource,i)=>{const source=rows.filter(r=>r.res===resource),cost=source.reduce((a,r)=>a+r.cost,0);return{ResourceName:resource,Category:templates[i][0],Description:templates[i][1],PotentialMin:cost*(.08+i*.02),PotentialMax:cost*(.16+i*.025),Servicename:source[0]?.service||'Azure service',Cost:cost}});
}

// Build the tenant -> subscription -> resource group -> resource -> component tree.
function build(rows){uid=0;byId={};LM=[0,0,0,0,0];
 DAYS=[...new Set(rows.map(r=>r.date))].sort();const di={};DAYS.forEach((d,i)=>di[d]=i);
 const mk=(name,level,parent)=>{const o={id:++uid,name,level,parent,cost:0,kids:new Map(),services:{},loc:'',ic:'',ts:new Float64Array(DAYS.length)};byId[o.id]=o;return o};
 const R=mk(rows[0]?.tenant||'Tenant',0,null);
 for(const r of rows){let n=R;const j=di[r.date];n.cost+=r.cost;n.ts[j]+=r.cost;
  [r.sub,r.rg,r.res].concat(r.comp?[r.comp]:[]).forEach((k,i)=>{if(!n.kids.has(k))n.kids.set(k,mk(k,i+1,n));n=n.kids.get(k);n.cost+=r.cost;n.ts[j]+=r.cost;
   if(r.service)n.services[r.service]=(n.services[r.service]||0)+r.cost;if(i==2){n.loc=r.loc;n.ic=r.ic}if(i==3)n.ic=r.cic})}
 const fin=n=>{LM[n.level]=Math.max(LM[n.level],n.cost);n.children=[...n.kids.values()].sort((a,b)=>b.cost-a.cost);n.children.forEach(fin)};fin(R);return R}


// -----------------------------------------------------------------------------
// Summary view
// -----------------------------------------------------------------------------
function showTab(tab){
 const views=['hierarchy','summary','outliers','recommendations','drill'];views.forEach(v=>{const el=document.getElementById(`view${v[0].toUpperCase()+v.slice(1)}`);if(el)el.classList.toggle('active',v===tab)});
 document.querySelectorAll('.tab').forEach(b=>{const active=b.id===`tab${tab[0].toUpperCase()+tab.slice(1)}`;b.classList.toggle('active',active);b.setAttribute('aria-selected',active)});
 if(tab==='summary')renderSummary();if(tab==='outliers'||tab==='recommendations')renderInsights();
}
function renderInsights(){const out=(window._outlierRows||[]).filter(r=>r.isAnomaly===true||String(r.isAnomaly).toLowerCase()==='true').sort((a,b)=>String(b.ChargePeriodStart).localeCompare(String(a.ChargePeriodStart)));document.getElementById('outlierCount').textContent=out.length;document.getElementById('outlierResources').textContent=new Set(out.map(r=>r.ResourceName)).size;document.getElementById('outlierUp').textContent=out.filter(r=>r.Direction==='Up').length;document.getElementById('outlierBody').innerHTML=out.map((r,i)=>`<tr style="animation-delay:${Math.min(i*.03,.4)}s"><td>${esc(sd(String(r.ChargePeriodStart).slice(0,10)))}</td><td>${esc(r.ResourceName)}</td><td class="num">${fmt(r.TotalCost)}</td><td><span class="pill" style="background:#f59e0b">Anomaly</span></td><td>${esc(r.Direction||'—')}</td></tr>`).join('')||'<tr><td colspan="5" class="empty">No anomalies detected.</td></tr>';const rec=window._recommendationRows||[],min=rec.reduce((a,r)=>a+(r.PotentialMin||0),0),max=rec.reduce((a,r)=>a+(r.PotentialMax||0),0);document.getElementById('recommendationCount').textContent=rec.length;document.getElementById('recommendationMin').textContent=fmt(min);document.getElementById('recommendationMax').textContent=fmt(max);document.getElementById('recommendationBody').innerHTML=[...rec].sort((a,b)=>(b.PotentialMax||0)-(a.PotentialMax||0)).map((r,i)=>`<tr style="animation-delay:${Math.min(i*.05,.4)}s"><td>${esc(r.ResourceName)}</td><td>${esc(r.Category)}</td><td>${esc(r.Description)}</td><td>${esc(r.Servicename)}</td><td class="num">${fmt(r.Cost)}</td><td class="num">${fmt(r.PotentialMin)}</td><td class="num">${fmt(r.PotentialMax)}</td></tr>`).join('')||'<tr><td colspan="7" class="empty">No recommendations available.</td></tr>'}
function setHierarchyMode(mode){hierarchyMode=mode;document.getElementById('normalMode').classList.toggle('active',mode==='normal');document.getElementById('outlierMode').classList.toggle('active',mode==='outliers');document.getElementById('recommendationMode').classList.toggle('active',mode==='recommendations');render()}
function aggregateRows(rows,key){
 const m=new Map();
 rows.forEach(r=>{const k=r[key]||'(none)';m.set(k,(m.get(k)||0)+r.cost)});
 return [...m.entries()].sort((a,b)=>b[1]-a[1]);
}
function summaryBars(elId,items,total,colorIndex,limit=8){
 const el=document.getElementById(elId);
 if(!items.length){el.innerHTML='<div class="empty">No cost data available.</div>';return}
 const top=items.slice(0,limit),mx=top[0][1]||1;
 el.innerHTML=top.map(([name,v])=>`<div class="sum-row drill-link" data-drill="${esc(name)}">
   <div class="name" title="${esc(name)}">${esc(cut(name,48))}</div><div class="amt">${fmt(v)}</div><div class="sub" style="text-align:right">${pct(total?v/total:0)}</div>
   <div class="bar" style="grid-column:1/-1"><i style="width:${100*v/mx}%;background:${COL(colorIndex)}"></i></div>
  </div>`).join('');
 el.querySelectorAll('.drill-link').forEach(row=>row.onclick=()=>{
  const value=row.dataset.drill;
  if(elId==='subList') showDrill(`Subscription: ${value}`,r=>r.sub===value);
  if(elId==='serviceList') showDrill(`Service: ${value}`,r=>r.service===value);
  if(elId==='resourceList') showDrill(`Resource: ${value.split(' · ')[0]}`,r=>r.res===value.split(' · ')[0]);
 });
}
function showDrill(title,filter){
 const rows=(window._costRows||[]).filter(filter).sort((a,b)=>b.cost-a.cost),total=rows.reduce((a,r)=>a+r.cost,0),body=document.getElementById('drillBody');
 window._drill={title,rows,sort:'cost',dir:-1,page:1};
 document.getElementById('drillTitle').textContent=title;document.getElementById('drillTotal').textContent=fmt(total);document.getElementById('drillMeta').textContent=`${rows.length.toLocaleString()} cost lines · Click a column heading to sort.`;
 renderDrillTable();renderDrillGraphs();
 showTab('drill');
}
function renderDrillTable(){const d=window._drill;if(!d)return;const rows=[...d.rows].sort((a,b)=>{const av=a[d.sort]??'',bv=b[d.sort]??'';return(typeof av==='number'?av-bv:String(av).localeCompare(String(bv)))*d.dir}),pages=Math.max(1,Math.ceil(rows.length/25));d.page=Math.min(d.page,pages);const shown=rows.slice((d.page-1)*25,d.page*25);document.getElementById('drillBody').innerHTML=shown.length?shown.map((r,i)=>`<tr style="animation-delay:${Math.min(i*.018,.35)}s"><td>${esc(sd(r.date))}</td><td>${esc(r.sub)}</td><td>${esc(r.rg)}</td><td>${esc(r.res)}</td><td>${esc(r.service||'—')}</td><td>${esc(r.comp||'—')}</td><td>${esc(r.loc||'—')}</td><td class="num"><b>${fmt(r.cost)}</b></td></tr>`).join(''):'<tr><td colspan="8" class="empty">No matching cost data.</td></tr>';document.getElementById('pageInfo').textContent=`Page ${d.page} of ${pages}`;document.getElementById('prevPage').disabled=d.page===1;document.getElementById('nextPage').disabled=d.page===pages}
function renderDrillGraphs(){const rows=window._drill?.rows||[],groups=new Map();rows.forEach(r=>{const k=r.comp||r.service||'(unassigned)';groups.set(k,(groups.get(k)||0)+r.cost)});const top=[...groups.entries()].sort((a,b)=>b[1]-a[1]).slice(0,10),mx=top[0]?.[1]||1,svg=document.getElementById('drillChart');document.getElementById('drillChartTitle').textContent=window._drill?.title.startsWith('Service:')?'Cost by component':'Cost by item';svg.innerHTML=top.map(([k,v],i)=>{const y=24+i*22,w=650*v/mx;return`<text x="0" y="${y+11}">${esc(cut(k,28))}</text><rect class="bar" x="150" y="${y}" width="${w}" height="14" rx="7"/><text x="${160+w}" y="${y+11}">${fmt(v)}</text>`}).join('');const by=new Map();rows.forEach(r=>by.set(r.date,(by.get(r.date)||0)+r.cost));const ds=[...by.keys()].sort(),vs=ds.map(x=>by.get(x)),daily=document.getElementById('drillDaily');if(vs.length<2){daily.innerHTML='<text x="12" y="30">Not enough dated data.</text>';return}const W=420,H=230,mx2=Math.max(...vs),pts=vs.map((v,i)=>`${12+i*(W-24)/(vs.length-1)},${H-30-(H-50)*v/mx2}`).join(' ');daily.innerHTML=`<polyline points="${pts}" fill="none" stroke="var(--c1)" stroke-width="3"/><text x="12" y="220">${sd(ds[0])}</text><text x="408" y="220" text-anchor="end">${sd(ds.at(-1))}</text>`}
function exportDrillCSV(){const rows=window._drill?.rows||[],head=['Date','Subscription','Resource group','Resource','Service','Component','Location','Cost'],csv=[head,...rows.map(r=>[r.date,r.sub,r.rg,r.res,r.service,r.comp,r.loc,r.cost])].map(row=>row.map(v=>`"${String(v??'').replaceAll('"','""')}"`).join(',')).join('\r\n'),a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='finops-drill-through.csv';a.click();URL.revokeObjectURL(a.href)}
 document.querySelectorAll('.cost-table th[data-sort]').forEach(th=>th.onclick=()=>{const d=window._drill;if(d.sort===th.dataset.sort)d.dir*=-1;else{d.sort=th.dataset.sort;d.dir=1}d.page=1;renderDrillTable()});document.getElementById('prevPage').onclick=()=>{if(window._drill.page>1){window._drill.page--;renderDrillTable()}};document.getElementById('nextPage').onclick=()=>{window._drill.page++;renderDrillTable()};
function summaryTrend(rows){
 const by=new Map();rows.forEach(r=>by.set(r.date,(by.get(r.date)||0)+r.cost));
 const ds=[...by.keys()].sort(), vs=ds.map(d=>by.get(d)), el=document.getElementById('summaryTrend');
 if(vs.length<2){el.innerHTML='<text class="cst" x="20" y="40">Not enough dated cost data for a trend.</text>';return}
 const W=760,H=230,pad={l:42,r:12,t:18,b:34},mx=Math.max(...vs,1e-9),min=Math.min(...vs);
 const X=i=>pad.l+i*(W-pad.l-pad.r)/(vs.length-1),Y=v=>pad.t+(H-pad.t-pad.b)*(1-v/mx);
 const pts=vs.map((v,i)=>`${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join('L');
 const area=`M${X(0)} ${H-pad.b}L${pts}L${X(vs.length-1)} ${H-pad.b}Z`;
 const ticks=[0,.5,1].map(t=>{const y=pad.t+(H-pad.t-pad.b)*t;return `<line x1="${pad.l}" x2="${W-pad.r}" y1="${y}" y2="${y}" stroke="var(--line)"/><text class="cst" x="${pad.l-7}" y="${y+4}" style="text-anchor:end">${fmt(mx*(1-t))}</text>`}).join('');
 el.innerHTML=`${ticks}<path d="${area}" fill="var(--glow)"/><path d="M${pts}" fill="none" stroke="${COL(0)}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>
 <line class="hover-line" x1="0" x2="0" y1="${pad.t}" y2="${H-pad.b}"/><circle class="hover-dot" r="5" cx="0" cy="0"/><text class="hover-label" x="0" y="${pad.t-4}" text-anchor="middle"></text><rect class="hit-area" x="${pad.l}" y="${pad.t}" width="${W-pad.l-pad.r}" height="${H-pad.t-pad.b}"/>
 <text class="cst" x="${pad.l}" y="${H-10}" style="text-anchor:start">${sd(ds[0])}</text><text class="cst" x="${W-pad.r}" y="${H-10}" style="text-anchor:end">${sd(ds[ds.length-1])}</text>`;
 const hit=el.querySelector('.hit-area'),line=el.querySelector('.hover-line'),dot=el.querySelector('.hover-dot'),label=el.querySelector('.hover-label');
 const hide=()=>{line.style.opacity=dot.style.opacity=label.style.opacity=0};
 hit.onpointermove=e=>{const b=hit.getBoundingClientRect(),i=Math.max(0,Math.min(vs.length-1,Math.round(((e.clientX-b.left)/b.width)*(vs.length-1)))),x=X(i),y=Y(vs[i]);line.setAttribute('x1',x);line.setAttribute('x2',x);dot.setAttribute('cx',x);dot.setAttribute('cy',y);label.setAttribute('x',x);label.textContent=`${sd(ds[i])} · ${fmt(vs[i])}`;line.style.opacity=dot.style.opacity=label.style.opacity=1};
 hit.onclick=e=>{const b=hit.getBoundingClientRect(),i=Math.max(0,Math.min(vs.length-1,Math.round(((e.clientX-b.left)/b.width)*(vs.length-1))));showDrill(`Daily cost: ${sd(ds[i])}`,r=>r.date===ds[i])};
 hit.onpointerleave=hide;
}
function renderSummary(){
 const rows=window._costRows||[];
 if(!rows.length)return;
 const total=rows.reduce((a,r)=>a+r.cost,0), ds=[...new Set(rows.map(r=>r.date).filter(Boolean))].sort();
 const byDay=aggregateRows(rows,'date'), peak=byDay[0];
 document.getElementById('mTotal').textContent=fmt(total);
 document.getElementById('mPeriod').textContent=ds.length?`${sd(ds[0])} – ${sd(ds[ds.length-1])}`:'Loaded cost period';
 document.getElementById('mAvg').textContent=fmt(ds.length?total/ds.length:total);
 document.getElementById('mDays').textContent=ds.length?`${ds.length} days of cost data`:'No dated data';
 document.getElementById('mPeak').textContent=peak?fmt(peak[1]):'—';
 document.getElementById('mPeakDate').textContent=peak?sd(peak[0]):'—';
 document.getElementById('mSubs').textContent=new Set(rows.map(r=>r.sub).filter(Boolean)).size;
 summaryTrend(rows);
 summaryBars('subList',aggregateRows(rows,'sub'),total,1);
 summaryBars('serviceList',aggregateRows(rows,'service'),total,2);
 const rm=new Map();rows.forEach(r=>{const k=r.res||'(unassigned)';const o=rm.get(k)||{cost:0,service:r.service||''};o.cost+=r.cost;rm.set(k,o)});
 summaryBars('resourceList',[...rm.entries()].sort((a,b)=>b[1].cost-a[1].cost).map(([k,o])=>[`${k}${o.service?' · '+o.service:''}`,o.cost]),total,3);
}

function load(rows,label){window._costRows=rows;if(label==='Sample data'){window._outlierRows=makeSampleOutliers(rows);window._recommendationRows=makeSampleRecommendations(rows)}root=build(rows);initView();document.getElementById('src').textContent=label+' · '+rows.length.toLocaleString()+' cost lines · '+fmt(root.cost);render();if(document.getElementById('viewSummary').classList.contains('active'))renderSummary()}
function initView(){const a=root.children[0],b=a&&a.children[0],c=b&&b.children[0];exp=new Set([root,a,b,c].filter(Boolean));all=new Set();sel=c||root}

// -----------------------------------------------------------------------------
// Interactive hierarchy renderer
// -----------------------------------------------------------------------------
// visibleIds lets only newly exposed nodes receive the fade-in animation.
const svg=document.getElementById('svg'),RH=40,TOP=48,X0=30,CW=240,W=1230;
let exp=new Set(),all=new Set(),LAY=[],LINK=[],visibleIds=new Set();
const rad=n=>(n.level>=3?12:5)+(n.level>=3?7:9)*Math.sqrt(n.cost/(LM[n.level]||1));
const sd=d=>d?new Date(d+'T00:00:00Z').toLocaleDateString('en-GB',{day:'numeric',month:'short',timeZone:'UTC'}):'—';
function layout(){let row=0;LAY=[];LINK=[];
 const go=n=>{const o={n,x:X0+n.level*CW};LAY.push(o);const ks=[];
  if(exp.has(n)&&n.children.length){const lim=all.has(n)?1e9:15;
   n.children.slice(0,lim).forEach(c=>ks.push(go(c)));
   if(n.children.length>lim){const m={more:n.children.length-lim,p:n,x:X0+(n.level+1)*CW,y:TOP+row*RH};row++;LAY.push(m);ks.push(m)}}
  o.y=ks.length?(ks[0].y+ks[ks.length-1].y)/2:TOP+(row++)*RH;
  ks.forEach(k=>LINK.push([o,k]));return o};
 go(root);return TOP+row*RH}
function render(){const H=layout();svg.setAttribute('viewBox',`0 0 ${W} ${H+10}`);
 const wasVisible=visibleIds,nowVisible=new Set(LAY.filter(o=>o.n).map(o=>o.n.id));
 const P=new Set();for(let n=sel;n;n=n.parent)P.add(n);let h='';
 TYPES.forEach((t,i)=>h+=`<circle cx="${X0+i*CW}" cy="18" r="5" fill="${COL(i)}"/><text class="cst" x="${X0+i*CW+12}" y="22" style="text-anchor:start;font-weight:700;letter-spacing:.06em;text-transform:uppercase;font-size:10px">${t}</text>`);
 LINK.forEach(([a,b])=>{const ra=rad(a.n),rb=b.n?rad(b.n):6,x1=a.x+ra,x2=b.x-rb,m=(x1+x2)/2,on=b.n&&P.has(a.n)&&P.has(b.n),alert=hierarchyMode==='outliers'&&b.n&&hasOutlier(b.n),recommendation=hierarchyMode==='recommendations'&&b.n&&hasRecommendation(b.n),highlight=alert||recommendation;const w=b.n?1+5*b.n.cost/a.n.cost:1;h+=`<path class="${alert?'outlier-arm':recommendation?'recommendation-arm':''}" d="M${x1} ${a.y}C${m} ${a.y},${m} ${b.y},${x2} ${b.y}" fill="none" stroke="${alert?'#f59e0b':recommendation?'#10b981':COL(a.n.level)}" stroke-width="${highlight?w+1:w}" stroke-linecap="round" opacity="${on?.95:.3}"/>`});
 LAY.forEach((o,i)=>{
  if(!o.n){h+=`<g class="node" data-more="${o.p.id}"><circle cx="${o.x}" cy="${o.y}" r="6" fill="none" stroke="var(--mut)" stroke-dasharray="3 2"/><text class="lbl" x="${o.x+14}" y="${o.y+4}" style="text-anchor:start;fill:var(--mut)">+${o.more} more</text></g>`;return}
  const n=o.n,r=rad(n),c=COL(n.level),on=n===sel,has=n.children.length,open=exp.has(n),lv=n.level>=3;
  h+=`<g class="node${!wasVisible.has(n.id)?' fade':''}${on?' selected':''}" data-id="${n.id}" style="animation-delay:${Math.min(i*.025,.3)}s;--ripple-start:${r+6}px;--ripple-end:${r+18}px"><circle cx="${o.x}" cy="${o.y}" r="${r+6}" fill="${c}" opacity="${on?.16:0}"/>${on?`<circle class="ripple" cx="${o.x}" cy="${o.y}" r="${r+6}" stroke="${c}" stroke-width="2"/>`:''}
  <circle class="b" cx="${o.x}" cy="${o.y}" r="${r}" fill="${lv||open||!has?c:'var(--card)'}" stroke="${c}" stroke-width="${on?4:2.5}"/>
  ${n.level>=1?`<use href="#i-${n.ic||'def'}" x="${o.x-r*.62}" y="${o.y-r*.62}" width="${r*1.24}" height="${r*1.24}" style="color:${lv?'#fff':c}"/>`:''}
  ${has&&!open?(lv?`<circle cx="${o.x+r*.8}" cy="${o.y-r*.8}" r="6" fill="var(--card)" stroke="${c}" stroke-width="1.5"/><text class="cst" x="${o.x+r*.8}" y="${o.y-r*.8+3.5}" style="fill:${c};font-weight:700">+</text>`:`<text x="${o.x}" y="${o.y+4}" class="cst" style="fill:${c};font-weight:700;font-size:12px">+</text>`):''}
  <text class="lbl" x="${o.x+r+9}" y="${o.y-2}" style="text-anchor:start;${on?'':'font-weight:500'}">${esc(cut(n.name,22))}</text>
  <text class="cst" x="${o.x+r+9}" y="${o.y+11}" style="text-anchor:start">${fmt(n.cost)}${has?' · '+n.children.length:''}</text></g>`});
 svg.innerHTML=h;visibleIds=nowVisible;crumbs();panel()}
function crumbs(){const ch=[];for(let n=sel;n;n=n.parent)ch.unshift(n);const el=document.getElementById('crumbs');el.innerHTML='';
 ch.forEach((n,i)=>{if(i)el.append('›');const b=document.createElement(n===sel?'b':'button');b.textContent=cut(n.name,28);if(n!==sel)b.onclick=()=>pick(n);el.append(b)})}
function pick(n){for(let p=n.parent;p;p=p.parent)exp.add(p);if(n.children.length)exp.add(n);sel=n;render()}
function hasOutlier(n){const rows=window._outlierRows||[];if(!rows.length)return false;if(n.level===3)return rows.some(r=>String(r.ResourceName||r.res||'').split('/').pop()===n.name&&(r.isAnomaly===true||String(r.isAnomaly).toLowerCase()==='true'));return n.children?.some(hasOutlier)||false}
function hasRecommendation(n){const rows=window._recommendationRows||[];if(!rows.length)return false;if(n.level===3)return rows.some(r=>String(r.ResourceName||r.res||'').split('/').pop()===n.name);return n.children?.some(hasRecommendation)||false}
svg.addEventListener('click',e=>{const g=e.target.closest('.node');if(!g)return;
 if(g.dataset.more){all.add(byId[g.dataset.more]);render();return}
 const n=byId[g.dataset.id];
 if(n===sel&&n.level&&n.children.length&&exp.has(n)){exp.delete(n);render()}else pick(n)});
function reset(){initView();render()}
function chart(n){const N=DAYS.length;if(N<2)return'';const mx=Math.max(...n.ts,1e-9),c=COL(n.level),X=i=>8+i*284/(N-1),Y=v=>104-90*v/mx;
 const pts=[...n.ts].map((v,i)=>`${X(i).toFixed(1)} ${Y(v).toFixed(1)}`);
 const anomalyDots=hierarchyMode==='outliers'?(window._outlierRows||[]).filter(r=>String(r.ResourceName||r.res||'').split('/').pop()===n.name&&(r.isAnomaly===true||String(r.isAnomaly).toLowerCase()==='true')).map(r=>{const i=DAYS.indexOf(String(r.ChargePeriodStart||r.date).slice(0,10));if(i<0)return'';return`<circle class="outlier-dot" cx="${X(i)}" cy="${Y(n.ts[i])}" r="4"/>`}).join(''):'';
 return `<div class="sub" style="margin:14px 0 2px">Daily cost</div><svg id="ch" viewBox="0 0 300 130" style="width:100%;display:block;touch-action:none"><defs><linearGradient id="gr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c}" stop-opacity=".35"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></linearGradient></defs>
 <path d="M${pts.join('L')}L${X(N-1)} 104L8 104Z" fill="url(#gr)"/><path d="M${pts.join('L')}" fill="none" stroke="${c}" stroke-width="2" stroke-linejoin="round"/>${anomalyDots}
 <line id="cl" y1="8" y2="104" stroke="var(--mut)" stroke-dasharray="3 3" opacity="0"/><circle id="cd" r="4" fill="${c}" stroke="var(--card)" stroke-width="2" opacity="0"/>
 <text class="cst" x="8" y="124" style="text-anchor:start">${sd(DAYS[0])}</text><text class="cst" x="292" y="124" style="text-anchor:end">${sd(DAYS[N-1])}</text><text id="ct" class="cst" x="150" y="124" style="fill:var(--ink);font-weight:600"></text></svg>`}
function panel(){
 const n=sel,p=n.parent,c=COL(n.level),list=n.children.slice(0,15),N=DAYS.length,recommendations=(window._recommendationRows||[]).filter(r=>String(r.ResourceName||r.res||'').split('/').pop()===n.name);
 const sv=Object.entries(n.services).sort((a,b)=>b[1]-a[1])[0],mx=Math.max(...n.ts),pk=n.ts.indexOf(mx);
 const ic=(k,col,z)=>k?`<svg width="${z}" height="${z}" style="color:${col};vertical-align:-3px;margin-right:6px"><use href="#i-${k}"/></svg>`:'';
 let h=`<span class="pill" style="background:${c}">${TYPES[n.level]}</span><h2>${ic(n.ic,c,20)}${esc(n.name)}</h2><div class="big">${fmt(n.cost)}</div>${chart(n)}
 <div class="kv"><div><small>Share of ${p?TYPES[p.level].toLowerCase():'total'}</small><b>${p?pct(n.cost/p.cost):'100%'}</b></div>
 <div><small>${n.children.length?'Child '+TYPES[n.level+1].toLowerCase()+'s':'Top service'}</small><b>${n.children.length||(sv?esc(cut(sv[0],14)):'—')}</b></div>
 ${n.level>=3?`<div><small>Location</small><b>${esc(n.loc||p.loc||'—')}</b></div><div><small>${n.level==3?'Resource group':'Resource'}</small><b>${esc(cut(p.name,14))}</b></div>`:sv?`<div><small>Top service</small><b>${esc(cut(sv[0],14))}</b></div><div><small>Service spend</small><b>${fmt(sv[1])}</b></div>`:''}
 ${N>1?`<div><small>Daily average</small><b>${fmt(n.cost/N)}</b></div><div><small>Peak day</small><b>${fmt(mx)} <span class="sub">${sd(DAYS[pk])}</span></b></div>`:''}</div>`;
 recommendations.forEach(r=>h+=`<div class="recommendation-box"><div class="sub">${esc(r.Category||'Cost optimization')} · ${esc(r.Servicename||'')}</div><p>${esc(r.Description||'—')}</p><div class="recommendation-savings"><span>Potential minimum<b>${fmt(r.PotentialMin||0)}</b></span><span>Potential maximum<b>${fmt(r.PotentialMax||0)}</b></span></div></div>`);
 if(list.length)h+=`<div class="sub" style="margin-bottom:4px">${n.level==3?'Cost breakdown by component':'Largest '+TYPES[n.level+1].toLowerCase()+'s'}</div>`;
 const m=Math.max(...list.map(x=>x.cost),1);
 list.forEach((x,i)=>h+=`<button class="row" data-k="${i}"><div class="top"><span class="nm">${ic(x.ic,COL(x.level),14)}${esc(x.name)}</span><b>${fmt(x.cost)}</b></div><div class="bar"><i style="width:${100*x.cost/m}%;background:${COL(x.level)}"></i></div></button>`);
 const el=document.getElementById('panel');el.classList.remove('panel-in');void el.offsetWidth;el.innerHTML=h;el.classList.add('panel-in');
 el.querySelectorAll('.row').forEach(b=>b.onclick=()=>pick(list[+b.dataset.k]));
 const ch=document.getElementById('ch');if(ch){const G=id=>document.getElementById(id);
  ch.onpointermove=e=>{const b=ch.getBoundingClientRect(),i=Math.max(0,Math.min(N-1,Math.round(((e.clientX-b.left)/b.width*300-8)/284*(N-1)))),x=8+i*284/(N-1),y=104-90*n.ts[i]/Math.max(mx,1e-9);
   G('cl').setAttribute('x1',x);G('cl').setAttribute('x2',x);G('cl').setAttribute('opacity',1);G('cd').setAttribute('cx',x);G('cd').setAttribute('cy',y);G('cd').setAttribute('opacity',1);G('ct').textContent=sd(DAYS[i])+' · '+fmt(n.ts[i])};
  ch.onpointerleave=()=>{['cl','cd'].forEach(k=>G(k).setAttribute('opacity',0));G('ct').textContent=''}}
}
document.getElementById('f').onchange=async e=>{const f=e.target.files[0];if(!f)return;
 try{load(fromCSV(await f.text()),f.name)}catch(x){alert('Could not read CSV: '+x.message)}};
load(sample(),'Sample data');
