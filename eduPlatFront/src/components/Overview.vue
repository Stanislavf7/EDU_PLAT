<script setup>
import { useRouter, useRoute } from 'vue-router';
import { useCourseStore } from '../stores/course';
import { usePendingCourseStore } from '../stores/pendingCourses';
import { useUserStore } from '../stores/user';
import { onMounted, ref, defineProps } from 'vue';

const props = defineProps({
  previewOnly: Boolean,
  course: Object
});

const courseStore = useCourseStore();
const pendingStore = usePendingCourseStore();
const userStore = useUserStore();
const router = useRouter();
const route = useRoute();

const course = ref({
  id: null,
  title: 'Загрузка...',
  description: 'Загрузка...',
  fulldescription: 'Загрузка...',
  difficulty: 'Загрузка...',
  created_at: 'Загрузка...',
  modules: [],
  objectives: [],
  prerequisites: 'Загрузка...',
  instructor: { name: 'Загрузка...', title: 'Загрузка...' }
});

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' });
};

onMounted(async () => {
  if (props.course) {
    course.value = {
      id: props.course.id,
      title: props.course.title || 'Курс без названия',
      description: props.course.description || 'Описание отсутствует',
      fulldescription: props.course.fullDescription || props.course.fulldescription || 'Полное описание отсутствует',
      difficulty: props.course.difficulty || 'Начальный',
      created_at: props.course.created_at || new Date().toISOString().split('T')[0],
      objectives: props.course.objectivesText
        ? props.course.objectivesText.split('\n').filter(line => line.trim())
        : props.course.objectives || [],
      prerequisites: props.course.prerequisites || 'Предварительные требования отсутствуют',
      modules: props.course.modules || [],
      instructor: props.course.instructor || { name: userStore.username, title: 'Автор курса' }
    };
    return;
  }

  const id = route.params.id;

  if (id?.includes('c') || id?.includes('n')) {
    const pendingCourse = await pendingStore.fetchPendingCourseById(id);
    if (pendingCourse) {
      course.value = {
        id: pendingCourse.id,
        title: pendingCourse.title || 'Курс без названия',
        description: pendingCourse.description || 'Описание отсутствует',
        fulldescription: pendingCourse.fulldescription || 'Полное описание отсутствует',
        difficulty: pendingCourse.difficulty || 'Начальный',
        created_at: pendingCourse.created_at || new Date().toISOString().split('T')[0],
        objectives: Array.isArray(pendingCourse.objectives)
          ? pendingCourse.objectives
          : pendingCourse.objectivesText
            ? pendingCourse.objectivesText.split('\n').filter(line => line.trim())
            : [],
        prerequisites: pendingCourse.prerequisites || 'Предварительные требования отсутствуют',
        modules: pendingCourse.modules || [],
        instructor: pendingCourse.instructor || { name: userStore.username, title: 'Автор курса' }
      };
    }
  } else {
    await courseStore.fetchCourseById(id);
    if (courseStore.selectedCourse) {
      course.value = {
        ...courseStore.selectedCourse,
        created_at: formatDate(courseStore.selectedCourse.created_at || new Date()),
        objectives: Array.isArray(courseStore.selectedCourse.objectives)
          ? courseStore.selectedCourse.objectives
          : []
      };
    } else {
      console.warn('Курс не найден');
    }
  }
});

const startCourse = async () => {
  await userStore.startCourse(course.value);
  router.push({ name: 'Progress', params: { id: course.value.id, step: 1 } });
};
</script>

<template>
  <div class="course-container">
    <div class="content-container">
      <div class="header-section">
        <div class="header-text">
          <h1 class="course-title">{{ course.title }}</h1>
          <p class="course-description">{{ course.description }}</p>
        </div>
      </div>
      <h2 class="section-title">Описание курса</h2>
      <p class="section-text">{{ course.fulldescription }}</p>

      <h2 class="section-title">Цели обучения</h2>
      <div class="objectives-list">
        <ul>
          <label v-for="(objective, index) in course.objectives" :key="index" class="objective-item">
            <li>
              <p class="objective-text">{{ objective }}</p>
            </li>
          </label>
          <li v-if="!course.objectives.length">
            <p class="objective-text">Цели не определены.</p>
          </li>
        </ul>
      </div>

      <h2 class="section-title">Предварительные требования</h2>
      <p class="section-text">{{ course.prerequisites || 'Предварительные требования не требуются.' }}</p>

      <h2 class="section-title">Модули курса</h2>
      <div class="modules-list">
        <div v-for="(module, index) in course.modules" :key="index" class="module-card">
          <div class="module-info">
            <p class="module-title">{{ module.title }}</p>
            <p class="module-description">{{ module.description }}</p>
          </div>
        </div>
      </div>

      <h2 class="section-title">Преподаватель</h2>
      <div class="instructor-card">
        <img src="../assets/avatar.svg" alt="Instructor Photo" class="photo-placeholder" />
        <div class="instructor-info">
          <p class="instructor-name">{{ course.instructor.name }}</p>
          <p class="instructor-title">{{ course.instructor.title }}</p>
        </div>
      </div>

      <div v-if="!props.previewOnly" class="action-section">
        <button class="start-button" @click="startCourse">Начать курс</button>
      </div>
    </div>
  </div>
</template>


<style scoped>
p, h1, h2 {
  margin: 0;
}

.course-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #ffffff;
  padding: 20px 160px;
  text-align: start;
}

.content-container {
  display: flex;
  flex-direction: column;
  max-width: 960px;
  width: 100%;
  margin: 0 auto;
}

.header-section {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  padding: 16px;
  background-color: #ffffff;
}

.header-text {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 288px;
}

.course-title {
  font-size: 32px;
  font-weight: 700;
  color: #111418;
}

.course-description {
  font-size: 14px;
  color: #60748a;
}

.section-title {
  font-size: 22px;
  font-weight: 700;
  color: #111418;
  padding: 20px 16px 12px;
  margin: 0;
}

.section-text {
  font-size: 16px;
  color: #111418;
  padding: 4px 16px 12px;
}

.objectives-list {
  padding: 0;
}

.objective-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
}

.objective-text {
  font-size: 16px;
  color: #111418;
}

.modules-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0 16px;
}

.module-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 0;
  min-height: 72px;
  background-color: #ffffff;
}

.module-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background-color: #f0f2f5;
  border-radius: 8px;
  color: #111418;
}

.module-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.module-title {
  font-size: 16px;
  font-weight: 500;
  color: #111418;
}

.module-description {
  font-size: 14px;
  color: #60748a;
}

.instructor-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 16px;
  min-height: 72px;
  background-color: #ffffff;
}

.photo-placeholder {
  font-size: 14px;
  color: #111418;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.instructor-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.instructor-name {
  font-size: 16px;
  font-weight: 500;
  color: #111418;
}

.instructor-title {
  font-size: 14px;
  color: #60748a;
}

.action-section {
  padding: 12px 16px;
  display: flex;
  justify-content: center;
}

.start-button {
  display: inline-flex;
  min-width: 84px;
  height: 48px;
  padding: 0 20px;
  background-color: #0c77f2;
  color: #ffffff;
  font-size: 16px;
  font-weight: 700;
  border-radius: 8px;
  cursor: pointer;
  text-decoration: none;
  flex-wrap: wrap;
  align-content: center;
}

.start-button:hover {
  background-color: #0a63d0;
}
</style>