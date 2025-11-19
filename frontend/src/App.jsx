import { Routes, Route } from "react-router-dom";
import Courses from "./pages/Courses";
import CourseDetail from "./pages/CourseDetail";
import Home from "./pages/Home";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Contact from "./pages/Contact";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Lesson from "./pages/Lesson";
import LessonPlayer from "./pages/LessonPlayer";

import QuizList from "./pages/QuizList";
import QuizTake from "./pages/QuizTake";
import QuizResult from "./pages/QuizResult";
import AITutor from "./pages/AITutor"; // Added missing AI Studio route component
import AIChatWidget from "./components/AIChatWidget";


export default function App() {
  return (
    <>
      <Navbar />
      <AIChatWidget />
      <Routes>

        <Route path="/" element={<Home />} />
        <Route path="/courses/:id" element={<CourseDetail />} />
        <Route path="/ai" element={<AITutor />} />
        <Route path="/contact" element={<Contact />} />
        {/* Protected legacy lesson route */}
        <Route path="/lesson/:id" element={<ProtectedRoute><Lesson /></ProtectedRoute>} />
        {/* Public nested lesson player route */}
        <Route path="/courses/:id/lessons/:lessonId" element={<LessonPlayer />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/course/:id" element={<CourseDetail />} />
        {/* Removed duplicate /lesson/:id to avoid conflict */}

        <Route path="/quizzes" element={<QuizList />} />
        <Route path="/quizzes/:id" element={<QuizTake />} />
        <Route path="/quizzes/:id/result" element={<QuizResult />} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

      </Routes>
    </>
  );
}
