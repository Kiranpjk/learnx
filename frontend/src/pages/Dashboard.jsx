import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
          const cookie = cookies[i].trim();
          if (cookie.substring(0, name.length + 1) === (name + '=')) {
              cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
              break;
          }
      }
  }
  return cookieValue;
}

export default function Dashboard() {
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastLogin, setLastLogin] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [enrolledRes, recentRes] = await Promise.all([
          api.get("courses/enrolled/"),
          api.get("courses/recently_viewed/")
        ]);
        setEnrolledCourses(enrolledRes.data);
        setRecentlyViewed(recentRes.data);
        
        // Read cookie
        const loginTime = getCookie('last_login_time');
        if (loginTime) setLastLogin(loginTime);
        
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold heading text-slate-900 mb-8">Welcome Back 👋</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* In Progress Section */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="heading text-xl font-semibold text-slate-800">My Learning</h2>
                <Link to="/courses" className="text-violet-600 text-sm font-medium hover:text-violet-700">Browse Catalog</Link>
              </div>
              
              {loading ? (
                <div className="text-center py-10 text-slate-400">Loading your courses...</div>
              ) : (
                <div className="space-y-4">
                  {enrolledCourses.length === 0 ? (
                    <div className="text-center py-10 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      <div className="text-4xl mb-3">🎓</div>
                      <p>You haven't enrolled in any courses yet.</p>
                      <Link to="/courses" className="btn-primary mt-4 inline-block">Find a Course</Link>
                    </div>
                  ) : (
                    enrolledCourses.map(c => (
                      <div key={c.id} className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl border border-slate-100 bg-white hover:shadow-md transition-all group">
                        <div className="w-full sm:w-48 h-32 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0 relative">
                          {c.thumbnail ? (
                            <img src={c.thumbnail} alt="thumb" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full grid place-items-center text-slate-400 text-xs">No Image</div>
                          )}
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-200">
                            <div className="h-full bg-green-500" style={{width: `${c.progress_percent}%`}}></div>
                          </div>
                        </div>
                        
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <h3 className="font-bold text-slate-900 group-hover:text-violet-700 transition-colors text-lg">{c.title}</h3>
                            <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide ${c.type === 'ai' ? 'bg-amber-100 text-amber-700' : 'bg-violet-100 text-violet-700'}`}>
                                {c.type === 'ai' ? 'AI Lesson' : 'Recorded'}
                              </span>
                              <span>•</span>
                              <span>{c.level || 'All Levels'}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between mt-4">
                            <div className="text-xs text-slate-500 font-medium">
                              {c.progress_percent > 0 ? `${Math.round(c.progress_percent)}% Complete` : 'Not Started'}
                            </div>
                            <Link 
                              to={c.last_lesson_id ? `/courses/${c.id}/lessons/${c.last_lesson_id}` : `/courses/${c.id}`} 
                              className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-violet-600 transition-all shadow-sm"
                            >
                              {c.progress_percent > 0 ? 'Resume' : 'Start Learning'}
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Recently Viewed Section (Session Demo) */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="heading text-xl font-semibold text-slate-800">Recently Viewed</h2>
                <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">Session Based</span>
              </div>
              {recentlyViewed.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {recentlyViewed.map(c => (
                    <Link key={c.id} to={`/courses/${c.id}`} className="flex gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                      <div className="w-16 h-16 bg-slate-200 rounded-md overflow-hidden flex-shrink-0">
                        {c.thumbnail ? (
                          <img src={c.thumbnail} alt="thumb" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full grid place-items-center text-slate-400 text-xs">No Img</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-slate-900 text-sm truncate">{c.title}</h4>
                        <p className="text-xs text-slate-500 mt-1 truncate">{c.category || 'General'}</p>
                        <p className="text-xs text-violet-600 mt-1 font-medium">View Course →</p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400 text-sm border border-dashed border-slate-200 rounded-xl">
                  <p>You haven't viewed any courses yet.</p>
                  <p className="text-xs mt-1 text-slate-500">Visit a course page to populate this list using Django Sessions!</p>
                  <Link to="/courses" className="btn-primary mt-4 inline-block text-xs px-3 py-1.5">Browse Courses</Link>
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="card p-6">
              <h2 className="heading text-xl font-semibold text-slate-800 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-4">
                <Link to="/ai" className="flex flex-col items-center justify-center p-4 rounded-xl bg-amber-50 text-amber-700 border border-amber-100 hover:bg-amber-100 transition-colors">
                  <span className="text-2xl mb-1">✨</span>
                  <span className="font-medium text-sm">AI Studio</span>
                </Link>
                <Link to="/courses" className="flex flex-col items-center justify-center p-4 rounded-xl bg-violet-50 text-violet-700 border border-violet-100 hover:bg-violet-100 transition-colors">
                  <span className="text-2xl mb-1">🔍</span>
                  <span className="font-medium text-sm">Find Course</span>
                </Link>
                <Link to="/profile" className="col-span-2 flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-50 text-slate-700 border border-slate-100 hover:bg-slate-100 transition-colors">
                  <span className="text-lg">👤</span>
                  <span className="font-medium text-sm">Edit Profile</span>
                </Link>
              </div>
            </div>

            <div className="card p-6">
              <h2 className="heading text-xl font-semibold text-slate-800 mb-4">Weekly Goal</h2>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-3xl font-bold text-slate-900">2/5</span>
                <span className="text-sm text-slate-500 mb-1">days</span>
              </div>
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full" style={{width:'40%'}}></div>
              </div>
              <p className="text-xs text-slate-500 mt-3">You're on a 2-day streak! Keep learning to reach your goal.</p>
            </div>

            {/* Certificates Placeholder */}
            <div className="card p-6">
              <h2 className="heading text-xl font-semibold text-slate-800 mb-4">Certificates</h2>
              <div className="text-center py-6 text-slate-400 text-sm border border-dashed border-slate-200 rounded-xl">
                No certificates earned yet.
                <br/>Complete a course to earn one!
              </div>
            </div>
            
            {/* Cookie Info */}
            {lastLogin && (
              <div className="text-xs text-slate-400 text-center mt-4">
                Last Login (Cookie): {lastLogin}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

