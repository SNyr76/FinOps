'use client';
import { useState } from 'react';
import { Cloud,FileUp,RotateCcw,Settings2 } from 'lucide-react';
import { HierarchyExplorer } from '../components/hierarchy-explorer';
export default function Page() {
  const [tab,setTab]=useState('Cost Hierarchy');
  const [resetKey,setResetKey]=useState(0);
  return <div className="flex min-h-screen bg-[#18212b] text-[#edf2f7]">
    <aside className="hidden w-40 shrink-0 border-r border-[#354554] bg-[#202d3a] p-3 md:block"><div className="mb-8 flex items-center gap-2 px-2"><Cloud size={16} className="text-[#4f78a0]" /><span className="text-xs font-semibold">Atlas</span></div><nav className="flex flex-col gap-1">{['Cost Hierarchy'].map(item => <button key={item} onClick={() => setTab(item)} className={`border-l-2 px-3 py-3 text-left text-xs font-semibold ${tab===item? 'border-[#f59e0b] bg-[#18212b] text-[#edf2f7]':'border-transparent text-[#aab7c5]'}`}>{item}</button>)}</nav></aside>
    <section className="min-w-0 flex-1"><header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#354554] bg-[#202d3a] px-6 py-4"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded border border-dashed border-[#4f78a0] bg-[#18212b] text-[#4f78a0]"><Cloud size={19} /></div><div><h1 className="m-0 text-xl font-semibold tracking-tight">FinOps <span className="text-[#4f78a0]">Atlas</span> <span className="font-normal text-[#aab7c5]">· Azure</span></h1><div className="text-xs text-[#aab7c5]">Sample cost hierarchy · 60 days · USD</div></div></div><div className="flex items-center gap-2"><button onClick={() => setResetKey(key => key+1)} className="flex items-center gap-2 rounded-md border border-[#354554] bg-[#202d3a] px-3 py-2 text-xs text-[#edf2f7]"><RotateCcw size={14} /> Reset view</button><button className="flex items-center gap-2 rounded-md border border-[#354554] bg-[#202d3a] px-3 py-2 text-xs text-[#edf2f7]"><FileUp size={14} /> Load cost CSV</button><button className="rounded-md p-2 text-[#aab7c5]"><Settings2 size={17} /></button></div></header><main className="mx-auto max-w-[1700px] p-3 lg:p-5"><HierarchyExplorer key={resetKey} /></main></section>
  </div>;
}
