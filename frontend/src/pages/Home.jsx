import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import CourseCard from "../components/CourseCard";
import mockCourses from "../utils/mockCourses";

export default function Home() {
  const featured = useMemo(() => mockCourses.slice(0, 6), []);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold heading text-slate-900 leading-tight tracking-tight">
            Learn from Recorded Courses +
            <span className="block mt-2 bg-gradient-to-r from-violet-600 to-amber-500 bg-clip-text text-transparent">AI-Generated Lessons</span>
          </h1>
          <p className="text-slate-600 mt-6 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
            A modern learning platform inspired by Coursera & Udemy—curated video courses,
            AI-created lessons with transcripts, and practice quizzes.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/courses" className="btn-primary px-8 py-3 text-base shadow-lg shadow-violet-200">Browse Courses</Link>
            <Link to="/ai" className="btn-accent px-8 py-3 text-base shadow-lg shadow-amber-100">Try AI Studio</Link>
          </div>

          {/* Quick type filters */}
          <div className="mt-8 flex flex-wrap justify-center gap-3 text-sm font-medium">
            <Link to="/courses?type=recorded" className="px-4 py-1.5 rounded-full border border-violet-200 text-violet-700 bg-violet-50 hover:bg-violet-100 transition-colors">Recorded classes</Link>
            <Link to="/courses?type=ai" className="px-4 py-1.5 rounded-full border border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors">AI lessons</Link>
          </div>

          {/* Trust badges */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-slate-400 text-sm font-medium uppercase tracking-wide">
            <span>High-quality content</span>
            <span className="hidden sm:inline">•</span>
            <span>Self-paced + AI-guided</span>
            <span className="hidden sm:inline">•</span>
            <span>Certificates of completion</span>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="heading text-2xl font-bold mb-6 text-slate-800">Popular Categories</h2>
          <div className="flex flex-wrap gap-3">
            {["Web Development", "Data Science", "AI & ML", "Mobile Apps", "Cloud", "Cybersecurity"].map((c) => (
              <span key={c} className="px-5 py-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-white hover:border-violet-200 hover:text-violet-700 hover:shadow-sm transition-all text-sm font-medium cursor-pointer">
                {c}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Featured courses */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="heading text-2xl font-bold text-slate-800">Featured Courses</h2>
            <Link to="/courses" className="text-violet-600 font-medium hover:text-violet-700 flex items-center gap-1">
              See all <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {featured.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-block p-3 rounded-xl bg-violet-100 text-violet-600 mb-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
              </div>
              <h3 className="heading text-3xl font-bold text-slate-900">Recorded Courses</h3>
              <p className="text-slate-600 text-lg leading-relaxed">Learn from structured video lessons by expert instructors. Track progress, complete assignments, and earn certificates upon completion.</p>
              <ul className="space-y-3 text-slate-700">
                <li className="flex items-center gap-3"><span className="text-green-500">✓</span> High-quality video content</li>
                <li className="flex items-center gap-3"><span className="text-green-500">✓</span> Quizzes & interactive assignments</li>
                <li className="flex items-center gap-3"><span className="text-green-500">✓</span> Lifetime access to materials</li>
              </ul>
            </div>
            <div className="space-y-6 md:pl-10">
              <div className="inline-block p-3 rounded-xl bg-amber-100 text-amber-600 mb-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
              </div>
              <h3 className="heading text-3xl font-bold text-slate-900">AI-Generated Lessons</h3>
              <p className="text-slate-600 text-lg leading-relaxed">Create on-demand lessons with transcripts and demo videos tailored to your specific learning goals and pace.</p>
              <ul className="space-y-3 text-slate-700">
                <li className="flex items-center gap-3"><span className="text-green-500">✓</span> Instant transcripts & summaries</li>
                <li className="flex items-center gap-3"><span className="text-green-500">✓</span> Personalized video snippets</li>
                <li className="flex items-center gap-3"><span className="text-green-500">✓</span> Adaptive learning path</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="heading text-2xl font-bold mb-10 text-center text-slate-800">What learners say</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {["The AI lessons helped me ramp up fast.", "Loved the course quality—very clear.", "Quizzes made me retain concepts better."].map((t, i) => (
              <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div className="text-amber-400 text-4xl font-serif leading-none mb-4">“</div>
                <p className="text-slate-700 text-lg italic mb-6">{t}</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs">
                    L{i+1}
                  </div>
                  <div className="text-sm font-medium text-slate-900">Learner {i + 1}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-violet-600 rounded-2xl p-8 sm:p-12 text-center text-white shadow-xl shadow-violet-200">
            <h3 className="heading text-3xl font-bold mb-4">Start learning today</h3>
            <p className="text-violet-100 text-lg mb-8 max-w-2xl mx-auto">Browse curated courses or craft a custom lesson with AI. Join thousands of learners achieving their goals.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/courses" className="px-8 py-3 bg-white text-violet-700 font-semibold rounded-lg hover:bg-violet-50 transition-colors">Explore Courses</Link>
              <Link to="/ai" className="px-8 py-3 bg-violet-700 text-white font-semibold rounded-lg border border-violet-500 hover:bg-violet-800 transition-colors">Generate a Lesson</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
