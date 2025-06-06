<script setup>
import { useCourseStore } from '../stores/course';
import { useUserStore } from '../stores/user';
import { usePendingCourseStore } from '../stores/pendingCourses';
import { useRouter } from 'vue-router';
import { computed, onMounted } from 'vue';

const courseStore = useCourseStore();
const userStore = useUserStore();
const pendingStore = usePendingCourseStore();
const router = useRouter();

onMounted(async () => {
  if (!userStore.isAuthenticated) {
    await userStore.checkAuth();
    if (!userStore.isAuthenticated) {
      router.push('/login');
      return;
    }
  }
  await courseStore.fetchCourses();
  await pendingStore.fetchPendingCourses();
});

const accessibleCourses = computed(() => {
  const courses = [...courseStore.courses, ...pendingStore.pendingCourses];
  if (userStore.role === 'admin') return courses;
  if (userStore.role === 'creator') return courses.filter(c => c.creator_id === userStore.id || c.instructor?.name === userStore.username);
  return [];
});

async function editCourse(course) {
  const courseIdStr = String(course.id).toLowerCase();
  if (courseIdStr.includes('c') || courseIdStr.includes('n')) {
    const currentCourse = await pendingStore.fetchPendingCourseById(courseIdStr);
    const newVersion = (currentCourse?.version || 1) + 1;
    const pendingCourse = {
      id: courseIdStr,
      original_course_id: currentCourse?.original_course_id || null,
      creator_id: userStore.id,
      version: newVersion
    };
    await pendingStore.addOrUpdateCourse(pendingCourse);
    router.push({ name: 'MakeCourse', params: { courseId: courseIdStr, step: 1 } });
  } else {
    const draftId = `c${courseIdStr}`;
    const pendingCourse = {
      id: draftId,
      original_course_id: courseIdStr,
      creator_id: userStore.id,
      version: 2
    };
    await pendingStore.addOrUpdateCourse(pendingCourse);
    router.push({ name: 'MakeCourse', params: { courseId: draftId, step: 1 } });
  }
}

async function addCourse() {
  const allCourses = [...courseStore.courses, ...pendingStore.pendingCourses];
  const numericIds = allCourses.map(c => {
    const idStr = String(c.id);
    const id = idStr.replace(/[^0-9]/g, '');
    return parseInt(id) || 0;
  });
  const maxId = Math.max(0, ...numericIds);
  const newId = `n${maxId + 1}`;
  const newCourse = {
    id: newId,
    title: '',
    description: '',
    modules: [],
    creator_id: userStore.id,
    status: 'draft',
    version: 1
  };
  await pendingStore.addOrUpdateCourse(newCourse);
  router.push({ name: 'MakeCourse', params: { courseId: newId, step: 1 } });
}

function getCourseLabel(courseId) {
  const idStr = String(courseId).toLowerCase();
  if (idStr.includes('c')) return '(изменённый)';
  if (idStr.includes('n')) return '(новый)';
  return '';
}
</script>

<template>
  <div class="edit-courses-container">
    <div class="content-container">
      <div class="header-section">
        <div class="header-text">
          <h1 class="page-title">Ваши курсы</h1>
          <p class="page-description">Управляйте и создавайте свои курсы</p>
        </div>
        <button v-if="['creator', 'admin'].includes(userStore.role)" @click="addCourse" class="add-course-button">
          Добавить курс
        </button>
      </div>
      <div v-if="accessibleCourses.length" class="course-list">
        <div v-for="course in accessibleCourses" :key="course.id" class="course-item">
          <div class="course-content">
            <div class="course-details">
              <p class="course-title">{{ course.title }} {{ getCourseLabel(course.id) }}</p>
              <p class="course-description">{{ course.description }}</p>
              <button @click="editCourse(course)" class="edit-button">Редактировать</button>
            </div>
          </div>
          <img src="../assets/cplusplus.svg" alt="Course Image" class="course-image-placeholder" />
        </div>
      </div>
      <div v-else class="no-courses">
        <p>Нет курсов для редактирования.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.edit-courses-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f5f7fa;
  padding: 20px 160px;
}

.content-container {
  display: flex;
  flex-direction: column;
  max-width: 960px;
  margin: 0 auto;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
}

.header-text {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  color: #101418;
}

.page-description {
  font-size: 14px;
  color: #5c728a;
}

.add-course-button {
  height: 48px;
  padding: 0 20px;
  background-color: #0b79ee;
  color: #f1f5f9;
  font-size: 16px;
  font-weight: 700;
  border: none;
  border-radius: 9999px;
  text-decoration: none;
  display: flex;
  align-items: center;
  cursor: pointer;
}

.add-course-button:hover {
  background-color: #0967d2;
}

.course-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.course-item {
  display: flex;
  justify-content: space-between;
  background-color: #ffffff;
  border: 1px solid #d4dbe2;
  border-radius: 12px;
  padding: 16px;
  gap: 16px;
}

.course-content {
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.course-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
}

.course-title {
  font-size: 18px;
  font-weight: 600;
  color: #101418;
}

.course-description {
  font-size: 14px;
  color: #5c728a;
  text-align: justify;
  max-width: 640px;
}

.edit-button {
  height: 40px;
  padding: 0 16px;
  background-color: #e7edf4;
  color: #101418;
  font-size: 14px;
  font-weight: 600;
  border: none;
  border-radius: 9999px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: 120px;
}

.edit-button:hover {
  background-color: #d4dbe2;
}


.course-image-placeholder {
  width: 100px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #e7edf4;
  border-radius: 8px;
  font-size: 14px;
  color: #49709c;
}

.no-courses {
  padding: 16px;
  font-size: 16px;
  color: #101418;
  text-align: center;
}
</style>