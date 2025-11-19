import React, { useState } from "react";
import api from "../api/axios";

export default function Contact() {
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState("idle"); // idle, submitting, success, error
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg("");
    try {
      // Correct endpoint is auth/contact/ based on backend/config/urls.py
      await api.post("auth/contact/", formData);
      setStatus("success");
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (err) {
      setStatus("error");
      setErrorMsg(err.response?.data?.detail || "Something went wrong. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold heading text-slate-900">Contact Us</h1>
          <p className="mt-4 text-lg text-slate-600">Have questions? We'd love to hear from you.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="p-8 bg-violet-600 text-white flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-semibold mb-4">Get in touch</h3>
                <p className="text-violet-100 mb-8">
                  Fill out the form and our team will get back to you within 24 hours.
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📍</span>
                    <span>123 Learning St, Tech City</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📧</span>
                    <span>support@learnx.com</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📞</span>
                    <span>+91 98765 43210</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-8">
                <div className="flex gap-4">
                  {/* Social icons placeholder */}
                  <div className="w-8 h-8 bg-violet-500 rounded-full flex items-center justify-center">f</div>
                  <div className="w-8 h-8 bg-violet-500 rounded-full flex items-center justify-center">t</div>
                  <div className="w-8 h-8 bg-violet-500 rounded-full flex items-center justify-center">in</div>
                </div>
              </div>
            </div>

            <div className="p-8">
              {status === "success" ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-3xl mb-4">✓</div>
                  <h3 className="text-xl font-bold text-slate-900">Message Sent!</h3>
                  <p className="text-slate-600 mt-2">Thank you for contacting us. We'll be in touch shortly.</p>
                  <button onClick={() => setStatus("idle")} className="mt-6 btn-primary">Send another message</button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="input w-full"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="input w-full"
                      placeholder="you@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                    <input
                      type="text"
                      name="subject"
                      required
                      value={formData.subject}
                      onChange={handleChange}
                      className="input w-full"
                      placeholder="How can we help?"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
                    <textarea
                      name="message"
                      required
                      value={formData.message}
                      onChange={handleChange}
                      rows="4"
                      className="input w-full resize-none"
                      placeholder="Tell us more..."
                    ></textarea>
                  </div>

                  {status === "error" && (
                    <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                      {errorMsg}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={status === "submitting"}
                    className="btn-primary w-full justify-center"
                  >
                    {status === "submitting" ? "Sending..." : "Send Message"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
