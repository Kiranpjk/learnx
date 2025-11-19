import React, { useEffect, useMemo, useState } from "react";
import axios from "../api/axios";
import mockCourses from "../utils/mockCourses";
import CourseCard from "../components/CourseCard";
import { useLocation, useNavigate } from "react-router-dom";

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();

  const params = useMemo(()=> new URLSearchParams(location.search), [location.search]);
  const q = params.get("q")?.toLowerCase() || "";
  const cat = params.get("cat") || "";
  const type = params.get("type") || ""; // recorded | ai
  const level = params.get("level") || "";
  const language = params.get("language") || "";
  const min_rating = params.get("min_rating") || "";
  const max_price = params.get("max_price") || "";

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await axios.get(`/courses/?${params.toString()}`);
        if (!cancelled) {
          if (Array.isArray(res.data)) {
            // Combine backend courses with mock ones (avoid id collisions)
            const backend = res.data;
            const backendIds = new Set(backend.map((c) => c.id));
            const extras = mockCourses.filter((m) => !backendIds.has(m.id));
            setCourses([...backend, ...extras]);
          } else {
            setCourses(mockCourses);
          }
        }
      } catch (e) {
        // Fallback to mock data when backend is not running
        if (!cancelled) setCourses(mockCourses);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [location.search]);

  const filtered = useMemo(() => {
    let list = courses;
    if (q) list = list.filter(c => (c.title || "").toLowerCase().includes(q) || (c.description || c.short_description || "").toLowerCase().includes(q));
    if (cat) list = list.filter(c => (c.category || "").toLowerCase() === cat.toLowerCase() || (c.title || "").toLowerCase().includes(cat.toLowerCase()));
    if (type) list = list.filter(c => (c.type || "recorded").toLowerCase() === type.toLowerCase());
    if (level) list = list.filter(c => (c.level || '').toLowerCase() === level.toLowerCase());
    if (language) list = list.filter(c => (c.language || '').toLowerCase() === language.toLowerCase());
    if (min_rating) list = list.filter(c => (c.rating_avg || 0) >= Number(min_rating));
    if (max_price) list = list.filter(c => Number(c.price || 0) <= Number(max_price));
    return list;
  }, [courses, q, cat, type, level, language, min_rating, max_price]);

  function setParam(key, value){
    const p = new URLSearchParams(location.search);
    if (value) p.set(key, value); else p.delete(key);
    navigate(`/courses?${p.toString()}`);
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <h1 className="text-3xl font-bold heading text-slate-900">Explore Courses</h1>
          
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={()=>setParam('type','')} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${!type ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-slate-600 border-slate-200 hover:border-violet-300'}`}>All</button>
            <button onClick={()=>setParam('type','recorded')} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${type==='recorded' ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-slate-600 border-slate-200 hover:border-violet-300'}`}>Recorded</button>
            <button onClick={()=>setParam('type','ai')} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${type==='ai' ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-slate-600 border-slate-200 hover:border-amber-300'}`}>AI Lessons</button>
          </div>
        </div>

        {/* Advanced Filters */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <select value={level} onChange={e=>setParam('level', e.target.value)} className="input w-full">
              <option value="">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
            <select value={language} onChange={e=>setParam('language', e.target.value)} className="input w-full">
              <option value="">All Languages</option>
              <option value="English">English</option>
              <option value="Spanish">Spanish</option>
              <option value="Hindi">Hindi</option>
            </select>
            <select value={min_rating} onChange={e=>setParam('min_rating', e.target.value)} className="input w-full">
              <option value="">Any Rating</option>
              {[1,2,3,4,4.5].map(r=> <option key={r} value={r}>{r}+ Stars</option>)}
            </select>
            <select value={max_price} onChange={e=>setParam('max_price', e.target.value)} className="input w-full">
              <option value="">Any Price</option>
              <option value="0">Free</option>
              <option value="20">Under ₹20</option>
              <option value="50">Under ₹50</option>
              <option value="100">Under ₹100</option>
            </select>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((c) => (
            <CourseCard key={c.id} course={c} />
          ))}
        </div>
        
        {filtered.length === 0 && (
          <div className="text-center py-20">
            <div className="text-slate-300 text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-medium text-slate-900">No courses found</h3>
            <p className="text-slate-500 mt-2">Try adjusting your filters or search query.</p>
            <button onClick={()=>navigate('/courses')} className="mt-6 btn-primary">Clear all filters</button>
          </div>
        )}
      </div>
    </div>
  );
}
