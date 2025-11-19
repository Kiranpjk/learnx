import React, { useEffect, useState } from "react";
import api from "../api/axios";
import { useParams, useNavigate } from "react-router-dom";

export default function QuizTake() {
  const { id } = useParams(); // quiz id
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({}); // questionId -> choiceId
  const [attemptId, setAttemptId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get(`quizzes/${id}/`);
        setQuiz(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function startAttempt() {
    try {
      const res = await api.post(`quizzes/${id}/start/`);
      setAttemptId(res.data.attempt_id);
    } catch (err) {
      console.error(err);
    }
  }

  function selectChoice(questionId, choiceId) {
    setAnswers(prev => ({ ...prev, [questionId]: choiceId }));
  }

  async function submit() {
    if (!attemptId) {
      alert("Start the quiz first.");
      return;
    }
    const payload = {
      answers: Object.keys(answers).map(qid => ({
        question_id: parseInt(qid),
        choice_id: answers[qid]
      }))
    };

    try {
      const res = await api.post(`quizzes/attempt/${attemptId}/submit/`, payload);
      // navigate to results page with score passed
      navigate(`/quizzes/${id}/result`, { state: { score: res.data.score, correct: res.data.correct, total: res.data.total }});
    } catch (err) {
      console.error(err);
      alert("Submission failed.");
    }
  }

  if (loading) return <p className="p-6">Loading...</p>;
  if (!quiz) return <p className="p-6">Quiz not found.</p>;

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="card p-8 mb-6 border-t-4 border-t-violet-600">
          <h1 className="text-3xl font-bold heading text-slate-900 mb-2">{quiz.title}</h1>
          <p className="text-slate-600">{quiz.description}</p>
          
          {attemptId && (
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 text-green-700 text-sm font-medium border border-green-100">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Attempt in progress
            </div>
          )}
        </div>

        {!attemptId ? (
          <div className="text-center py-12">
            <button onClick={startAttempt} className="btn-primary px-8 py-3 text-lg shadow-lg shadow-violet-200">Start Quiz Now</button>
          </div>
        ) : (
          <div className="space-y-6">
            {quiz.questions.map((q, idx) => (
              <div key={q.id} className="card p-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-sm">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-lg text-slate-900 mb-4">{q.text}</div>
                    <div className="space-y-3">
                      {q.choices.map(c => (
                        <label key={c.id} className={`block p-4 rounded-lg border cursor-pointer transition-all ${answers[q.id] === c.id ? 'border-violet-500 bg-violet-50 ring-1 ring-violet-500' : 'border-slate-200 hover:bg-slate-50'}`}>
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name={`q-${q.id}`}
                              checked={answers[q.id] === c.id}
                              onChange={() => selectChoice(q.id, c.id)}
                              className="w-4 h-4 text-violet-600 border-slate-300 focus:ring-violet-500"
                            />
                            <span className="text-slate-700">{c.text}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className="flex items-center justify-between pt-6 border-t border-slate-200 mt-8">
              <button onClick={() => navigate(-1)} className="btn-outline px-6">Cancel</button>
              <button onClick={submit} className="btn-primary px-8 shadow-lg shadow-violet-200">Submit Quiz</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
