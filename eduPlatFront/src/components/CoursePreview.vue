<template>
  <div class="preview-container">
    <div class="header-section">
      <h1 class="page-title">Предпросмотр курса</h1>
      <p class="page-description">Ознакомьтесь с деталями и содержанием курса.</p>
    </div>

    <div v-if="course" class="content-section">
      <Overview :course="course" :previewOnly="true" />
      <Step4 :course="course" />

      <div v-if="isEditedCourse && changes.length" class="changes-section">
        <h2 class="section-title">Изменения в этой версии</h2>
        <ul class="changes-list">
          <li v-for="(change, index) in changes" :key="index" :class="change.type">
            {{ change.message }}
          </li>
        </ul>
      </div>

      <div class="publish-section">
        <button class="publish-button" @click="onPublish" :disabled="publishing">
          {{ publishing ? 'Выкладывается...' : 'Выложить курс' }}
        </button>
        <p v-if="publishMessage" class="publish-message">{{ publishMessage }}</p>
      </div>
    </div>

    <div v-else class="loading-placeholder">
      <p>Загрузка курса...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { usePendingCourseStore } from '../stores/pendingCourses'
import api from '../api'
import Overview from './Overview.vue'
import Step4 from './makeSteps/Step4.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const pendingStore = usePendingCourseStore()

const course = ref(null)
const previousVersion = ref(null)
const courseId = route.params.id

const publishing = ref(false)
const publishMessage = ref('')

onMounted(async () => {
  if (userStore.role !== 'admin') {
    console.error('Доступ запрещён: только для администраторов')
    router.push('/')
    return
  }

  await fetchCourse()
})

async function fetchCourse() {
  try {
    const data = await pendingStore.fetchPendingCourseById(courseId)
    course.value = data

    if (course.value.original_course_id) {
      const versionResponse = await api.get(`/courses/${course.value.original_course_id}`)
      previousVersion.value = versionResponse.data || null
    } else {
      const versionResponse = await api.get(`/pending-courses/course-versions/${courseId}`)
      previousVersion.value = versionResponse.data.version || null
    }
  } catch (error) {
    console.error('Не удалось загрузить черновик курса:', error)
  }
}

const isEditedCourse = computed(() => !!previousVersion.value)

const changes = computed(() => {
  if (!isEditedCourse.value) return []
  const changesList = []
  const fields = ['title', 'description', 'fulldescription', 'prerequisites', 'difficulty']
  fields.forEach(field => {
    if (course.value[field] !== previousVersion.value[field]) {
      changesList.push({
        type: 'updated',
        message: `Обновлено ${field === 'title' ? 'название' : field === 'description' ? 'описание' : field === 'fulldescription' ? 'полное описание' : field === 'prerequisites' ? 'предварительные требования' : 'сложность'}: "${previousVersion.value[field]}" → "${course.value[field]}"`
      })
    }
  })
  const currentObjectives = course.value.objectives || []
  const prevObjectives = previousVersion.value.objectives || []
  currentObjectives.forEach(obj => {
    if (!prevObjectives.includes(obj)) {
      changesList.push({ type: 'added', message: `Добавлена цель: "${obj}"` })
    }
  })
  prevObjectives.forEach(obj => {
    if (!currentObjectives.includes(obj)) {
      changesList.push({ type: 'removed', message: `Удалена цель: "${obj}"` })
    }
  })
  const currentModules = course.value.modules || []
  const prevModules = previousVersion.value.modules || []
  currentModules.forEach((mod, i) => {
    const prevMod = prevModules[i]
    if (!prevMod) {
      changesList.push({ type: 'added', message: `Добавлен модуль: "${mod.title}"` })
    } else if (mod.title !== prevMod.title || mod.description !== prevMod.description) {
      changesList.push({
        type: 'updated',
        message: `Обновлён модуль ${i + 1}: "${prevMod.title}" → "${mod.title}"`
      })
    }
  })
  prevModules.forEach((mod, i) => {
    if (!currentModules[i]) {
      changesList.push({ type: 'removed', message: `Удалён модуль: "${mod.title}"` })
    }
  })
  return changesList
})

async function onPublish() {
  publishing.value = true
  publishMessage.value = ''
  try {
    await pendingStore.publishCourse(courseId)
    publishMessage.value = 'Курс успешно выложен!'
    setTimeout(() => router.push('/courses'), 1000)
  } catch (error) {
    publishMessage.value = error.response?.data?.error || 'Ошибка при публикации курса'
    console.error('Ошибка публикации:', error)
  } finally {
    publishing.value = false
  }
}
</script>

<style scoped>
.preview-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 16px;
  background-color: #f5f7fa;
}
.header-section {
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 16px;
}
.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #0d141c;
  margin: 0;
}
.page-description {
  font-size: 15px;
  color: #49709c;
  margin: 8px 0 0;
}
.content-section {
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
.changes-section {
  margin-top: 24px;
}
.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #0d141c;
  margin-bottom: 12px;
}
.changes-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.changes-list li {
  padding: 8px 12px;
  border-radius: 6px;
  margin-bottom: 8px;
  font-size: 14px;
}
.changes-list .added {
  background-color: #e6ffe6;
  color: #388e3c;
}
.changes-list .updated {
  background-color: #fff3e6;
  color: #d47c00;
}
.changes-list .removed {
  background-color: #ffe6e6;
  color: #cc3d3f;
}
.loading-placeholder {
  flex: 1;
  padding: 20px;
  font-size: 15px;
  color: #7890b0;
  text-align: center;
}
.publish-section {
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  align-items: center;
}
.publish-button {
  padding: 10px 20px;
  background-color: #28a745;
  color: #fff;
  border: none;
  border-radius: 5px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
}
.publish-button:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}
.publish-button:hover:not(:disabled) {
  background-color: #218838;
}
.publish-message {
  margin-top: 8px;
  color: #155724;
  background-color: #d4edda;
  padding: 8px 12px;
  border-radius: 4px;
}
</style>
