import React, {useEffect, useMemo, useState} from 'react'
import api from '../utils/api'

export default function AITutor(){
  const [mode, setMode] = useState('ask'); // 'ask' | 'generate'
  const [q,setQ]=useState('');
  const [ans,setAns]=useState('');
  const [topic, setTopic] = useState('');
  const [gen, setGen] = useState(null); // {title, transcript, video_url}
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const canvasRef = React.useRef(null);
  const [localVideoUrl, setLocalVideoUrl] = useState("");
  const [askHistory, setAskHistory] = useState([]);
  const [genHistory, setGenHistory] = useState([]);
  const [expandTranscript, setExpandTranscript] = useState(false);
  const [copied, setCopied] = useState(false);

  // Load history
  useEffect(()=>{
    try {
      const a = JSON.parse(localStorage.getItem('ai.askHistory')||'[]');
      const g = JSON.parse(localStorage.getItem('ai.genHistory')||'[]');
      setAskHistory(Array.isArray(a)? a: []);
      setGenHistory(Array.isArray(g)? g: []);
    } catch {}
  },[]);

  function pushAsk(q, a){
    const item = { id: Date.now(), q, a, at: new Date().toISOString() };
    const next = [item, ...askHistory].slice(0,10);
    setAskHistory(next);
    localStorage.setItem('ai.askHistory', JSON.stringify(next));
  }
  function pushGen(topic, data){
    const item = { id: Date.now(), topic, data, at: new Date().toISOString() };
    const next = [item, ...genHistory].slice(0,10);
    setGenHistory(next);
    localStorage.setItem('ai.genHistory', JSON.stringify(next));
  }

  const askPresets = useMemo(()=>[
    'Explain closures in simple terms',
    'Summarize React state vs props',
    'Create 5 interview questions on Django REST',
    'Give me a study plan for data structures',
  ],[]);
  const genPresets = useMemo(()=>[
    'React Hooks', 'SQL Joins', 'Docker Basics', 'Transformers 101'
  ],[]);

  const ask = async ()=>{
    if(!q.trim()) return;
    setLoading(true);
    try {
      const res = await api.post('ai/ask/', { question: q });
      const a = res.data.answer || '';
      setAns(a);
      pushAsk(q, a);
    } finally {
      setLoading(false);
    }
  }
  const generate = async ()=>{
    if(!topic.trim()) return;
    setLoading(true);
    try {
      const res = await api.post('ai/generate-lesson/', { topic });
      setGen(res.data);
      pushGen(topic, res.data);
      setExpandTranscript(false);
    } finally {
      setLoading(false);
    }
  }

  // Create a simple slideshow-style video from the transcript on the client
  // This avoids needing ffmpeg on your machine. It produces a WebM you can download.
  async function makeVideoFromTranscript(){
    const transcript = gen?.transcript || "";
    if(!transcript || recording) return;
    setRecording(true);
    try{
      // Prepare canvas
      const width = 1280, height = 720, fps = 30;
      let canvas = canvasRef.current;
      if(!canvas){
        canvas = document.createElement('canvas');
        canvasRef.current = canvas;
      }
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext('2d');

      // Split transcript into slides (by blank lines or bullets)
      const rawSlides = transcript.split(/\n\s*\n|\n-\s+/g).map(s=>s.trim()).filter(Boolean).slice(0,12); // cap ~12 slides
      const slides = rawSlides.length ? rawSlides : [transcript];
      const secondsPerSlide = 3; // linger per slide
      const totalSeconds = slides.length * secondsPerSlide;
      const totalFrames = totalSeconds * fps;

      const stream = canvas.captureStream(fps);
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
      const chunks = [];
      recorder.ondataavailable = e => { if(e.data && e.data.size>0) chunks.push(e.data) };
      const done = new Promise(resolve => { recorder.onstop = resolve; });
      recorder.start();

      // Helper: wrap text to lines
      function wrapLines(text, maxWidth){
        ctx.font = 'bold 40px Inter, system-ui, sans-serif';
        const words = text.split(/\s+/);
        let line = ''; const lines = [];
        for(const w of words){
          const test = line ? line + ' ' + w : w;
          const { width } = ctx.measureText(test);
          if(width > maxWidth && line){ lines.push(line); line = w; }
          else { line = test; }
        }
        if(line) lines.push(line);
        return lines.slice(0,7); // cap lines per slide
      }

      // Render loop
      let frame = 0;
      function drawFrame(){
        const slideIndex = Math.min(slides.length-1, Math.floor(frame / (secondsPerSlide*fps)));
        const text = slides[slideIndex];

        // background
        const grd = ctx.createLinearGradient(0,0,width,height);
        grd.addColorStop(0,'#ede9fe'); // violet-100
        grd.addColorStop(1,'#fff7ed'); // amber-50
        ctx.fillStyle = grd;
        ctx.fillRect(0,0,width,height);

        // heading/title
        ctx.fillStyle = '#0f172a';
        ctx.font = '700 48px Poppins, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText((gen?.title||'Lesson'), width/2, 120);

        // body text
        ctx.textAlign = 'left';
        ctx.font = 'bold 40px Inter, system-ui, sans-serif';
        const lines = wrapLines(text, width - 160);
        ctx.fillStyle = '#334155';
        let y = 220;
        for(const ln of lines){
          ctx.fillText(ln, 80, y);
          y += 56;
        }

        frame++;
        if(frame < totalFrames){
          requestAnimationFrame(drawFrame);
        } else {
          recorder.stop();
        }
      }
      drawFrame();

      await done;
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      setLocalVideoUrl(url);
      // also reflect in gen so the player shows it
      setGen(prev => prev ? ({ ...prev, video_url: url }) : prev);
    } catch(err){
      console.error('Video generation failed', err);
      alert('Video generation failed in the browser. Try a shorter transcript.');
    } finally {
      setRecording(false);
    }
  }

  function copy(text){
    if(!text) return;
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(()=>setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold heading text-slate-900">AI Studio</h1>
            <p className="text-slate-500 mt-1">Ask questions or generate a lesson with transcript and a demo video</p>
          </div>
          
          {/* Tabs */}
          <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm self-start sm:self-auto">
            <button onClick={()=>setMode('ask')} className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${mode==='ask' ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}>Ask Tutor</button>
            <button onClick={()=>setMode('generate')} className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${mode==='generate' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}>Generate Lesson</button>
          </div>
        </div>

        {mode==='ask' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: input */}
            <div className="card p-6 h-fit">
              <label className="block text-sm font-medium text-slate-700 mb-2">Your Question</label>
              <textarea 
                className="input w-full h-40 resize-none p-4 text-base focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all" 
                value={q}  
                onChange={e=>setQ(e.target.value)} 
                placeholder="e.g., Explain how React useEffect works..." 
              />
              
              <div className="mt-4">
                <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Quick Prompts</div>
                <div className="flex flex-wrap gap-2">
                  {askPresets.map((p)=> (
                    <button key={p} onClick={()=>setQ(p)} className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-white hover:border-violet-200 hover:text-violet-700 text-xs transition-all text-left">{p}</button>
                  ))}
                </div>
              </div>
              
              <div className="mt-6 flex gap-3">
                <button disabled={loading} onClick={ask} className="btn-primary flex-1 justify-center">
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      Thinking...
                    </span>
                  ) : 'Ask AI'}
                </button>
                <button onClick={()=>{setQ('');setAns('')}} className="btn-outline px-6">Clear</button>
              </div>
            </div>

            {/* Right: output */}
            <div className="space-y-6">
              {!ans ? (
                <div className="card p-8 text-center border-dashed border-2 border-slate-200 bg-slate-50/50">
                  <div className="text-4xl mb-3">🤖</div>
                  <h3 className="text-lg font-medium text-slate-900">Ready to help</h3>
                  <p className="text-slate-500 mt-1">Ask anything about your course or programming concepts.</p>
                </div>
              ) : (
                <div className="card p-6 border-l-4 border-l-violet-500">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold heading text-lg flex items-center gap-2">
                      <span className="text-violet-500">✨</span> AI Answer
                    </h4>
                    <button onClick={()=>copy(ans)} className={`text-xs font-medium px-2 py-1 rounded transition-all flex items-center gap-1 ${copied ? 'bg-green-100 text-green-700' : 'text-slate-500 hover:text-violet-600 hover:bg-slate-100'}`}>
                      {copied ? (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                          Copied!
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                  <div className="prose prose-slate max-w-none">
                    <p className="whitespace-pre-wrap text-slate-700 leading-relaxed">{ans}</p>
                  </div>
                </div>
              )}

              {/* History */}
              {askHistory.length > 0 && (
                <div className="card p-0 overflow-hidden">
                  <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 font-medium text-sm text-slate-700">Recent Questions</div>
                  <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto custom-scrollbar">
                    {askHistory.map(item => (
                      <button key={item.id} onClick={()=>{ setQ(item.q); setAns(item.a); }} className="block w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors group">
                        <div className="text-sm font-medium text-slate-700 group-hover:text-violet-700 truncate">{item.q}</div>
                        <div className="text-xs text-slate-400 mt-1">{new Date(item.at).toLocaleString()}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: input */}
            <div className="card p-6 h-fit">
              <label className="block text-sm font-medium text-slate-700 mb-2">Lesson Topic</label>
              <input 
                className="input w-full h-12 text-lg" 
                value={topic} 
                onChange={e=>setTopic(e.target.value)} 
                placeholder="e.g., React Hooks" 
              />
              
              <div className="mt-4">
                <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Popular Topics</div>
                <div className="flex flex-wrap gap-2">
                  {genPresets.map((p)=> (
                    <button key={p} onClick={()=>setTopic(p)} className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-white hover:border-amber-200 hover:text-amber-700 text-xs transition-all text-left">{p}</button>
                  ))}
                </div>
              </div>
              
              <div className="mt-6 flex gap-3">
                <button disabled={loading} onClick={generate} className="btn-accent flex-1 justify-center">
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      Generating Lesson...
                    </span>
                  ) : 'Generate Lesson'}
                </button>
                <button onClick={()=>{setTopic('');setGen(null)}} className="btn-outline px-6">Clear</button>
              </div>
            </div>

            {/* Right: output */}
            <div className="space-y-6">
              {!gen ? (
                <div className="card p-8 text-center border-dashed border-2 border-slate-200 bg-slate-50/50">
                  <div className="text-4xl mb-3">🎬</div>
                  <h3 className="text-lg font-medium text-slate-900">Create a Lesson</h3>
                  <p className="text-slate-500 mt-1">Enter a topic to generate a video lesson and transcript instantly.</p>
                </div>
              ) : (
                <div className="card p-0 overflow-hidden">
                  <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                    <h4 className="font-bold heading text-lg text-slate-900">{gen.title}</h4>
                  </div>
                  
                  <div className="p-4">
                    {(gen.video_url || localVideoUrl) && (
                      <div className="mb-6 rounded-xl overflow-hidden shadow-lg bg-black aspect-video relative group">
                        {(() => {
                          const u = String(gen.video_url || localVideoUrl)
                          const useVideo = u.startsWith('blob:') || /\.(webm|mp4)(\?|#|$)/i.test(u)
                          return useVideo ? (
                            <video className="w-full h-full object-contain" controls src={u} />
                          ) : (
                            <iframe className="w-full h-full" src={u} title="Generated Video" allowFullScreen></iframe>
                          )
                        })()}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-semibold text-slate-800">Transcript</div>
                      <div className="flex items-center gap-2">
                        <button onClick={()=>copy(gen.transcript)} className="text-xs font-medium px-2 py-1 rounded hover:bg-slate-100 text-slate-600">Copy Text</button>
                        <button onClick={()=>setExpandTranscript(v=>!v)} className="text-xs font-medium px-2 py-1 rounded hover:bg-slate-100 text-slate-600">{expandTranscript? 'Collapse' : 'Expand'}</button>
                      </div>
                    </div>
                    
                    <div className={`bg-slate-50 p-4 rounded-lg text-sm text-slate-700 leading-relaxed whitespace-pre-wrap border border-slate-100 ${expandTranscript? '' : 'max-h-40 overflow-y-auto custom-scrollbar'}`}>
                      {gen.transcript}
                    </div>
                    
                    <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap gap-3">
                      <button disabled={recording} onClick={makeVideoFromTranscript} className="btn-primary text-sm flex-1 justify-center">
                        {recording ? 'Rendering Video...' : 'Create Video from Transcript'}
                      </button>
                      {localVideoUrl && (
                        <a href={localVideoUrl} download={`lesson-${Date.now()}.webm`} className="btn-outline text-sm flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                          Download
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* History */}
              {genHistory.length > 0 && (
                <div className="card p-0 overflow-hidden">
                  <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 font-medium text-sm text-slate-700">Recent Lessons</div>
                  <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto custom-scrollbar">
                    {genHistory.map(item => (
                      <button key={item.id} onClick={()=>{ setTopic(item.topic); setGen(item.data); setExpandTranscript(false); }} className="block w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors group">
                        <div className="text-sm font-medium text-slate-700 group-hover:text-amber-700 truncate">{item.topic}</div>
                        <div className="text-xs text-slate-400 mt-1">{new Date(item.at).toLocaleString()}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
