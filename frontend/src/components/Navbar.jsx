import React, { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);  // HOOK INSIDE COMPONENT
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  useEffect(()=>{
    const root = document.documentElement;
    if(theme === 'dark') root.classList.add('dark'); else root.classList.remove('dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const categories = [
    "Web Development",
    "Data Science",
    "AI & ML",
    "Mobile Apps",
    "Cloud",
    "Cybersecurity",
  ];

  function onSearch(e){
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    navigate(`/courses?${params.toString()}`);
  }

  return (
    <div className="glass shadow-md sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center gap-4">
        <Link to="/" className="text-xl sm:text-2xl font-bold heading bg-gradient-to-r from-violet-600 to-amber-500 bg-clip-text text-transparent">
          LearnX
        </Link>

        {/* Categories */}
        <div className="relative hidden sm:block">
          <button onClick={()=>setOpen(v=>!v)} className="px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-sm font-medium text-slate-700 flex items-center gap-1">
            Categories
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          </button>
          {open && (
            <div className="absolute mt-2 bg-white border border-slate-200 rounded-lg shadow-xl w-56 p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              {categories.map((c)=> (
                <button key={c} onClick={()=>{ setOpen(false); navigate(`/courses?cat=${encodeURIComponent(c)}`); }} className="block w-full text-left px-3 py-2 rounded hover:bg-violet-50 hover:text-violet-700 text-sm transition-colors">
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Search */}
        <form onSubmit={onSearch} className="hidden md:flex items-center flex-1 max-w-md ml-4">
          <div className="relative w-full">
            <input 
              value={q} 
              onChange={(e)=>setQ(e.target.value)} 
              placeholder="Search for courses..." 
              className="w-full pl-10 pr-4 py-2 rounded-full border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all text-sm"
            />
            <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>
        </form>

        <div className="ml-auto flex items-center gap-3 sm:gap-5">
          <Link to="/courses" className="hidden lg:block text-slate-600 hover:text-violet-600 font-medium text-sm transition-colors">
            Courses
          </Link>

          <Link to="/ai" className="hidden lg:block text-slate-600 hover:text-violet-600 font-medium text-sm transition-colors">
            AI Studio
          </Link>

          <Link to="/contact" className="hidden lg:block text-slate-600 hover:text-violet-600 font-medium text-sm transition-colors">
            Contact
          </Link>

          {user ? (
            <div className="flex items-center gap-3">
              <button onClick={()=>setTheme(theme==='dark'?'light':'dark')} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors" title="Toggle theme">
                {theme==='dark' ? '🌙' : '☀️'}
              </button>
              
              <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block"></div>
              
              <Link to="/dashboard" className="flex items-center gap-2 hover:bg-slate-50 p-1 pr-3 rounded-full border border-transparent hover:border-slate-200 transition-all">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white grid place-items-center font-bold text-sm shadow-sm">
                  {String(user?.username || 'U').charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-slate-700 hidden sm:block max-w-[100px] truncate">{user.username}</span>
              </Link>
              
              <button onClick={logout} className="text-slate-500 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-colors" title="Logout">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button onClick={()=>setTheme(theme==='dark'?'light':'dark')} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors" title="Toggle theme">
                {theme==='dark' ? '🌙' : '☀️'}
              </button>
              <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block"></div>
              <Link to="/login" className="text-slate-600 hover:text-violet-600 font-medium text-sm px-2">Log in</Link>
              <Link to="/signup" className="btn-primary py-2 px-4 text-sm shadow-md shadow-violet-200">Sign up</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
