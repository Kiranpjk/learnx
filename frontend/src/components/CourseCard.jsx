import { Link } from "react-router-dom";

export default function CourseCard({ course }) {
  return (
    <Link to={`/courses/${course.id}`} className="block h-full">
      <div className="card h-full flex flex-col group cursor-pointer hover:shadow-xl transition rounded-2xl overflow-hidden">
        <div className="relative overflow-hidden">
          {course.thumbnail ? (
            <img
              src={course.thumbnail}
              alt={course.title}
              className="w-full h-40 object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-40 bg-slate-100 grid place-items-center text-slate-400 text-sm">No thumbnail</div>
          )}
        </div>

        <div className="p-5 flex-1 flex flex-col">
          <h3 className="font-bold text-lg heading text-slate-800 group-hover:text-primary transition">
            {course.title}
          </h3>

          <p className="text-slate-500 text-sm mt-1 line-clamp-2">
            {course.short_description || course.description}
          </p>

          <div className="mt-auto pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600">
                {course.instructor || '—'}
              </span>
              <span className="px-3 py-1 text-xs bg-amber-50 rounded-full text-amber-700 border border-amber-200">
                {course.level || 'Beginner'}
              </span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm">⭐ {(course.rating_avg ?? 0).toFixed(1)} ({course.rating_count ?? 0})</span>
              <span className="text-sm font-semibold">{Number(course.price || 0) > 0 ? `₹${Number(course.price).toFixed(2)}` : 'Free'}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
