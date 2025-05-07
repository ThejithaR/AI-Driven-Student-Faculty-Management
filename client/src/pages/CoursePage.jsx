import React, { useEffect, useState } from 'react';

const Button = ({ onClick, children, className = '' }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition ${className}`}
  >
    {children}
  </button>
);

const CoursesPage = ({ userId, role = 'student'}) => {
  const [courses, setCourses] = useState({});

  useEffect(() => {
    if (role === 'student') {
      setCourses({
        enrolled: [
          { id: 1, title: 'Data Structures', code: 'CS2202', credits: 3, year: 2, semester: 1 },
          { id: 2, title: 'Computer Networks', code: 'CS3204', credits: 3, year: 3, semester: 2 },
        ],
        eligible: [
          { id: 3, title: 'AI Fundamentals', code: 'CS4105', credits: 3, year: 4, semester: 1 },
        ],
      });
    }
  }, [role]);

  const handleAction = (action, courseId) => {
    console.log(`Performing ${action} for user ${userId} on course ${courseId}`);
  };

  const renderCourseSection = (title, coursesArray, actionLabel, actionType) => (
    <div className="mb-16">
      <h2 className="text-3xl font-semibold text-gray-700 mb-6">{title}</h2>

      {/* Column Headings */}
      <div className="hidden md:grid grid-cols-6 gap-4 text-gray-900 mb-4 px-4">
        <div>Title</div>
        <div>Code</div>
        <div>Credits</div>
        <div>Year</div>
        <div>Semester</div>
        <div className="text-right">Action</div>
      </div>

      {/* Course Rows */}
      <div className="space-y-4">
        {coursesArray.map((course) => (
          <div
            key={course.id}
            className="grid grid-cols-6 items-center gap-4 bg-gray-900 text-blue-100 p-4 rounded-xl shadow-lg"
          >
            <div>{course.title}</div>
            <div>{course.code}</div>
            <div>{course.credits}</div>
            <div>{course.year}</div>
            <div>{course.semester}</div>
            <div className="text-right">
              <Button onClick={() => handleAction(actionType, course.id)}>
                {actionLabel}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen px-10 py-12 bg-gradient-to-r from-gray-100 to-gray-700 text-white">
      <h1 className="text-5xl font-bold text-center text-gray-700 mb-14">Courses</h1>

      {role === 'student' && (
        <>
          {renderCourseSection('Enrolled Courses', courses.enrolled, 'Unenroll', 'unenroll')}
          <hr className="border-gray-900 mb-16" />
          {renderCourseSection('Eligible Courses', courses.eligible, 'Enroll', 'enroll')}
        </>
      )}
    </div>
  );
};

export default CoursesPage;
