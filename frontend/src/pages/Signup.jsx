import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

export default function Signup() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  // FINAL AUTO-LOGIN SIGNUP FUNCTION
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1️⃣ Register the user
      await axios.post("http://127.0.0.1:8000/api/auth/register/", form);

      // 2️⃣ Auto-login
      const loginRes = await axios.post("http://127.0.0.1:8000/api/auth/token/", {
        username: form.username,
        password: form.password,
      });

      // 3️⃣ Store tokens
      localStorage.setItem("access", loginRes.data.access);
      localStorage.setItem("refresh", loginRes.data.refresh);

      // 4️⃣ Go to dashboard
      navigate("/dashboard");
    } catch (err) {
      console.log(err);
      setError("Signup failed. Try different username/email.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex justify-center items-center bg-slate-50 px-4">
      <div className="card w-full max-w-md p-8 shadow-lg border border-slate-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold heading text-slate-900">Create Account</h1>
          <p className="text-slate-500 mt-2">Join thousands of learners today</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
            <input
              className="input w-full"
              name="username"
              placeholder="Choose a username"
              value={form.username}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              className="input w-full"
              name="email"
              type="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              className="input w-full"
              type="password"
              name="password"
              placeholder="Create a password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <button disabled={loading} className="btn-primary w-full py-2.5 text-base shadow-md shadow-violet-200">
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-600">
          Already have an account?{' '}
          <Link to="/login" className="text-violet-600 font-medium hover:text-violet-700 hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
