import React from 'react';
import { Star, Users, Clock, BookOpen } from 'lucide-react';

/**
 * PublicCourseCard Component
 * 
 * Digunakan untuk menampilkan kartu kursus di Landing Page (publik).
 * Menampilkan informasi seperti thumbnail, kategori, rating, jumlah siswa,
 * durasi, harga, dan instruktur.
 */
const PublicCourseCard = ({ course }) => {
  if (!course) return null;

  return (
    <div className="group bg-white rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 transition-all duration-300 overflow-hidden flex flex-col cursor-pointer">
      {/* Thumbnail Area */}
      <div className="relative w-full aspect-16/10 overflow-hidden">
        {course.thumbnail ? (
          <img
            src={course.thumbnail}
            alt={course.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-slate-200 flex items-center justify-center">
            <BookOpen className="text-slate-400" size={48} />
          </div>
        )}
        
        {/* Category Badge */}
        {course.category && (
          <div className="absolute top-3 left-3 px-3 py-1 bg-white/90 backdrop-blur-sm shadow-sm rounded-full text-xs font-semibold text-blue-600">
            {course.category}
          </div>
        )}

        {/* Price Badge */}
        <div className="absolute top-3 right-3 px-3 py-1 bg-emerald-500 shadow-sm rounded-full text-xs font-bold text-white">
          {course.price || 'Gratis'}
        </div>
      </div>

      {/* Content Area */}
      <div className="p-5 flex flex-col flex-1 gap-4">
        {/* Title */}
        <h3 className="font-bold text-gray-900 text-lg leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
          {course.title}
        </h3>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-y-2 gap-x-4 mt-auto">
          {/* Rating */}
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <Star className="text-amber-400 fill-amber-400" size={16} />
            <span className="font-medium text-gray-900">{course.rating}</span>
          </div>

          {/* Students */}
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <Users className="text-gray-400" size={16} />
            <span>{course.students.toLocaleString()} siswa</span>
          </div>

          {/* Modules/Lessons */}
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <BookOpen className="text-gray-400" size={16} />
            <span>{course.modules} Modul</span>
          </div>

          {/* Duration */}
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <Clock className="text-gray-400" size={16} />
            <span>{course.duration}</span>
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Instructor */}
        <div className="flex items-center gap-3">
          {course.instructor?.avatar ? (
            <img 
              src={course.instructor.avatar} 
              alt={course.instructor.name} 
              className="w-8 h-8 rounded-full object-cover border border-gray-100"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
              <Users size={14} className="text-slate-500" />
            </div>
          )}
          <span className="text-sm font-medium text-gray-700 truncate">
            {course.instructor?.name || 'Instruktur'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PublicCourseCard;
