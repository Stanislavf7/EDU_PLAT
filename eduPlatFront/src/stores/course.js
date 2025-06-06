import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '../api';

export const useCourseStore = defineStore('course', () => {
  const selectedCourse = ref(null);
  const courses = ref([]);

  const fetchCourses = async () => {
    try {
      const response = await api.get('/courses');
      courses.value = response.data.courses;
    } catch (error) {
      console.error('Failed to fetch courses:', error);
      throw error; // Для обработки ошибок в компоненте
    }
  };

  const fetchCourseById = async (id) => {
    try {
      const response = await api.get(`/courses/${id}`);
      selectedCourse.value = response.data;
    } catch (error) {
      console.error('Failed to fetch course:', error);
      selectedCourse.value = null;
      throw error;
    }
  };

  const setCourse = (course) => {
    selectedCourse.value = course;
  };

  return {
    courses,
    selectedCourse,
    fetchCourses,
    fetchCourseById,
    setCourse
  };
});