import React, { useEffect, useState } from 'react'
import api from '../utils/api'

export default function AIChatWidget(){
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [items, setItems] = useState([]) // {id, role, text, at}
  const [loading, setLoading] = useState(false)

  useEffect(()=>{
    try{
      const data = JSON.parse(localStorage.getItem('ai.widget.history')||'[]')
      setItems(Array.isArray(data)? data: [])
    }catch{}
  },[])

  function push(role, text){
    const it = { id: Date.now()+Math.random(), role, text, at: new Date().toISOString() }
    const next = [...items, it].slice(-50)
    setItems(next)
    localStorage.setItem('ai.widget.history', JSON.stringify(next))
  }

  async function send(){
    const q = input.trim()
    if(!q || loading) return
    setInput('')
    push('user', q)
    setLoading(true)
    try{
      const res = await api.post('ai/ask/', { question: q })
      const a = res.data?.answer || 'No answer'
      push('assistant', a)
    }catch(err){
      push('assistant', 'I could not reach the AI service. Please try again soon.')
    }finally{
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Toggle button */}
      {!open && (
        <button onClick={()=>setOpen(true)} className="rounded-full shadow-lg bg-violet-600 hover:bg-violet-700 text-white w-14 h-14 flex items-center justify-center">
          <span className="text-xl">💬</span>
        </button>
      )}

      {open && (
        <div className="w-80 h-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl flex flex-col overflow-hidden">
          <div className="px-3 py-2 bg-violet-600 text-white flex items-center justify-between">
            <div className="font-semibold">AI Assistant</div>
            <button onClick={()=>setOpen(false)} className="text-white/80 hover:text-white">✕</button>
          </div>

          <div className="flex-1 p-3 space-y-2 overflow-auto">
            {items.length === 0 && (
              <div className="text-sm text-slate-500">Ask anything about your course. I can explain topics, summarize lessons, and suggest next steps.</div>
            )}
            {items.map(it => (
              <div key={it.id} className={`text-sm ${it.role==='user' ? 'text-right' : ''}`}>
                <div className={`inline-block px-3 py-2 rounded-lg max-w-[85%] whitespace-pre-wrap ${it.role==='user' ? 'bg-violet-100 text-slate-800' : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100'}`}>
                  {it.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="text-sm text-slate-500">Thinking…</div>
            )}
          </div>

          <div className="p-2 border-t border-slate-200 dark:border-slate-700 flex items-center gap-2">
            <input className="flex-1 input" placeholder="Type a question" value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter') send() }} />
            <button onClick={send} disabled={loading} className="btn-primary px-3 py-2">Send</button>
          </div>
        </div>
      )}
    </div>
  )
}
