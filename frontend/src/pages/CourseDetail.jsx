import React, { useEffect, useState } from "react";
import api from "../api/axios";
import { useParams, Link } from "react-router-dom";
import mockCourses from "../utils/mockCourses";
import mockLessons from "../utils/mockLessons";

export default function CourseDetail() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [enroll, setEnroll] = useState({ enrolled: false });
  const [reviews, setReviews] = useState([]);
  const [related, setRelated] = useState([]);
  const [myRating, setMyRating] = useState(0);
  const [myReview, setMyReview] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      let apiOk = false;
      try {
        const res = await api.get(`courses/${id}/`);
        if (!cancelled) setCourse(res.data);
        apiOk = true;
      } catch (e) {
        // Fallback to mock: find course and attach mock lessons
        const base = mockCourses.find((c) => String(c.id) === String(id));
        if (base) {
          const withLessons = {
            ...base,
            description: base.description || base.short_description,
            lessons: mockLessons.map((l, i) => ({
              id: l.id,
              title: l.title,
              order: i + 1,
              duration: l.duration,
              video_url: l.videoUrl,
            })),
          };
          if (!cancelled) setCourse(withLessons);
        } else if (!cancelled) {
          setCourse(null);
        }
      }
      // fetch extras in parallel (best effort) only if API course exists to avoid 404 noise
      if (apiOk) {
        try { const r = await api.get(`courses/${id}/related/`); if(!cancelled) setRelated(r.data||[]); } catch {}
        try { const rv = await api.get(`courses/${id}/reviews/`); if(!cancelled) setReviews(rv.data||[]); } catch {}
        try { const en = await api.get(`courses/${id}/enrollment/`); if(!cancelled) setEnroll(en.data||{enrolled:false}); } catch {}
      } else {
        // mock fallbacks
        setRelated([]);
        setReviews([]);
        setEnroll({ enrolled: false });
      }
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function doEnroll(){
    try{
      const r = await api.post(`courses/${id}/enroll/`);
      setEnroll({ ...r.data, enrolled: true });
    } catch (e){
      if (e.response && e.response.status === 401) {
        alert("Please log in to enroll in this course.");
        // Optional: redirect to login
        // window.location.href = "/login";
      } else {
        console.error("Enrollment failed", e);
        alert("Failed to enroll. Please try again.");
      }
    }
  }
  async function submitReview(){
    if(myRating<1) return;
    try{
      const r = await api.post(`courses/${id}/reviews/`, { rating: myRating, text: myReview });
      setMyRating(0); setMyReview("");
      const rv = await api.get(`courses/${id}/reviews/`);
      setReviews(rv.data||[]);
    }catch(e){
      if (e.response && e.response.status === 401) {
        alert("Please log in to submit a review.");
      }
    }
  }

  if (loading) return <div className="p-8">Loading...</div>;
  if (!course) return <div className="p-8">Course not found.</div>;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Main column */}
      <div className="lg:col-span-2">
        <h1 className="text-3xl sm:text-4xl font-bold heading bg-gradient-to-r from-violet-600 to-amber-500 bg-clip-text text-transparent">
          {course.title}
        </h1>
        <div className="mt-2 text-slate-600 flex flex-wrap items-center gap-3">
          <span className="px-2 py-1 text-xs rounded bg-violet-50 text-violet-600 border border-violet-200">{course.level || 'Beginner'}</span>
          <span className="px-2 py-1 text-xs rounded bg-amber-50 text-amber-700 border border-amber-200">{course.language || 'English'}</span>
          <span className="text-sm">Instructor: <b>{course.instructor || '—'}</b></span>
          {typeof course.rating_avg === 'number' && (
            <span className="text-sm">⭐ {course.rating_avg?.toFixed(1)} ({course.rating_count||0})</span>
          )}
        </div>
        <p className="text-slate-700 mt-4 leading-relaxed">{course.description}</p>

        {/* Lessons list */}
        <h2 className="text-xl sm:text-2xl mt-8 mb-4 font-semibold heading">Curriculum</h2>
        <div className="space-y-3">
          {(course.lessons || []).map((lesson) => (
            <Link
              key={lesson.id}
              to={`/courses/${id}/lessons/${lesson.id}`}
              className="block p-4 bg-white rounded-lg shadow hover:bg-slate-50 border border-slate-200"
            >
              <div className="flex items-center justify-between">
                <div className="font-medium">{lesson.order}. {lesson.title}</div>
                <div className="text-sm text-slate-500">{lesson.duration_seconds ? Math.round(lesson.duration_seconds/60)+ ' min' : ''}</div>
              </div>
            </Link>
          ))}
        </div>

        {/* Reviews */}
        <div className="mt-10">
          <h3 className="text-xl font-semibold mb-4 heading">Student Reviews</h3>
          <div className="card p-5">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center mb-4">
              <select value={myRating} onChange={e=>setMyRating(Number(e.target.value))} className="input w-full sm:w-32 h-10">
                <option value={0}>Rate...</option>
                {[1,2,3,4,5].map(r=> <option key={r} value={r}>{r} star{r>1?'s':''}</option>)}
              </select>
              <div className="flex-1 w-full relative">
                <input 
                  value={myReview} 
                  onChange={e=>setMyReview(e.target.value)} 
                  placeholder="Share your experience..." 
                  className="input w-full h-10 pr-20"
                />
                <button 
                  onClick={submitReview} 
                  className="absolute right-1 top-1 bottom-1 px-3 bg-violet-600 text-white text-xs font-medium rounded hover:bg-violet-700 transition-colors"
                >
                  Submit
                </button>
              </div>
            </div>
            
            <div className="space-y-4 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
              {reviews.length===0 && <div className="text-slate-500 text-sm italic">No reviews yet. Be the first!</div>}
              {reviews.map(rv=> (
                <div key={rv.id} className="pb-3 border-b border-slate-100 last:border-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm text-slate-700">{rv.user_name || 'Student'}</span>
                    <span className="text-xs text-slate-400">{new Date(rv.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1 mb-1">
                    {[...Array(5)].map((_,i)=> (
                      <span key={i} className={`text-xs ${i < rv.rating ? 'text-amber-400' : 'text-slate-200'}`}>★</span>
                    ))}
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">{rv.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <aside className="space-y-4">
        <div className="card">
          <div className="text-2xl font-bold">{course.price ? `₹${Number(course.price).toFixed(2)}` : 'Free'}</div>
          {!enroll.enrolled ? (
            <button onClick={doEnroll} className="btn-accent w-full mt-3">Enroll now</button>
          ) : (
            <Link to={`/courses/${id}/lessons/${(course.lessons||[])[0]?.id || ''}`} className="btn-primary w-full mt-3 text-center block">Start learning</Link>
          )}
          <ul className="text-sm text-slate-600 mt-3 space-y-1">
            <li>• Lifetime access</li>
            <li>• Certificate of completion</li>
            <li>• Mobile friendly</li>
          </ul>
          {enroll.enrolled && (
            <a href={`http://127.0.0.1:8000/api/courses/${id}/certificate/`} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm text-primary hover:underline">Get certificate</a>
          )}
        </div>
        <div className="card">
          <div className="font-semibold mb-2">Related courses</div>
          <div className="space-y-2">
            {related.slice(0,5).map(rc => (
              <Link key={rc.id} to={`/courses/${rc.id}`} className="block p-2 rounded border border-slate-200 hover:bg-slate-50">
                <div className="font-medium line-clamp-1">{rc.title}</div>
                <div className="text-xs text-slate-500">{rc.level || 'Beginner'} • {rc.language || 'English'}</div>
              </Link>
            ))}
            {related.length===0 && <div className="text-slate-500 text-sm">No related courses found.</div>}
          </div>
        </div>
      </aside>
    </div>
  );
}
