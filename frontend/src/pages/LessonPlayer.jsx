import React, { useEffect, useRef, useState } from "react";
import axios from "../api/axios";
import { useParams, useNavigate } from "react-router-dom";
import mockLessons from "../utils/mockLessons";

export default function LessonPlayer() {
  const { id, lessonId } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [useMock, setUseMock] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [notes, setNotes] = useState([]);
  const [noteText, setNoteText] = useState("");
  const [discussions, setDiscussions] = useState([]);
  const [comment, setComment] = useState("");
  const [showTranscript, setShowTranscript] = useState(true);
  const [transcriptQuery, setTranscriptQuery] = useState("");
  const videoRef = useRef(null);

  useEffect(() => {
    async function fetchLesson() {
      try {
        // Prefer nested endpoint when course id is available
        const path = id ? `/courses/${id}/lessons/${lessonId}/` : `/courses/lessons/${lessonId}/`;
        const res = await axios.get(path);
        setLesson(res.data);
        setUseMock(false);
      } catch (err) {
        // Fallback to mock lesson
        const l = mockLessons.find((x) => String(x.id) === String(lessonId));
        if (l) {
          setLesson({
            id: l.id,
            title: l.title,
            content: `This is mock content for ${l.title}. Explore the key concepts and follow along with the demo video.`,
            video_url: l.videoUrl,
          });
          setUseMock(true);
        } else {
          console.error("Failed to load lesson:", err);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchLesson();
  }, [lessonId]);

  // Load notes & discussions
  useEffect(()=>{
    async function loadExtras(){
      try { const r = await axios.get(`/courses/${id}/lessons/${lessonId}/notes/`); setNotes(r.data||[]);} catch{}
      try { const d = await axios.get(`/courses/${id}/lessons/${lessonId}/discussions/`); setDiscussions(d.data||[]);} catch{}
    }
    if(id && lessonId && !useMock) loadExtras();
  },[id, lessonId, useMock]);

  // Progress update on timeupdate
  useEffect(()=>{
    const el = videoRef.current;
    if(!el) return;
    const onTime = () => {
      const pos = Math.floor(el.currentTime || 0);
      // naive percent: if duration available
      const dur = Math.floor(el.duration || 0);
      const percent = dur>0 ? Math.min(100, Math.round((pos/dur)*100)) : 0;
      axios.post(`/courses/${id}/progress/`, { lesson_id: lessonId, position_seconds: pos, progress_percent: percent }).catch(()=>{});
    };
    el.addEventListener('timeupdate', onTime);
    return ()=> el.removeEventListener('timeupdate', onTime);
  }, [id, lessonId]);

  function addNote(){
    const t = Math.floor(videoRef.current?.currentTime || 0);
    const text = noteText.trim(); if(!text) return;
    axios.post(`/courses/${id}/lessons/${lessonId}/notes/`, { timestamp_seconds: t, text })
      .then(r=>{ setNotes([...(notes||[]), r.data].sort((a,b)=>a.timestamp_seconds-b.timestamp_seconds)); setNoteText(""); })
      .catch(e => {
        if (e.response && e.response.status === 401) alert("Please log in to save notes.");
        else console.error("Failed to save note", e);
      });
  }
  function addComment(){
    const text = comment.trim(); if(!text) return;
    axios.post(`/courses/${id}/lessons/${lessonId}/discussions/`, { text })
      .then(r=>{ setDiscussions([r.data, ...(discussions||[])]); setComment(""); })
      .catch(e => {
        if (e.response && e.response.status === 401) alert("Please log in to post a comment.");
        else console.error("Failed to post comment", e);
      });
  }

  if (loading) return <p className="text-center p-10">Loading lesson...</p>;
  if (!lesson) return <p className="text-center p-10">Lesson not found.</p>;

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-0 overflow-hidden">
            {/* Video player (prefer <video> for playbackRate controls) */}
            {(lesson.video_url || lesson.videoUrl) ? (
              <div className="bg-black aspect-video relative group">
                {String(lesson.video_url||lesson.videoUrl).endsWith('.mp4') ? (
                  <video ref={videoRef} src={lesson.video_url || lesson.videoUrl} className="w-full h-full object-contain" controls />
                ) : (
                  <iframe className="w-full h-full" src={lesson.video_url || lesson.videoUrl} title="Lesson Video" allowFullScreen></iframe>
                )}
              </div>
            ) : (
              <div className="aspect-video bg-slate-100 flex items-center justify-center text-slate-400">
                No video available
              </div>
            )}
            
            <div className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <h1 className="text-2xl font-bold heading text-slate-900">{lesson.title}</h1>
                
                <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200 shadow-sm">
                  <button onClick={()=>{ if(videoRef.current) videoRef.current.currentTime = Math.max(0,(videoRef.current.currentTime||0)-10); }} className="p-2 hover:bg-white rounded-lg text-slate-600 hover:text-violet-600 transition-all hover:shadow-sm" title="Rewind 10s">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z"></path></svg>
                  </button>
                  <select value={speed} onChange={e=>{ const v=Number(e.target.value); setSpeed(v); if(videoRef.current) videoRef.current.playbackRate=v; }} className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none cursor-pointer px-2 py-1 rounded hover:bg-white transition-colors">
                    {[0.5,0.75,1,1.25,1.5,1.75,2].map(s=> <option key={s} value={s}>{s}x Speed</option>)}
                  </select>
                  <button onClick={()=>{ if(videoRef.current) videoRef.current.currentTime = (videoRef.current.currentTime||0)+10; }} className="p-2 hover:bg-white rounded-lg text-slate-600 hover:text-violet-600 transition-all hover:shadow-sm" title="Forward 10s">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z"></path></svg>
                  </button>
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex items-center justify-between mb-6 p-4 bg-violet-50 rounded-xl border border-violet-100">
                <div className="text-sm text-violet-800 font-medium">
                  🎉 Almost there! Keep going.
                </div>
                <button 
                  onClick={async () => {
                    try {
                      // Mark as complete (100%)
                      await axios.post(`/courses/${id}/progress/`, { 
                        lesson_id: lessonId, 
                        position_seconds: Math.floor(videoRef.current?.duration || 0), 
                        progress_percent: 100 
                      });
                    } catch (e) { console.error(e); }
                    
                    if (lesson.next_lesson_id) {
                      navigate(`/courses/${id}/lessons/${lesson.next_lesson_id}`);
                    } else {
                      navigate(`/courses/${id}`);
                    }
                  }} 
                  className="btn-primary py-2 px-6 shadow-md shadow-violet-200"
                >
                  Complete & Continue &rarr;
                </button>
              </div>

              {/* Transcript & content */}
              <div className="mt-6 pt-6 border-t border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-800">Transcript</h3>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <input 
                        value={transcriptQuery} 
                        onChange={e=>setTranscriptQuery(e.target.value)} 
                        placeholder="Search..." 
                        className="pl-8 pr-3 py-1 text-sm border border-slate-200 rounded-full w-32 focus:w-48 transition-all focus:outline-none focus:border-violet-300"
                      />
                      <svg className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    </div>
                    <button onClick={()=>setShowTranscript(v=>!v)} className="text-xs font-medium text-slate-500 hover:text-violet-600 px-2 py-1 rounded hover:bg-slate-50">
                      {showTranscript? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
                {showTranscript && (
                  <div className="prose prose-slate max-w-none text-sm text-slate-600 leading-relaxed max-h-96 overflow-y-auto custom-scrollbar pr-2">
                    {(lesson.transcript || lesson.content || '').split(/\n/).filter(line => !transcriptQuery || line.toLowerCase().includes(transcriptQuery.toLowerCase())).map((line, i) => (
                      <p key={i} className="mb-2">{line}</p>
                    )) || 'No transcript available.'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar: Notes and Discussion */}
        <aside className="space-y-6">
          <div className="card p-5 h-[calc(50%-1rem)] flex flex-col">
            <div className="font-semibold mb-3 flex items-center gap-2 text-slate-800">
              <span className="text-amber-500">📝</span> My Notes
            </div>
            <div className="flex gap-2 mb-3">
              <input value={noteText} onChange={e=>setNoteText(e.target.value)} placeholder="Jot down a thought..." className="input flex-1 text-sm"/>
              <button onClick={addNote} className="btn-primary py-1 px-3 text-sm">Add</button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
              {(!notes || notes.length===0) && <div className="text-slate-400 text-sm italic text-center py-4">No notes yet. Timestamps are saved automatically.</div>}
              {(notes||[]).map(n => (
                <div key={n.id} className="p-3 rounded-lg bg-amber-50 border border-amber-100 text-sm">
                  <div className="text-xs text-amber-600/70 font-medium mb-1">{Math.floor(n.timestamp_seconds/60)}:{String(n.timestamp_seconds%60).padStart(2,'0')} • {new Date(n.created_at).toLocaleDateString()}</div>
                  <div className="text-slate-700">{n.text}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5 h-[calc(50%-1rem)] flex flex-col">
            <div className="font-semibold mb-3 flex items-center gap-2 text-slate-800">
              <span className="text-violet-500">💬</span> Discussion
            </div>
            <div className="flex gap-2 mb-3">
              <input value={comment} onChange={e=>setComment(e.target.value)} placeholder="Ask or comment..." className="input flex-1 text-sm"/>
              <button onClick={addComment} className="btn-accent py-1 px-3 text-sm">Post</button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-1">
              {(!discussions || discussions.length===0) && <div className="text-slate-400 text-sm italic text-center py-4">Start the conversation!</div>}
              {(discussions||[]).map(d => (
                <div key={d.id} className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-slate-700">{d.user_name || 'Student'}</span>
                    <span className="text-xs text-slate-400">{new Date(d.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="text-slate-600 mb-2">{d.text}</div>
                  {Array.isArray(d.replies) && d.replies.length>0 && (
                    <div className="pl-3 border-l-2 border-slate-200 space-y-2 mt-2">
                      {d.replies.map(r => (
                        <div key={r.id} className="text-xs">
                          <span className="font-medium text-slate-600">{r.user_name || 'User'}:</span> <span className="text-slate-500">{r.text}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
