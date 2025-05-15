import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';

const EditCourse = () => {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const [lecturers, setLecturers] = useState({ assigned: [], others: [] });
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    year: 1,
    semester: 1,
    dayOfWeek: 'Monday',
    startTime: '',
    assignedLecturers: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [courseRes, lecturersRes] = await Promise.all([
          axios.get(`http://localhost:4000/api-gateway/courses/${courseId}`),
          axios.get('http://localhost:4000/api-gateway/lecturers')
        ]);

        const assignedRes = await axios.post('http://localhost:4000/api-gateway/courses/assigned-lecturers', {
          courseId
        });

        const assignedIds = assignedRes.data.map(lecturer => lecturer.id);
        
        setFormData({
          ...courseRes.data,
          assignedLecturers: assignedIds
        });

        setLecturers({
          assigned: assignedRes.data,
          others: lecturersRes.data.filter(l => !assignedIds.includes(l.id))
        });

        setLoading(false);
      } catch (err) {
        setError('Failed to fetch course data');
        setLoading(false);
      }
    };

    fetchData();
  }, [courseId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLecturerMove = (lecturer, fromSection, toSection) => {
    setLecturers(prev => ({
      [fromSection]: prev[fromSection].filter(l => l.id !== lecturer.id),
      [toSection]: [...prev[toSection], lecturer]
    }));

    setFormData(prev => ({
      ...prev,
      assignedLecturers: toSection === 'assigned'
        ? [...prev.assignedLecturers, lecturer.id]
        : prev.assignedLecturers.filter(id => id !== lecturer.id)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:4000/api-gateway/courses/${courseId}`, formData);
      navigate('/courses');
    } catch (err) {
      setError('Failed to update course');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-gray-100">Loading...</div>
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
    <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-100 mb-8">Edit Course</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300">Course Code</label>
              <input
                type="text"
                value={courseId}
                className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-gray-500 cursor-not-allowed"
                disabled
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">Course Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-gray-100 focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
                className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-gray-100 focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-300">Year</label>
                <select
                  name="year"
                  value={formData.year}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-gray-100 focus:border-indigo-500 focus:ring-indigo-500"
                >
                  {[1, 2, 3, 4].map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300">Semester</label>
                <select
                  name="semester"
                  value={formData.semester}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-gray-100 focus:border-indigo-500 focus:ring-indigo-500"
                >
                  {[1, 2].map(sem => (
                    <option key={sem} value={sem}>{sem}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-300">Day of Week</label>
                <select
                  name="dayOfWeek"
                  value={formData.dayOfWeek}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-gray-100 focus:border-indigo-500 focus:ring-indigo-500"
                >
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300">Start Time</label>
                <input
                  type="time"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-gray-100 focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-200 mb-2">Assigned Lecturers</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {lecturers.assigned.map(lecturer => (
                    <div
                      key={lecturer.id}
                      className="p-3 bg-indigo-600 rounded-lg text-white"
                    >
                      <div className="font-medium">{lecturer.name}</div>
                      <div className="text-sm opacity-75">{lecturer.department}</div>
                      <button
                        type="button"
                        onClick={() => handleLecturerMove(lecturer, 'assigned', 'others')}
                        className="mt-2 text-sm text-white hover:text-gray-200"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-200 mb-2">Other Lecturers</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {lecturers.others.map(lecturer => (
                    <div
                      key={lecturer.id}
                      className="p-3 bg-gray-700 rounded-lg text-gray-300"
                    >
                      <div className="font-medium">{lecturer.name}</div>
                      <div className="text-sm opacity-75">{lecturer.department}</div>
                      <button
                        type="button"
                        onClick={() => handleLecturerMove(lecturer, 'others', 'assigned')}
                        className="mt-2 text-sm text-indigo-400 hover:text-indigo-300"
                      >
                        Assign
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/courses')}
              className="px-4 py-2 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCourse;