<script setup>
import { useRouter } from 'vue-router';
import { useUserStore } from '../stores/user';
import { useCourseStore } from '../stores/course';
import { ref, computed, onMounted } from 'vue';

const router = useRouter();
const userStore = useUserStore();
const courseStore = useCourseStore();

const startedCourseDetails = ref([]);
const error = ref(null);

onMounted(async () => {
  if (!userStore.isAuthenticated) {
    try {
      await userStore.checkAuth();
      if (!userStore.isAuthenticated) {
        router.push('/login');
        return;
      }
    } catch (err) {
      console.error('Не удалось проверить авторизацию:', err);
      router.push('/login');
      return;
    }
  }
  try {
    await userStore.fetchProgress();
    startedCourseDetails.value = [];
    for (const courseIdStr of Object.keys(userStore.progress)) {
      await courseStore.fetchCourseById(parseInt(courseIdStr));
      const course = courseStore.selectedCourse;
      if (course && !startedCourseDetails.value.find(c => c.id === course.id)) {
        startedCourseDetails.value.push(course);
      }
    }
  } catch (err) {
    console.error('Не удалось загрузить курсы:', err);
    error.value = 'Не удалось загрузить ваши курсы. Попробуйте снова.';
  }
});

const startedCourses = computed(() => {
  return startedCourseDetails.value
    .filter(course => course.is_published === true)
    .map(course => {
      const id = course.id;
      if (!course.modules) {
        console.warn(`Курс ${id} не содержит модулей`);
        return null;
      }
      const totalSteps = course.modules.reduce((sum, module) => {
        return sum + (Array.isArray(module.steps) ? module.steps.length : 0);
      }, 0);

      const completedStepsArr = userStore.progress[id] || [];
      const validCompleted = completedStepsArr.filter(stepNum => {
        return stepNum >= 1 && stepNum <= totalSteps;
      });

      const completedCount = validCompleted.length;
      const progress = totalSteps
        ? Math.round((completedCount / totalSteps) * 100)
        : 0;

      const lastStep = validCompleted.length
        ? Math.max(...validCompleted)
        : 1;

      return {
        id: String(id),
        title: course.title,
        description: course.description,
        progress,
        lastStep
      };
    })
    .filter(item => item);
});

const handleLogout = async () => {
  try {
    await userStore.logout();
    router.push('/login');
  } catch (err) {
    console.error('Не удалось выйти:', err);
    router.push('/login');
  }
};
</script>

<template>
  <div class="profile-container">
    <div class="content-container">
      <div v-if="error" class="error">{{ error }}</div>
      <div class="profile-section">
        <div class="profile-info">
          
          <img :src="userStore.avatarPath" alt="Аватар пользователя" class="photo-placeholder" />
          <div class="profile-details">
            <p class="profile-name">{{ userStore.username }}</p>
            <p class="profile-title">{{ userStore.email }}</p>
            <p class="profile-joined">Роль: {{ userStore.role }}</p>
          </div>
        </div>
      </div>
      <h2 class="section-title">Мои курсы</h2>
      <div class="courses-list">
        <div v-for="course in startedCourses" :key="course.id" class="course-card">
          <img src="../assets/cplusplus.svg" alt="Course Image" class="course-placeholder" />
          <div class="course-info">
            <div class="course-details">
              <p class="course-title">{{ course.title }}</p>
              <p class="course-description">{{ course.description }}</p>
            </div>
            <router-link
              :to="`/courses/${course.id}/progress/${course.lastStep}`"
              class="continue-button"
            >
              Продолжить
            </router-link>
          </div>
          <div class="progress-section">
            <p class="progress-label">Прогресс</p>
            <p class="progress-value">{{ course.progress }}%</p>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: course.progress + '%' }"></div>
            </div>
          </div>
        </div>
        <p v-if="!startedCourses.length" class="no-courses">Курсы ещё не начаты.</p>
      </div>
      <div class="settings-section">
        <router-link to="/edit-profile" class="continue-button">Редактировать профиль</router-link>
        <!-- <router-link to="/recovery" class="continue-button">Изменить пароль</router-link> -->
        <router-link to="/contact" class="continue-button">Сообщить о проблеме</router-link>
        <button class="logout-button" @click="handleLogout">Выйти</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
p {
  margin: 0;
}

.profile-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 20px 24px;
  background-color: #f5f7fa;
}

.content-container {
  display: flex;
  flex-direction: column;
  max-width: 960px;
  margin: 0 auto;
}

.error {
  font-size: 16px;
  color: #d32f2f;
  text-align: center;
  padding: 16px;
  background-color: #ffebee;
  border-radius: 8px;
  margin-bottom: 16px;
}

.profile-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.profile-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.photo-placeholder {
  width: 128px;
  height: 128px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #e7edf4;
  border-radius: 50%;
  font-size: 16px;
  color: #49709c;
}

.profile-details {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.profile-name {
  font-size: 24px;
  font-weight: 700;
  color: #0d141c;
}

.profile-title, .profile-joined {
  font-size: 16px;
  color: #49709c;
}

.section-title {
  font-size: 24px;
  font-weight: 700;
  color: #0d141c;
  padding: 24px 16px 16px;
}

.courses-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 0 16px;
}

.course-card {
  display: flex;
  gap: 24px;
  border-radius: 12px;
  background-color: #fff;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.course-placeholder {
  width: 120px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #e7edf4;
  border-radius: 8px;
  font-size: 14px;
  color: #49709c;
}

.course-info {
  flex: 2;
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;
}

.course-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.course-title {
  font-size: 18px;
  font-weight: 700;
  color: #0d141c;
}

.course-description {
  font-size: 14px;
  color: #49709c;
}

.continue-button {
  height: 40px;
  padding: 0 24px;
  background-color: #0b79ee;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  border-radius: 8px;
  text-decoration: none;
  display: flex;
  align-items: center;
  justify-content: center;
  width: fit-content;
}

.continue-button:hover {
  background-color: #0967d2;
}

.progress-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  justify-content: center;
}

.progress-label {
  font-size: 16px;
  font-weight: 600;
  color: #0d141c;
}

.progress-value {
  font-size: 14px;
  color: #49709c;
}

.progress-bar {
  height: 8px;
  background-color: #cedae8;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: #0b79ee;
  border-radius: 4px;
  transition: width 0.3s;
}

.no-courses {
  font-size: 16px;
  color: #49709c;
  padding: 16px;
  text-align: center;
}

.settings-section {
  display: flex;
  gap: 16px;
  padding: 24px 16px;
  justify-content: center;
}

.logout-button {
  height: 40px;
  padding: 0 24px;
  background-color: #d32f2f;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.logout-button:hover {
  background-color: #b71c1c;
}
</style>
