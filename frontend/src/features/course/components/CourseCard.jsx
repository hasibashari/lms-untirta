
import React from 'react';
import { User, Users, BookOpen } from 'lucide-react';

/**
 * CourseCard - Modern reusable course card (Coursera/Udemy style)
 *
 * Works across all roles: admin, dosen (lecturer), mahasiswa (student).
 * Supports both individual props and a `course` object prop for flexibility.
 *
 * Cover logic: if coverImage exists → show image, else → random bg color.
 */
export default function CourseCard({
  // Support passing a course object directly (used by landing page)
  course,
  // Individual props (used by dashboard pages)
  title: titleProp,
  code: codeProp,
  coverImage: coverImageProp,
  teacher: teacherProp,
  semester: semesterProp,
  sks: sksProp,
  studentsCount: studentsCountProp,
  materialsCount: materialsCountProp,
  actions = [],
  showActionsOnHover = true,
  onClick,
  className = '',
}) {
  const isClickable = typeof onClick === 'function';
  // Resolve props — individual props take priority over course object
  const title = titleProp || course?.title || '';
  const code = codeProp || course?.code || '';
  const coverImage = coverImageProp || course?.coverImage || null;
  const teacher = teacherProp || course?.teacher || null;
  const semester = semesterProp ?? course?.semester;
  const sks = sksProp ?? course?.sks;
  const studentsCount = studentsCountProp ?? course?._count?.students ?? course?.studentsCount ?? 0;
  const materialsCount = materialsCountProp ?? course?._count?.materials ?? course?.materialsCount ?? 0;
  const teacherName = typeof teacher === 'string' ? teacher : teacher?.name;

  // Consistent color based on code hash
  const COVER_COLORS = [
    'bg-blue-600',
    'bg-emerald-600',
    'bg-violet-600',
    'bg-amber-600',
    'bg-rose-600',
    'bg-cyan-600',
    'bg-teal-600',
    'bg-indigo-600',
    'bg-fuchsia-600',
    'bg-sky-600',
  ];
  const colorIdx = code
    ? code.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % COVER_COLORS.length
    : 0;

  return (
    <div
      className={`group bg-white rounded-xl shadow-sm border border-gray-100 transition-all duration-200 overflow-hidden flex flex-col ${isClickable ? 'cursor-pointer hover:shadow-md' : 'cursor-default'} ${className}`}
      onClick={onClick}
    >
      {/* ── Cover Area (dominant ~60%) ── */}
      {coverImage ? (
        <div className="relative w-full aspect-16/10 overflow-hidden">
          <img
            src={coverImage}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {actions.length > 0 && <ActionButtons actions={actions} showOnHover={showActionsOnHover} />}
        </div>
      ) : (
        <div className={`relative w-full aspect-16/10 ${COVER_COLORS[colorIdx]} flex items-end`}>
          {/* Subtle decorative pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-white/30" />
            <div className="absolute -left-4 -bottom-4 w-24 h-24 rounded-full bg-white/20" />
          </div>
          {/* Course code watermark */}
          <span className="relative px-4 pb-3 text-white/30 font-black text-3xl tracking-wider select-none">
            {code}
          </span>
          {actions.length > 0 && <ActionButtons actions={actions} showOnHover={showActionsOnHover} />}
        </div>
      )}

      {/* ── Information Area (compact ~40%) ── */}
      <div className="px-4 pt-3 pb-4 flex flex-col gap-2 flex-1">
        {/* Title */}
        <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">
          {title}
        </h3>

        {/* Metadata: code · semester · sks */}
        <div className="flex items-center flex-wrap gap-x-1.5 text-[11px] text-gray-400 font-medium">
          <span>{code}</span>
          <span>·</span>
          <span>Semester {semester}</span>
          <span>·</span>
          <span>{sks} SKS</span>
        </div>

        {/* Lecturer */}
        {teacherName && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <User size={12} className="shrink-0 text-gray-400" />
            <span className="truncate">{teacherName}</span>
          </div>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-3 mt-auto pt-1 text-[11px] text-gray-400">
          {studentsCount > 0 && (
            <span className="flex items-center gap-1">
              <Users size={12} />
              {studentsCount} siswa
            </span>
          )}
          {materialsCount > 0 && (
            <span className="flex items-center gap-1">
              <BookOpen size={12} />
              {materialsCount} materi
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/** Floating action buttons overlay for the cover area */
function ActionButtons({ actions, showOnHover }) {
  return (
    <div className={`absolute top-2 right-2 flex gap-1 z-10 transition-opacity ${showOnHover ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
      {actions.map((action, idx) => (
        <button
          key={idx}
          type="button"
          className="p-1.5 rounded-lg bg-white/90 hover:bg-white shadow-sm backdrop-blur-sm text-gray-600 hover:text-gray-900 transition"
          onClick={(e) => {
            e.stopPropagation();
            action.onClick?.();
          }}
          title={action.label}
        >
          <action.icon size={14} />
        </button>
      ))}
    </div>
  );
}