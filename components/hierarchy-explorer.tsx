'use client';
import { useMemo,useState } from 'react';
import { Boxes,ChevronDown,CircleDollarSign,Database,Network,Server } from 'lucide-react';
type Node={
  id: string;
  name: string;
  level: string;
  cost: number;
  icon?: 'server'|'db'|'network';
  children?: Node[];
};
const data: Node={
  id: 'tenant',name: 'contoso.onmicrosoft.com',level: 'Tenant',cost: 103650,children: [
    { id: 'platform',name: 'Prod-Platform',level: 'Subscription',cost: 44280,children: [{ id: 'aks-rg',name: 'rg-aks-prod',level: 'Resource group',cost: 18640,children: [{ id: 'aks',name: 'aks-platform-prod-01',level: 'Resource',cost: 14220,icon: 'server',children: [{ id: 'vm',name: 'Node pool VMs',level: 'Component',cost: 9940 },{ id: 'disk',name: 'Managed disks',level: 'Component',cost: 2580 },{ id: 'ip',name: 'Public IP',level: 'Component',cost: 740 },{ id: 'nic',name: 'Network interface',level: 'Component',cost: 1020 }] },{ id: 'platform-disk',name: 'disk-platform-prod-01',level: 'Resource',cost: 2200,icon: 'db',children: [{ id: 'platform-disk-cap',name: 'Data disk',level: 'Component',cost: 2200 }] },{ id: 'platform-ip',name: 'pip-platform-prod-01',level: 'Resource',cost: 800,icon: 'network',children: [{ id: 'platform-ip-use',name: 'Public IP',level: 'Component',cost: 800 }] },{ id: 'platform-st',name: 'st-platform-prod-01',level: 'Resource',cost: 1420,icon: 'db',children: [{ id: 'platform-st-blob',name: 'Blob storage',level: 'Component',cost: 1420 }] }] }] },
    { id: 'customer',name: 'Prod-Customer',level: 'Subscription',cost: 31840,children: [{ id: 'web-rg',name: 'rg-web-frontend',level: 'Resource group',cost: 19420,children: [{ id: 'app',name: 'app-customer-prod-01',level: 'Resource',cost: 19420,icon: 'server',children: [{ id: 'compute',name: 'Plan compute',level: 'Component',cost: 15536 },{ id: 'bandwidth',name: 'Bandwidth',level: 'Component',cost: 3884 },{ id: 'ssl',name: 'SSL / domains',level: 'Component',cost: 840 },{ id: 'logs',name: 'Log Analytics',level: 'Component',cost: 1260 }] },{ id: 'sql-customer',name: 'sql-customer-prod-01',level: 'Resource',cost: 7220,icon: 'db',children: [{ id: 'sql-vcore',name: 'vCore compute',level: 'Component',cost: 5054 },{ id: 'sql-storage',name: 'Data storage',level: 'Component',cost: 2166 }] }] }] },
    { id: 'shared',name: 'Shared-Services',level: 'Subscription',cost: 18410,children: [{ id: 'monitoring',name: 'rg-monitoring',level: 'Resource group',cost: 18410,children: [{ id: 'law',name: 'law-platform-prod',level: 'Resource',cost: 18410,icon: 'network',children: [{ id: 'ingest',name: 'Data ingestion',level: 'Component',cost: 15648 },{ id: 'retention',name: 'Retention',level: 'Component',cost: 2762 },{ id: 'backup',name: 'Backup storage',level: 'Component',cost: 1840 },{ id: 'egress',name: 'Network egress',level: 'Component',cost: 920 }] },{ id: 'kv-shared',name: 'kv-platform-prod',level: 'Resource',cost: 4620,icon: 'db',children: [{ id: 'kv-ops',name: 'Key operations',level: 'Component',cost: 3200 },{ id: 'kv-storage',name: 'Secret storage',level: 'Component',cost: 1420 }] },{ id: 'pip-shared',name: 'pip-shared-prod-01',level: 'Resource',cost: 1800,icon: 'network',children: [{ id: 'pip-ip',name: 'Public IP',level: 'Component',cost: 1800 }] }] }] },
  ]
};
const recommendationIds=new Set(['aks','sql-customer','kv-shared']);
const outlierIds=new Set(['app','platform-disk','pip-shared']);
const hasSignal=(node: Node,mode: string): boolean => { const ids=mode==='Recommendations'? recommendationIds:outlierIds; return node.level==='Resource'? ids.has(node.id):Boolean(node.children?.some(child => hasSignal(child,mode))); };
const colors: Record<string,string>={ Tenant: '#315b7d',Subscription: '#4f78a0','Resource group': '#6f8da8',Resource: '#f59e0b',Component: '#8b6f86' };
const money=(n: number) => '$'+n.toLocaleString('en-US',{ maximumFractionDigits: 0 });
function NodeIcon({ type,name='' }: {
  type?: Node['icon'];
  name?: string;
}) {
  const common={ fill: 'none',stroke: 'currentColor',strokeWidth: 1.8,strokeLinecap: 'round' as const,strokeLinejoin: 'round' as const };
  if(/disk/i.test(name))
    return <svg viewBox="0 0 24 24" width="15" height="15" {...common}><rect x="3" y="7" width="18" height="10" rx="2" /><path d="M3 13h18M7 15.3h.01" /></svg>;
  if(/ip|address/i.test(name))
    return <svg viewBox="0 0 24 24" width="15" height="15" {...common}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3.5 3.5 3.5 14.5 0 18M12 3c-3.5 3.5-3.5 14.5 0 18" /></svg>;
  if(/storage|blob|retention/i.test(name))
    return <svg viewBox="0 0 24 24" width="15" height="15" {...common}><rect x="3" y="4" width="18" height="6" rx="1.5" /><rect x="3" y="14" width="18" height="6" rx="1.5" /><path d="M7 7h.01M7 17h.01" /></svg>;
  if(/sql|database|ingestion/i.test(name))
    return <svg viewBox="0 0 24 24" width="15" height="15" {...common}><ellipse cx="12" cy="6" rx="8" ry="3" /><path d="M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" /></svg>;
  if(/network|bandwidth|load balancer/i.test(name))
    return <svg viewBox="0 0 24 24" width="15" height="15" {...common}><rect x="4" y="7" width="16" height="9" rx="1.5" /><path d="M8 16v3M12 16v3M16 16v3M8 11v1M12 11v1M16 11v1" /></svg>;
  if(/compute|vm|node pool|app service|plan/i.test(name))
    return <svg viewBox="0 0 24 24" width="15" height="15" {...common}><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8M12 16v4" /></svg>;
  if(/^rg-|resource group/i.test(name))
    return <svg viewBox="0 0 24 24" width="15" height="15" {...common}><rect x="4" y="5" width="16" height="14" rx="2" /><path d="M8 9h8M8 13h5" /></svg>;
  if(type==='db')
    return <svg viewBox="0 0 24 24" width="15" height="15" {...common}><ellipse cx="12" cy="6" rx="8" ry="3" /><path d="M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" /></svg>;
  if(type==='network')
    return <svg viewBox="0 0 24 24" width="15" height="15" {...common}><path d="M3 12h4l3-7 4 14 3-7h4" /></svg>;
  if(type==='server')
    return <svg viewBox="0 0 24 24" width="15" height="15" {...common}><rect x="3" y="4" width="18" height="7" rx="2" /><rect x="3" y="13" width="18" height="7" rx="2" /><path d="M7 7h.01M7 16h.01M11 7h6M11 16h6" /></svg>;
  return <svg viewBox="0 0 24 24" width="15" height="15" {...common}><rect x="4" y="4" width="16" height="16" rx="3" /><circle cx="12" cy="12" r="2.5" /></svg>;
}
export function HierarchyExplorer() {
  const [expanded,setExpanded]=useState(new Set(['tenant','platform','customer','shared','aks-rg','lake-rg','web-rg','monitoring','aks','lake','app','law']));
  const [selected,setSelected]=useState(data);
  const [mode,setMode]=useState('Normal');
  const [showDaily,setShowDaily]=useState(false);
  const [hoverDay,setHoverDay]=useState<number|null>(null);
  const toggle=(id: string) => setExpanded(current => { const next=new Set(current); next.has(id)? next.delete(id):next.add(id); return next; });
  const layout=useMemo(() => {
    const nodes: {
      node: Node;
      x: number;
      y: number;
    }[]=[]; const links: {
      a: {
        x: number;
        y: number;
      };
      b: {
        x: number;
        y: number;
        node: Node;
      };
    }[]=[]; let row=0; const walk=(node: Node,depth: number): {
      x: number;
      y: number;
      node: Node;
    } => { const item={ node,x: 80+depth*220,y: 0 }; nodes.push(item); const kids=expanded.has(node.id)? (node.children??[]).map(child => walk(child,depth+1)):[]; item.y=kids.length? (kids[0].y+kids[kids.length-1].y)/2:55+row++*64; kids.forEach(child => links.push({ a: item,b: child })); return item; }; walk(data,0); return { nodes,links,height: Math.max(430,row*64+80) };
  },[expanded]);
  const dailyValues=Array.from({ length: 30 },(_,index) => selected.cost/60*(0.78+(Math.sin(index*1.7)+1)*0.045+index*0.006));
  const chartPointY=(index: number) => 62-((Math.sin(index*1.7)+1)*11+index*.55);
  const dateForDay=(index: number) => new Date(Date.UTC(2026,7,8+index)).toLocaleDateString('en-GB',{ day: 'numeric',month: 'short',timeZone: 'UTC' });
  return <div className="grid gap-5" style={{ gridTemplateColumns: 'minmax(0, 1fr) 360px',alignItems: 'stretch' }}><div className="surface overflow-hidden"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-5"><div><div className="eyebrow mb-1">Hierarchy view</div><h2 className="font-semibold">Cost hierarchy</h2><p className="mt-1 text-xs text-muted">Node size and connector weight represent cost.</p></div><div className="flex rounded-lg bg-[#18212b] p-1">{['Normal','Outliers','Recommendations'].map(item => <button key={item} onClick={() => setMode(item)} className={`atlas-mode-button rounded-md px-3 py-1.5 text-xs font-semibold ${mode===item? 'bg-[#354554] text-[#edf2f7] shadow-sm':'text-muted'}`} data-active={mode===item}>{item}</button>)}</div></div><div className="overflow-x-auto bg-[#202d3a] p-4"><svg viewBox={`0 0 1120 ${layout.height}`} className="min-w-[900px] w-full" role="img" aria-label="Interactive cost hierarchy diagram">{layout.links.map(({ a,b }) => <path key={`${b.node.id}-${b.x}`} d={`M${a.x+20} ${a.y} C${(a.x+b.x)/2} ${a.y}, ${(a.x+b.x)/2} ${b.y}, ${b.x-20} ${b.y}`} fill="none" stroke={mode!=='Normal'&&hasSignal(b.node,mode)? (mode==='Outliers'? '#f59e0b':'#10b981'):colors[b.node.level]} strokeOpacity={mode==='Normal'? .5:hasSignal(b.node,mode)? 1:.18} strokeWidth={Math.max(1.5,Math.min(7,b.node.cost/data.cost*7))} className={mode!=='Normal'&&hasSignal(b.node,mode)? 'atlas-arm-highlight':undefined} />)}{layout.nodes.map(({ node,x,y }) => { const open=expanded.has(node.id); const has=Boolean(node.children?.length); const active=selected.id===node.id; const signalPath=node.level==='Resource'||Boolean(node.children?.some(child => child.level==='Resource'||child.children?.some(grandchild => grandchild.level==='Resource'))); const radius=node.level==='Tenant'? 16:node.level==='Subscription'? Math.max(12,Math.min(17,8+Math.sqrt(node.cost)/18)):node.level==='Resource group'? Math.max(10,Math.min(18,7+Math.sqrt(node.cost)/12)):node.level==='Resource'? Math.max(14,Math.min(23,8+Math.sqrt(node.cost)/10)):8; return <g key={node.id} className="atlas-node-reveal cursor-pointer" onClick={() => setSelected(node)}><circle cx={x} cy={y} r={radius+7} fill={colors[node.level]} opacity={active? .16:0} /><circle className={active? 'atlas-node-selected':undefined} cx={x} cy={y} r={radius} fill={open||!has? colors[node.level]:'white'} stroke={colors[node.level]} strokeWidth={active? 4:2.5} />{active&&<circle className="atlas-node-ripple" cx={x} cy={y} r={radius+7} stroke={colors[node.level]} strokeWidth="2" />}{node.level!=='Tenant'&&<g transform={`translate(${x-8} ${y-8})`} className="text-white"><NodeIcon type={node.icon} name={node.name} /></g>}{has&&<g onClick={event => { event.stopPropagation(); toggle(node.id); }}><circle cx={x+radius*.8} cy={y-radius*.8} r="7" fill="white" stroke={colors[node.level]} /><text x={x+radius*.8} y={y-radius*.8+3} textAnchor="middle" fontSize="11" fill={colors[node.level]}>{open? '−':'+'}</text></g>}<text x={x+radius+10} y={y-2} fontSize="12" fontWeight={active? 700:500} fill="#edf2f7">{node.name}</text><text x={x+radius+10} y={y+13} fontSize="11" fill="#aab7c5">{money(node.cost)}{has? ` · ${node.children?.length}`:''}</text></g>; })}</svg></div></div><aside className="surface h-full min-h-full lg:sticky lg:top-5" style={{ padding: 20,background: '#202d3a',borderColor: '#354554' }}><div className="flex items-center gap-2 p-1.5 text-xs font-semibold text-muted"><CircleDollarSign size={16} className="text-[#8b6f86]" />{selected.level}</div><h3 className="mt-3 break-words p-1.5 text-lg font-semibold">{selected.name}</h3><div className="mt-1 text-3xl font-semibold tracking-tight">{money(selected.cost)}</div><div className="mt-1 text-xs text-muted">{Math.round(selected.cost/data.cost*100)}% of tenant cost</div><div className="my-5 border-t border-line" /><div className="mt-4 border-t border-[#354554] p-1.5 pt-4 text-xs text-[#aab7c5]">Daily cost · 30 day view</div><svg viewBox="0 0 300 82" className="mt-2 h-20 w-full" onMouseMove={event => { const rect=event.currentTarget.getBoundingClientRect(); setHoverDay(Math.max(0,Math.min(29,Math.floor((event.clientX-rect.left)/rect.width*30)))); }} onMouseLeave={() => setHoverDay(null)}><defs><linearGradient id="panel-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f59e0b" stopOpacity=".45" /><stop offset="1" stopColor="#f59e0b" stopOpacity="0" /></linearGradient></defs><polygon points={`0,82 ${dailyValues.map((_,index) => `${index*(300/29)},${chartPointY(index)}`).join(' ')} 300,82`} fill="url(#panel-fill)" opacity=".75" /><polyline points={dailyValues.map((_,index) => `${index*(300/29)},${chartPointY(index)}`).join(' ')} fill="none" stroke="#f59e0b" strokeWidth="2.5" />{hoverDay!==null&&<g><line x1={hoverDay*(300/29)} x2={hoverDay*(300/29)} y1="0" y2="82" stroke="#edf2f7" strokeDasharray="3 3" opacity=".7" /><circle cx={hoverDay*(300/29)} cy={chartPointY(hoverDay)} r="4" fill="#f59e0b" stroke="#edf2f7" strokeWidth="2" /><rect x={Math.max(2,Math.min(230,hoverDay*(300/29)-34))} y="2" width="68" height="16" rx="3" fill="#18212b" stroke="#354554" /><text x={Math.max(36,Math.min(264,hoverDay*(300/29)))} y="13" textAnchor="middle" fontSize="9" fill="#edf2f7">{dateForDay(hoverDay)} · {money(dailyValues[hoverDay])}</text></g>}</svg><div className="flex justify-between p-1.5 text-[10px] text-[#aab7c5]"><span>8 Aug</span><span>6 Oct</span></div><div className="my-5 border-t border-line" /><div className="grid grid-cols-2 gap-3 py-2.5"><div className="rounded-lg bg-[#18212b] p-3"><div className="text-[10px] uppercase tracking-wide text-muted">Daily avg</div><div className="mt-1 text-sm font-semibold">{money(selected.cost/60)}</div></div><div className="rounded-lg bg-[#18212b] p-3"><div className="text-[10px] uppercase tracking-wide text-muted">Children</div><div className="mt-1 text-sm font-semibold">{selected.children?.length??0}</div></div></div><div className="mt-8 border-t border-[#354554] pt-5"><div className="mb-3 p-1.5 text-xs font-semibold">Cost composition</div>{selected.children?.map(child => <div key={child.id} className="mb-3"><div className="mb-1 flex justify-between p-2.5 text-[11px]"><span className="flex min-w-0 items-center gap-2 truncate text-[#edf2f7]"><NodeIcon name={child.name} /><span className="truncate">{child.name}</span></span><span className="font-semibold">{money(child.cost)}</span></div><div style={{ height: 6,borderRadius: 999,background: '#18212b',overflow: 'hidden' }}><div style={{ width: `${child.cost/selected.cost*100}%`,background: colors[child.level],height: '100%',borderRadius: 999 }} /></div></div>)}</div>{mode==='Recommendations'&&(selected.level==='Resource'||selected.level==='Component')&&<div className="mt-8 rounded-lg border border-[#10b981]/40 bg-[#10b981]/10" style={{ paddingTop: 10,paddingRight: 5,paddingBottom: 5,paddingLeft: 10 }}><div className="text-[10px] font-semibold uppercase tracking-wider text-[#10b981]">Recommendation</div><div className="mt-1 text-sm font-semibold text-[#edf2f7]">Review utilization and rightsize capacity</div><p className="mt-1 text-xs leading-relaxed text-[#aab7c5]" style={{ paddingRight: 5,paddingBottom: 5 }}>This resource is a candidate for optimization based on sustained daily spend and its current service profile.</p><div className="mt-2 text-xs font-semibold text-[#edf7f1]" style={{ padding: 10 }}>Estimated savings: $680–$1,240 / month</div></div>}<button onClick={() => setShowDaily(value => !value)} className="mt-4 flex items-center gap-1 px-0 py-[15px] text-xs font-semibold text-[#edf2f7]">{showDaily? 'Hide daily detail':'Open daily detail'} <ChevronDown className={showDaily? 'rotate-180':''} size={14} /></button>{showDaily&&<div className="mt-3 max-h-44 overflow-auto rounded-lg border border-[#354554] bg-[#18212b] p-2">{Array.from({ length: 30 },(_,index) => <div key={index} className="flex items-center justify-between border-b border-[#354554] px-2 py-1.5 text-[11px] last:border-0"><span className="text-[#aab7c5]">{dateForDay(index)}</span><b className="text-[#edf2f7]">{money(dailyValues[index])}</b></div>)}</div>}</aside></div>;
}
