import React, { useEffect, useState} from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Button = ({ onClick, children, className = '', variant = 'primary' }) => {
  const baseStyles = 'px-4 py-2 rounded-lg transition duration-200 font-medium';
  const variants = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    edit: 'bg-amber-600 text-white hover:bg-amber-700'
  };

  return (
    <button
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

const CoursesPage = ({ userId = 'F004', role = 'lecturer' }) => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState({ enrolled: [], eligible: [], all: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refresh, setRefresh] = useState(false);

  const API_BASE_URL = 'http://localhost:4000/api-gateway/courses';

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        if (role === 'student') {
          const [enrolledRes, eligibleRes] = await Promise.all([
            axios.post(`${API_BASE_URL}/enrolled/`, { reg_number: userId }),
            axios.post(`${API_BASE_URL}/eligible/`, { reg_number: userId })
          ]);

          console.log('Enrolled Courses:', enrolledRes.data.result);
          console.log('Eligible Courses:', eligibleRes.data.result);

          setCourses({
            enrolled: enrolledRes.data.result,
            eligible: eligibleRes.data.result
          });
        } else if (role === 'lecturer') {
          const [assignedRes, allRes] = await Promise.all([
            axios.post(`${API_BASE_URL}/assigned/`, { reg_number: userId }),
            axios.get(`${API_BASE_URL}/all/`)
          ]);
          setCourses({
            enrolled: assignedRes.data.result,
            all: allRes.data.result
          });
        }
      } catch (err) {
        setError('Failed to fetch courses. Please try again later.');
        console.error('Error fetching courses:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [userId, role, refresh]);

  const handleAction = async (action, courseId) => {
    try {
      if (action === 'enroll') {
        console.log('Enrolling in course:', courseId);
        await axios.post(`${API_BASE_URL}/enroll`, { reg_number: userId, course_id: courseId });
      } else if (action === 'unenroll') {
        console.log('Unenrolling from course:', courseId);
        await axios.post(`${API_BASE_URL}/unenroll`, { reg_number: userId, course_id: courseId });
      } else if (action === 'edit') {
        // Navigate to edit page or open modal
        console.log('Edit course:', courseId);
        navigate(`/edit-course/${courseId}`);
      }

      // Refresh courses after action
      setRefresh(!refresh);
    } catch (err) {
      setError('Failed to perform action. Please try again.');
      console.error('Error performing action:', err);
    }
  };

  const renderCourseSection = (title, coursesArray, actionLabel, actionType) => (
    <div className="mb-16">
      <h2 className="text-3xl font-semibold text-gray-100 mb-6">{title}</h2>

      {/* Column Headings */}
      <div className="hidden md:grid grid-cols-6 gap-4 text-gray-300 mb-4 px-4 font-medium">
        <div>Title</div>
        <div>Code</div>
        <div>Credits</div>
        <div>Year</div>
        <div>Semester</div>
        <div className="text-right">Action</div>
      </div>

      {/* Course Rows */}
      <div className="space-y-4">
        {coursesArray?.map((course) => (
          <div
            key={course.id}
            className="grid grid-cols-6 items-center gap-4 bg-gray-800 p-4 rounded-xl shadow-lg hover:bg-gray-700 transition duration-200"
          >
            <div className="text-gray-100">{course.course_name}</div>
            <div className="text-gray-300">{course.course_code}</div>
            <div className="text-gray-300">{course.credits}</div>
            <div className="text-gray-300">{course.year}</div>
            <div className="text-gray-300">{course.semester}</div>
            <div className="text-right">
              <Button 
                onClick={() => handleAction(actionType, course.course_code)}
                variant={actionType === 'unenroll' ? 'danger' : actionType === 'edit' ? 'edit' : 'primary'}
              >
                {actionLabel}
              </Button>
            </div>
          </div>
        ))}
        {coursesArray?.length === 0 && (
          <div className="text-gray-400 text-center py-8">No courses found</div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-gray-100">Loading courses...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 md:px-10 py-12 bg-gray-900">
      <h1 className="text-4xl md:text-5xl font-bold text-center text-gray-100 mb-14">
        Course Management
      </h1>
      <div className='flex justify-end items-end mb-8'>
        {role === 'lecturer' && (
            <button
              onClick={() => navigate('/add-new-course')}
              className="px-6 py-3 text-bold bg-green-600 text-white rounded-lg hover:bg-green-700 transition mb-8"
            >
              Create New Course
            </button>
          )
        }
      </div>

      {role === 'student' ? (
        <>
          {renderCourseSection('Enrolled Courses', courses.enrolled, 'Unenroll', 'unenroll')}
          <hr className="border-gray-700 mb-16" />
          {renderCourseSection('Eligible Courses', courses.eligible, 'Enroll', 'enroll')}
        </>
      ) : (
        <>
          {renderCourseSection('Assigned Courses', courses.enrolled, 'Edit', 'edit')}
          <hr className="border-gray-700 mb-16" />
          {renderCourseSection('All Courses', courses.all, 'Edit', 'edit')}
        </>
      )}
    </div>
  );
};

export default CoursesPage;







// import React, { useEffect, useState } from 'react';

// const Button = ({ onClick, children, className = '' }) => (
//   <button
//     onClick={onClick}
//     className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition ${className}`}
//   >
//     {children}
//   </button>
// );

// const CoursesPage = ({ userId, role = 'student'}) => {
//   const [courses, setCourses] = useState({});

//   useEffect(() => {
//     if (role === 'student') {
//       setCourses({
//         enrolled: [
//           { id: 1, title: 'Data Structures', code: 'CS2202', credits: 3, year: 2, semester: 1 },
//           { id: 2, title: 'Computer Networks', code: 'CS3204', credits: 3, year: 3, semester: 2 },
//         ],
//         eligible: [
//           { id: 3, title: 'AI Fundamentals', code: 'CS4105', credits: 3, year: 4, semester: 1 },
//         ],
//       });
//     }
//   }, [role]);

//   const handleAction = (action, courseId) => {
//     console.log(`Performing ${action} for user ${userId} on course ${courseId}`);
//   };

//   const renderCourseSection = (title, coursesArray, actionLabel, actionType) => (
//     <div className="mb-16">
//       <h2 className="text-3xl font-semibold text-gray-700 mb-6">{title}</h2>

//       {/* Column Headings */}
//       <div className="hidden md:grid grid-cols-6 gap-4 text-gray-900 mb-4 px-4">
//         <div>Title</div>
//         <div>Code</div>
//         <div>Credits</div>
//         <div>Year</div>
//         <div>Semester</div>
//         <div className="text-right">Action</div>
//       </div>

//       {/* Course Rows */}
//       <div className="space-y-4">
//         {coursesArray.map((course) => (
//           <div
//             key={course.id}
//             className="grid grid-cols-6 items-center gap-4 bg-gray-900 text-blue-100 p-4 rounded-xl shadow-lg"
//           >
//             <div>{course.title}</div>
//             <div>{course.code}</div>
//             <div>{course.credits}</div>
//             <div>{course.year}</div>
//             <div>{course.semester}</div>
//             <div className="text-right">
//               <Button onClick={() => handleAction(actionType, course.id)}>
//                 {actionLabel}
//               </Button>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );

//   return (
//     <div className="min-h-screen px-10 py-12 bg-gradient-to-r from-gray-100 to-gray-700 text-white">
//       <h1 className="text-5xl font-bold text-center text-gray-700 mb-14">Courses</h1>

//       {role === 'student' && (
//         <>
//           {renderCourseSection('Enrolled Courses', courses.enrolled, 'Unenroll', 'unenroll')}
//           <hr className="border-gray-900 mb-16" />
//           {renderCourseSection('Eligible Courses', courses.eligible, 'Enroll', 'enroll')}
//         </>
//       )}
//     </div>
//   );
// };

// export default CoursesPage;
