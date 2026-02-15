import { Users } from 'lucide-react';

// Import Child Components
import Rating from '@/components/ui/Rating';
import CourseThumbnail from './CourseThumbnail';
import CourseInstructor from './CourseInstructor';
import CourseMetaInfo from './CourseMetaInfo';
import CourseFooter from './CourseFooter';

/**
 * CourseCard Component
 * Card component untuk menampilkan informasi course.
 * Parent component yang mengatur layout dan mengimpor child components.
 * 
 * @param {object} course - Data course
 */
const CourseCard = ({ course }) => {
  const handleWishlist = (e) => {
    e.stopPropagation();
    console.log('Wishlist clicked:', course.id);
  };

  const handleDetailClick = () => {
    console.log('Detail clicked:', course.id);
  };

  return (
    <div className="group flex flex-col bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full">

      {/* 1. Thumbnail Section */}
      <CourseThumbnail
        thumbnail={course.thumbnail}
        alt={course.title}
        category={course.category}
        onWishlistClick={handleWishlist}
      />

      {/* 2. Content Section */}
      <div className="flex flex-col grow p-5">

        {/* Meta Header: Rating & Students */}
        <div className="flex items-center justify-between mb-3 text-xs text-slate-500">
          <Rating rating={course.rating} />
          <div className="flex items-center gap-1">
            <Users size={14} />
            <span>{course.students.toLocaleString()} Siswa</span>
          </div>
        </div>

        {/* Title (Truncated to 2 lines) */}
        <h3 className="font-bold text-lg text-slate-900 leading-snug mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {course.title}
        </h3>

        {/* Instructor */}
        <CourseInstructor
          name={course.instructor.name}
          avatar={course.instructor.avatar}
          className="mb-4"
        />

        {/* Divider & Meta Info */}
        <div className="mt-auto pt-4 border-t border-slate-100">
          <CourseMetaInfo
            modules={course.modules}
            duration={course.duration}
          />
        </div>
      </div>

      {/* 3. Footer Action Section */}
      <CourseFooter
        price={course.price}
        onButtonClick={handleDetailClick}
      />

    </div>
  );
};

export default CourseCard;