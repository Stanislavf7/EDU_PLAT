<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { usePendingCourseStore } from '../stores/pendingCourses';
import { useUserStore } from '../stores/user';
import api from '../api';
import Step1 from './makeSteps/Step1.vue';
import Step2 from './makeSteps/Step2.vue';
import Overview from './Overview.vue';
import Step4 from './makeSteps/Step4.vue';

const route = useRoute();
const router = useRouter();
const store = usePendingCourseStore();
const userStore = useUserStore();

const currentStep = ref(Number(route.params.step) || 1);
const courseId = route.params.courseId || `n${Date.now().toString()}`;
const form = ref({
  id: courseId,
  title: '',
  description: '',
  fullDescription: '',
  objectivesText: '',
  prerequisites: '',
  difficulty: 'Начальный',
  modules: [],
  creator_id: userStore.id,
  status: 'черновик',
  version: 1
});
const submitted = ref(false);
const error = ref(null);

onMounted(async () => {
  const courseId = route.params.courseId;
  if (courseId) {
    const course = await store.fetchPendingCourseById(courseId);
    if (course) {
      form.value = {
        id: course.id,
        title: course.title || '',
        description: course.description || '',
        fullDescription: course.fulldescription || '',
        objectivesText: course.objectives ? course.objectives.join('\n') : '',
        prerequisites: course.prerequisites || '',
        difficulty: course.difficulty || 'Начальный',
        modules: course.modules || [],
        creator_id: course.creator_id,
        status: course.status || 'черновик',
        version: course.version || 1
      };
    } else {
      console.error(`Не удалось загрузить черновик курса ${courseId}`);
    }
  }
});

function saveCourse(updatedData) {
  if (updatedData.modules) {
    form.value.modules = updatedData.modules;
  }
  const courseToSave = {
    id: form.value.id,
    title: form.value.title,
    description: form.value.description,
    fulldescription: form.value.fullDescription,
    objectives: form.value.objectivesText ? form.value.objectivesText.split('\n').filter(line => line.trim()) : [],
    prerequisites: form.value.prerequisites,
    difficulty: form.value.difficulty,
    modules: form.value.modules,
    creator_id: form.value.creator_id,
    status: form.value.status,
    version: form.value.version || 1
  };
  store.addOrUpdateCourse(courseToSave);
}

function nextStep() {
  if (currentStep.value < 4) {
    currentStep.value++;
    router.push({ name: 'MakeCourse', params: { courseId, step: currentStep.value } });
  }
}

function prevStep() {
  if (currentStep.value > 1) {
    currentStep.value--;
    router.push({ name: 'MakeCourse', params: { courseId, step: currentStep.value } });
  }
}

async function submitForReview() {
  try {
    error.value = null;
    form.value.status = 'на проверке';
    const courseToSave = {
      ...form.value,
      fulldescription: form.value.fullDescription,
      objectives: form.value.objectivesText
        ? form.value.objectivesText.split('\n').filter(line => line.trim())
        : [],
      version: form.value.version || 1
    };
    await store.addOrUpdateCourse(courseToSave);

    const isNewCourse = courseId.startsWith('n');
    const notificationType = isNewCourse ? 'course_created' : 'course_updated';
    const notificationMessage = `Пользователь ${userStore.username} ${
      isNewCourse ? 'создал' : 'обновил'
    } курс '${form.value.title}' с ID ${courseId}`;

    await api.post('/notifications', {
      type: notificationType,
      message: notificationMessage,
      user_id: userStore.id,
      metadata: JSON.stringify({ course_id: courseId, course_title: form.value.title })
    });

    submitted.value = true;
  } catch (error) {
    error.value = error.response?.data?.error || 'Ошибка при отправке курса';
    console.error('Ошибка:', error);
  }
}
</script>

<template>
  <div class="edit-course-container">
    
    <div v-if="currentStep === 1">
      <Step1 :form="form" @save="saveCourse" />
    </div>
    <div v-else-if="currentStep === 2">
      <Step2 :form="form" @save="saveCourse" />
    </div>
    <div v-else-if="currentStep === 3">
      <Overview :course="form" :previewOnly="true" />
    </div>
    <div v-else-if="currentStep === 4" class="step4-section">
      <Step4 :course="form" />
      <div class="submit-container">
        <button class="submit-button nav-button" @click="submitForReview" :disabled="submitted">
          {{ submitted ? 'Отправлено на проверку' : 'Отправить на проверку' }}
        </button>
        <p v-if="submitted" class="submitted-message">Курс отправлен на проверку!</p>
        <p v-if="error" class="error-message">{{ error }}</p>
      </div>
    </div>
    <div class="navigation-buttons">
      <button v-if="currentStep > 1" class="prev-button nav-button" @click="prevStep">← Назад</button>
      <button v-if="currentStep < 4" class="next-button nav-button" @click="nextStep">Далее →</button>
    </div>
  </div>
</template>

<style scoped>
p, h1 {
  margin: 0;
}

.edit-course-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f5f7fa;
  padding: 20px 160px;
}

.navigation-buttons {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.nav-button {
  height: 48px;
  padding: 0 20px;
  font-size: 16px;
  font-weight: 700;
  border: none;
  border-radius: 9999px;
  cursor: pointer;
}

.prev-button {
  background-color: #e7edf4;
  color: #101418;
}
.prev-button:hover {
  background-color: #d4dbe2;
}

.next-button,
.submit-button {
  background-color: #0b79ee;
  color: #f1f5f9;
}
.next-button:hover,
.submit-button:hover {
  background-color: #0967d2;
}

.step4-section {
  margin-top: 20px;
}

.submit-container {
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.submitted-message {
  margin-top: 8px;
  color: #155724;
  background-color: #d4edda;
  padding: 8px 12px;
  border-radius: 4px;
}
</style>