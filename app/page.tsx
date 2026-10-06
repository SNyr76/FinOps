'use client'

import { useState } from 'react'
import { Cloud, FileUp, RotateCcw, Settings2 } from 'lucide-react'
import { HierarchyExplorer } from '../components/hierarchy-explorer'

export default function Page() {
  const [tab, setTab] = useState('Cost Hierarchy')
  return <div className="min-h-screen bg-[#18212b] text-[#edf2f7]">
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#354554] bg-[#202d3a] px-6 py-4">
      <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded border border-dashed border-[#4f78a0] bg-[#18212b] text-[#4f78a0]"><Cloud size={19} /></div><div><h1 className="m-0 text-xl font-semibold tracking-tight">FinOps <span className="text-[#4f78a0]">Atlas</span> <span className="font-normal text-[#aab7c5]">· Azure</span></h1><div className="text-xs text-[#aab7c5]">Sample cost hierarchy · 60 days · USD</div></div></div>
      <div className="flex items-center gap-2"><button className="flex items-center gap-2 rounded-md border border-[#354554] bg-[#202d3a] px-3 py-2 text-xs text-[#edf2f7]"><RotateCcw size={14}/> Reset view</button><button className="flex items-center gap-2 rounded-md border border-[#354554] bg-[#202d3a] px-3 py-2 text-xs text-[#edf2f7]"><FileUp size={14}/> Load cost CSV</button><button className="rounded-md p-2 text-[#aab7c5] hover:bg-[#18212b]"><Settings2 size={17}/></button></div>
    </header>
    <nav className="flex gap-1 border-b border-[#354554] bg-[#202d3a] px-6" aria-label="FinOps views">{['Cost Hierarchy'].map(item => <button key={item} onClick={() => setTab(item)} className={`border-b-2 px-4 py-3 text-xs font-semibold ${tab === item ? 'border-[#4f78a0] text-[#edf2f7]' : 'border-transparent text-[#aab7c5]'}`}>{item}</button>)}</nav>
    <main className="mx-auto max-w-[1700px] p-3 lg:p-5"><HierarchyExplorer /></main>
  </div>
}
