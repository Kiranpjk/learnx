import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

export default function Lesson() {
  const { id } = useParams();
  const [lesson, setLesson] = useState(null);

  useEffect(() => {
    async function loadLesson() {
      try {
        const token = localStorage.getItem("access");

        const res = await axios.get(
          `http://127.0.0.1:8000/api/courses/lesson/${id}/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setLesson(res.data);
      } catch (err) {
        console.log(err);
      }
    }

    loadLesson();
  }, [id]);

  if (!lesson) return <p className="text-center mt-10">Loading lesson...</p>;

  return (
    <div className="max-w-4xl mx-auto mt-10 space-y-6">
      
      <h1 className="text-3xl font-bold text-primary">{lesson.title}</h1>

      {lesson.video_url && (
        <div className="w-full aspect-video bg-black rounded-lg overflow-hidden">
          <iframe
            className="w-full h-full"
            src={lesson.video_url}
            allowFullScreen
          ></iframe>
        </div>
      )}

      <div className="card">
        <p className="text-slate-700 whitespace-pre-line">
          {lesson.content}
        </p>
      </div>
    </div>
  );
}
