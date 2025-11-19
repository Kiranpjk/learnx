import React, { useEffect, useState } from "react";
import api from "../api/axios";
import { Link } from "react-router-dom";

export default function QuizList() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("quizzes/")
      .then(res => setQuizzes(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold heading text-slate-900">Quizzes</h1>
            <p className="text-slate-500 mt-1">Test your knowledge with interactive quizzes</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-500">Loading quizzes...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map(q => (
              <div key={q.id} className="card p-6 hover:shadow-md transition-shadow border border-slate-100">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-lg bg-violet-50 text-violet-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
                  </div>
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                    {q.questions_count || 0} Questions
                  </span>
                </div>
                <h2 className="text-xl font-semibold text-slate-900 mb-2">{q.title}</h2>
                <p className="text-slate-600 text-sm mb-6 line-clamp-2">{q.description || 'No description available.'}</p>
                <Link to={`/quizzes/${q.id}`} className="btn-primary w-full justify-center">Start Quiz</Link>
              </div>
            ))}
            {quizzes.length === 0 && (
              <div className="col-span-full text-center py-12 bg-white rounded-xl border border-slate-100">
                <div className="text-4xl mb-3">📝</div>
                <h3 className="text-lg font-medium text-slate-900">No quizzes available</h3>
                <p className="text-slate-500 mt-1">Check back later for new challenges.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
