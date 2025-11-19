export default function LessonSidebar({ lessons, currentLesson, setCurrentLesson }) {
  return (
    <div className="bg-white shadow-lg rounded-xl p-4 h-[80vh] overflow-y-auto">

      <h2 className="text-xl font-bold mb-4 heading">Course Lessons</h2>

      <ul className="space-y-2">
        {lessons.map((lesson) => (
          <li
            key={lesson.id}
            onClick={() => setCurrentLesson(lesson)}
            className={`p-3 rounded-lg cursor-pointer border transition 
            ${currentLesson.id === lesson.id 
              ? "bg-primary text-white border-primary" 
              : "bg-slate-50 hover:bg-slate-100"}`}
          >
            <p className="font-semibold">{lesson.title}</p>
            <p className="text-xs opacity-80">{lesson.duration}</p>
          </li>
        ))}
      </ul>

    </div>
  );
}
