import React from "react";
import { useLocation, Link } from "react-router-dom";

export default function QuizResult() {
  const { state } = useLocation();
  const score = state?.score;
  const correct = state?.correct;
  const total = state?.total;

  if (score === undefined) {
    return (
      <div className="p-8">
        <p>No result to show.</p>
        <Link to="/quizzes" className="btn-primary mt-4 inline-block">Back to quizzes</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="card max-w-lg w-full p-8 text-center shadow-xl border border-slate-100">
        <div className="w-20 h-20 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
          {score >= 70 ? '🏆' : '📚'}
        </div>
        
        <h1 className="text-3xl font-bold heading text-slate-900 mb-2">Quiz Complete!</h1>
        <p className="text-slate-500 mb-8">Here's how you performed</p>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="text-sm text-slate-500 uppercase tracking-wider font-medium mb-1">Score</div>
            <div className={`text-3xl font-bold ${score >= 70 ? 'text-green-600' : 'text-amber-600'}`}>
              {score.toFixed(0)}%
            </div>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="text-sm text-slate-500 uppercase tracking-wider font-medium mb-1">Correct</div>
            <div className="text-3xl font-bold text-slate-900">
              {correct}<span className="text-lg text-slate-400 font-normal">/{total}</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Link to="/quizzes" className="btn-primary w-full justify-center py-3">Try Another Quiz</Link>
          <Link to="/dashboard" className="btn-outline w-full justify-center py-3">Back to Dashboard</Link>
        </div>
      </div>
    </div>
  );
}
