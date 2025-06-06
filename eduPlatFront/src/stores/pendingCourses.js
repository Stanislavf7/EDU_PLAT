import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../api'

export const usePendingCourseStore = defineStore('pendingCourses', () => {
  const pendingCourses = ref([])              // Список всех черновиков (метаданные)
  const selectedPendingCourse = ref(null)     // Полные данные черновика

  // Загрузка метаданных всех черновиков
  const fetchPendingCourses = async () => {
    try {
      const response = await api.get('/pending-courses')
      pendingCourses.value = response.data.courses || []
    } catch (error) {
      console.error('Failed to fetch pending courses:', error)
    }
  }

  // Загрузка полного черновика по ID
  const fetchPendingCourseById = async (id) => {
    try {
      const response = await api.get(`/pending-courses/${id}`)
      selectedPendingCourse.value = response.data
      return response.data
    } catch (error) {
      console.error(`Failed to fetch pending course ${id}:`, error)
      return null
    }
  }

  // Создание или обновление черновика
  const addOrUpdateCourse = async (course) => {
    try {
      const response = await api.post('/pending-courses', course)
      const updatedCourseMeta = response.data.course
      selectedPendingCourse.value = { ...course, version: updatedCourseMeta.version }
      // Обновляем список метаданных
      const index = pendingCourses.value.findIndex(c => c.id === updatedCourseMeta.id)
      if (index >= 0) {
        pendingCourses.value[index] = updatedCourseMeta
      } else {
        pendingCourses.value.push(updatedCourseMeta)
      }
    } catch (error) {
      console.error('Failed to save pending course:', error)
    }
  }

  // **Новый метод: публикуем курс**
  const publishCourse = async (id) => {
    try {
      const response = await api.post(`/pending-courses/${id}/publish`)
      // В ответе: { course_id, message }
      // Удаляем из списка pendingCourses и сбрасываем selected
      pendingCourses.value = pendingCourses.value.filter(c => c.id !== id)
      if (selectedPendingCourse.value?.id === id) {
        selectedPendingCourse.value = null
      }
      return response.data
    } catch (error) {
      console.error('Failed to publish pending course:', error)
      throw error
    }
  }

  return {
    pendingCourses,
    selectedPendingCourse,
    fetchPendingCourses,
    fetchPendingCourseById,
    addOrUpdateCourse,
    publishCourse    // экспортируем новый метод
  }
})
