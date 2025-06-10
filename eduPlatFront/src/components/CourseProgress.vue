<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useCourseStore } from '../stores/course';
import { useUserStore } from '../stores/user';
import CodeMirrorEditor from '../components/CodeMirrorEditor.vue';
import api from '../api';

const route = useRoute();
const router = useRouter();
const courseStore = useCourseStore();
const userStore = useUserStore();

const courseId = computed(() => Number(route.params.id) || 0);
const currentStep = ref(parseInt(route.params.step) || 1);
const userAnswer = ref('');
const quizSelection = ref(null);
const quizMultiSelection = ref([]);
const userCode = ref('');
const feedback = ref(null);
const showCompletionMessage = ref(false);

const course = computed(() => courseStore.selectedCourse || {});
const flatSteps = computed(() => {
  const steps = [];
  if (course.value?.modules?.length) {
    course.value.modules.forEach((module, mIdx) => {
      if (module?.steps?.length) {
        module.steps.forEach((step, sIdx) => {
          steps.push({ moduleIdx: mIdx, stepIdx: sIdx, ...step });
        });
      }
    });
  }
  return steps;
});

const groupedSteps = computed(() => {
  const groups = [];
  if (course.value?.modules?.length) {
    course.value.modules.forEach((module, mIdx) => {
      groups.push({ module, steps: flatSteps.value.filter(s => s.moduleIdx === mIdx) });
    });
  }
  return groups;
});

const currentStepData = computed(() => flatSteps.value[currentStep.value - 1] || {});
const isStepCompleted = computed(() => userStore.progress?.[courseId.value]?.includes(currentStep.value) || false);
const isCourseLoaded = computed(() => !!course.value?.id && flatSteps.value.length > 0);
const isCourseFinished = computed(() => flatSteps.value.length && userStore.progress?.[courseId.value]?.length === flatSteps.value.length);
const correctMultiOptions = computed(() =>
  currentStepData.value.type === 'quiz-multi'
    ? currentStepData.value.options
      ?.map((opt, idx) => ({ idx, text: opt.text, correct: opt.correct }))
      ?.filter(opt => opt.correct)
      .map(opt => opt.text) || []
    : []
);

onMounted(async () => {
  await userStore.checkAuth();
  if (!userStore.isAuthenticated) {
    feedback.value = 'Пожалуйста, войдите в аккаунт';
    router.push({ name: 'Login' });
    return;
  }

  await courseStore.fetchCourseById(courseId.value);
  if (!isCourseLoaded.value) {
    feedback.value = 'Курс не найден или загружается...';
    router.push({ name: 'Courses' });
    return;
  }

  await userStore.startCourse(course.value);

  if (currentStep.value > flatSteps.value.length) {
    currentStep.value = 1;
    router.push({ name: 'Progress', params: { id: courseId.value, step: 1 } });
  }

  if (currentStepData.value?.type === 'text' && !isStepCompleted.value) {
    await userStore.completeStep(courseId.value, currentStep.value);
  }

  if (currentStepData.value?.type === 'fix-error') {
    userCode.value = currentStepData.value.initialCode || '';
  }
});

watch(() => route.params.step, async (newStep) => {
  const step = parseInt(newStep) || 1;
  currentStep.value = isCourseLoaded.value && step <= flatSteps.value.length ? step : 1;
  userAnswer.value = '';
  quizSelection.value = null;
  quizMultiSelection.value = [];
  feedback.value = null;
  showCompletionMessage.value = false;

  if (!userStore.isAuthenticated) {
    feedback.value = 'Пожалуйста, войдите в аккаунт';
    router.push({ name: 'Login' });
    return;
  }

  if (currentStepData.value?.type === 'text' && !isStepCompleted.value) {
    await userStore.completeStep(courseId.value, currentStep.value);
  }

  if (currentStepData.value?.type === 'fix-error') {
    userCode.value = currentStepData.value.initialCode || '';
  }
});

watch(courseId, async (newId) => {
  await courseStore.fetchCourseById(newId);
  if (!isCourseLoaded.value) {
    feedback.value = 'Курс не найден или загружается...';
    router.push({ name: 'Courses' });
    return;
  }
  await userStore.startCourse(course.value);
});

const goToStep = (step) => {
  if (!isCourseLoaded.value) {
    feedback.value = 'Курс не загружен';
    return;
  }
  if (!userStore.isAuthenticated) {
    feedback.value = 'Пожалуйста, войдите в аккаунт';
    router.push({ name: 'Login' });
    return;
  }
  if (step >= 1 && step <= flatSteps.value.length && canAccessStep(step)) {
    router.push({ name: 'Progress', params: { id: courseId.value, step } });
  } else {
    feedback.value = 'Завершите текущий шаг, чтобы продолжить.';
  }
};

const canAccessStep = (step) => {
  if (!isCourseLoaded.value || step === 1) return true;
  for (let i = 1; i < step; i++) {
    if (!userStore.progress?.[courseId.value]?.includes(i) && flatSteps.value[i - 1]?.type !== 'text') {
      return false;
    }
  }
  return true;
};

const handleNextStep = () => {
  if (!isCourseLoaded.value) {
    feedback.value = 'Курс не загружен';
    return;
  }
  if (!userStore.isAuthenticated) {
    feedback.value = 'Пожалуйста, войдите в аккаунт';
    router.push({ name: 'Login' });
    return;
  }
  if (isCourseFinished.value && currentStep.value === flatSteps.value.length) {
    showCompletionMessage.value = true;
    return;
  }
  goToStep(currentStep.value + 1);
};

const submitAnswer = async () => {
  if (!isCourseLoaded.value || isStepCompleted.value) return;
  if (!userStore.isAuthenticated) {
    feedback.value = 'Пожалуйста, войдите в аккаунт';
    router.push({ name: 'Login' });
    return;
  }
  feedback.value = null;
  const step = currentStepData.value;
  if (step.type === 'text') {
    await userStore.completeStep(courseId.value, currentStep.value);
    feedback.value = 'Шаг завершён!';
    return;
  }
  if (step.type === 'quiz-single') {
    if (quizSelection.value === null) {
      feedback.value = 'Выберите вариант.';
      return;
    }
    if (quizSelection.value === step.correctOption) {
      await userStore.completeStep(courseId.value, currentStep.value);
      feedback.value = 'Верно!';
    } else {
      feedback.value = 'Неверно. Попробуйте снова.';
    }
    return;
  }
  if (step.type === 'quiz-multi') {
    if (!quizMultiSelection.value.length) {
      feedback.value = 'Выберите хотя бы один вариант.';
      return;
    }
    const correctOptions = step.options
      ?.map((opt, idx) => opt.correct ? idx : null)
      ?.filter(idx => idx !== null) || [];
    const isCorrect = quizMultiSelection.value.sort().join('-') === correctOptions.sort().join('-');
    if (isCorrect) {
      await userStore.completeStep(courseId.value, currentStep.value);
      feedback.value = 'Верно!';
    } else {
      feedback.value = 'Неверно. Попробуйте снова.';
    }
    return;
  }
  if (step.type === 'answer') {
    if (!userAnswer.value.trim()) {
      feedback.value = 'Введите ответ.';
      return;
    }
    if (userAnswer.value.trim() === step.correctAnswer?.trim()) {
      await userStore.completeStep(courseId.value, currentStep.value);
      feedback.value = 'Верно!';
    } else {
      feedback.value = 'Неверно. Попробуйте снова.';
    }
    return;
  }
  if (step.type === 'fix-error') {
    if (!userCode.value.trim()) {
      feedback.value = 'Введите код.';
      return;
    }
    try {
      const response = await api.post('/courses/validate-code', {
        courseId: courseId.value,
        stepIndex: currentStep.value,
        userCode: userCode.value
      });
      if (response.data.correct) {
        await userStore.completeStep(courseId.value, currentStep.value);
        feedback.value = 'Верно! Все ошибки исправлены.';
      } else {
        feedback.value = response.data.message || 'Код содержит ошибки. Попробуйте снова.';
      }
    } catch (error) {
      feedback.value = 'Ошибка при проверке кода. Попробуйте снова.';
      console.error('Code validation failed:', error);
    }
  }
};
</script>

<template>
  <div v-if="!isCourseLoaded">
    <p>Загрузка курса или курс не найден...</p>
  </div>
  <div v-else-if="showCompletionMessage" class="progress-container">
    <div class="completion-message">
      <h1>Поздравляем!</h1>
      <p>Вы успешно завершили курс "{{ course.title }}".</p>
      <button class="nav-button" @click="router.push({ name: 'Courses' })">Вернуться к курсам</button>
    </div>
  </div>
  <div v-else class="progress-container">
    <div class="content-container">
      <div class="sidebar">
        <div class="lessons-list">
          <div v-for="group in groupedSteps" :key="group.module.title" class="module-group">
            <p class="module-title">{{ group.module.title }}</p>
            <div v-for="(step, idx) in group.steps" :key="idx" class="lesson-item" :class="{
              active: currentStep === flatSteps.indexOf(step) + 1,
              completed: userStore.progress[courseId]?.includes(flatSteps.indexOf(step) + 1),
              disabled: !canAccessStep(flatSteps.indexOf(step) + 1)
            }" @click="goToStep(flatSteps.indexOf(step) + 1)">
              <p class="list-lesson-title">Шаг {{ step.stepIdx + 1 }}</p>
            </div>
          </div>
        </div>
      </div>
      <div class="main-content">
        <div class="progress-indicator">
          <p>Прогресс: {{ userStore.progress[courseId]?.length || 0 }}/{{ flatSteps.length }}</p>
          <div class="progress-bar">
            <div class="progress-fill"
              :style="{ width: ((userStore.progress[courseId]?.length || 0) / flatSteps.length * 100) + '%' }"></div>
          </div>
        </div>
        <div class="main-inner">
          <div class="breadcrumb">
            <router-link :to="{ name: 'Overview', params: { id: courseId } }">{{ course.title || 'Курс' }}</router-link>
            <span>/</span>
            <span>{{ course.modules[currentStepData.moduleIdx]?.title || 'Модуль' }}: Шаг {{ currentStepData.stepIdx + 1
              }}</span>
          </div>
          <div>
            <h1>{{ course.modules[currentStepData.moduleIdx]?.title || 'Модуль' }}</h1>
            <p>{{ course.modules[currentStepData.moduleIdx]?.description || '' }}</p>
          </div>
          <div v-if="currentStepData.type === 'text'">
            <p class="lesson-text">{{ currentStepData.content || '' }}</p>
          </div>
          <div v-else-if="currentStepData.type === 'quiz-single'">
            <p class="quiz-question">{{ currentStepData.question || '' }}</p>
            <div v-if="isStepCompleted">
              <p class="feedback-correct">Правильный ответ: {{
                currentStepData.options[currentStepData.correctOption]?.text || '' }}</p>
            </div>
            <div v-else>
              <label v-for="(option, idx) in currentStepData.options || []" :key="idx" class="quiz-label">
                <input type="radio" v-model="quizSelection" :value="idx" />
                {{ option.text || '' }}
              </label>
            </div>
          </div>
          <div v-else-if="currentStepData.type === 'quiz-multi'">
            <p class="quiz-question">{{ currentStepData.question || '' }}</p>
            <div v-if="isStepCompleted">
              <p class="feedback-correct">Правильные ответы:</p>
              <ul>
                <li class="feedback-correct-li" v-for="text in correctMultiOptions" :key="text">{{ text }}</li>
              </ul>
            </div>
            <div v-else>
              <label v-for="(option, idx) in currentStepData.options || []" :key="idx" class="quiz-label">
                <input type="checkbox" v-model="quizMultiSelection" :value="idx" />
                {{ option.text || '' }}
              </label>
            </div>
          </div>
          <div v-else-if="currentStepData.type === 'answer'">
            <p class="quiz-question">{{ currentStepData.question || '' }}</p>
            <div v-if="isStepCompleted">
              <p class="feedback-correct">Правильный ответ: {{ currentStepData.correctAnswer || '' }}</p>
            </div>
            <div v-else>
              <label>
                <textarea v-model="userAnswer" placeholder="Введите ответ" class="quiz-input"></textarea>
              </label>
            </div>
          </div>
          <div v-else-if="currentStepData.type === 'fix-error'">
            <p class="quiz-question">{{ currentStepData.question || currentStepData.taskText || 'Исправьте ошибки в следующем C++ коде:' }}</p>
            <div v-if="isStepCompleted">
              <p class="feedback-correct">Код исправлен правильно!</p>
              <CodeMirrorEditor :model-value="currentStepData.correctCode" :read-only="true" />
            </div>
            <div v-else>
              <CodeMirrorEditor v-model="userCode" />
            </div>
          </div>
          <p v-if="feedback"
            :class="{ 'feedback-correct': feedback.includes('Верно') || feedback.includes('исправлены'), 'feedback-incorrect': !feedback.includes('Верно') && !feedback.includes('исправлены') }">
            {{ feedback }}
          </p>
          <div class="navigation">
            <button class="nav-button previous" @click="goToStep(currentStep - 1)" :disabled="currentStep <= 1">←
              Назад</button>
            <button v-if="!isStepCompleted && currentStepData.type !== 'text'" class="nav-button submit"
              @click="submitAnswer">Проверить</button>
            <button class="nav-button next" @click="handleNextStep"
              :disabled="!isStepCompleted && currentStepData.type !== 'text'">Далее →</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
p,
h1,
h2,
h3 {
  margin: 0;
}

.progress-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f5f7fa;
}

.content-container {
  display: flex;
  flex: 1;
  padding: 20px 24px;
  gap: 16px;
}

.completion-message {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 24px;
  text-align: center;
  gap: 16px;
}

.sidebar {
  width: 320px;
  padding: 16px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.lessons-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.module-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.module-title {
  font-size: 16px;
  font-weight: 700;
  color: #0d141c;
  padding: 8px 12px;
}

.lesson-item {
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.lesson-item.active {
  background-color: #d0e2ff;
  font-weight: 600;
}

.lesson-item.completed {
  background-color: #e6f4ea;
  color: #2e7d32;
}

.lesson-item.disabled {
  background-color: #f0f0f0;
  color: #aaa;
  cursor: not-allowed;
}

.list-lesson-title {
  font-size: 14px;
  font-weight: 500;
  color: #0d141c;
}

.main-content {
  flex: 1;
  padding: 16px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.main-inner {
  max-width: 960px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px;
}

.breadcrumb a {
  font-size: 16px;
  font-weight: 500;
  color: #49709c;
  text-decoration: none;
}

.breadcrumb a:hover {
  text-decoration: underline;
}

.breadcrumb span {
  font-size: 16px;
  font-weight: 500;
  color: #0d141c;
}

.progress-indicator {
  margin-bottom: 16px;
}

.progress-bar {
  width: 100%;
  height: 10px;
  background-color: #e7edf4;
  border-radius: 5px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: #0b79ee;
  transition: width 0.3s ease;
}

.quiz-question {
  font-size: 18px;
  font-weight: 600;
  color: #0d141c;
  margin-bottom: 12px;
  text-align: start;
  white-space: pre-wrap;
}

.quiz-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  color: #0d141c;
  margin-bottom: 8px;
  cursor: pointer;
}

.quiz-input {
  width: 95%;
  min-height: 80px;
  padding: 12px;
  border: 1px solid #cedae8;
  border-radius: 8px;
  font-size: 16px;
  color: #0d141c;
  resize: vertical;
}

.quiz-input::placeholder {
  color: #97a4b5;
}

.feedback-correct {
  font-size: 16px;
  padding: 16px;
  color: #2e7d32;
}

.feedback-correct-li {
  font-size: 16px;
  color: #2e7d32;
  text-align: left;
  list-style-position: inside;
}

.feedback-incorrect {
  font-size: 16px;
  padding: 16px;
  color: #d32f2f;
}

.navigation {
  display: flex;
  justify-content: space-between;
  padding: 16px;
}

.nav-button {
  height: 48px;
  padding: 0 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.nav-button.previous {
  background-color: #e7edf4;
  color: #0d141c;
}

.nav-button.previous:hover {
  background-color: #d1dbe7;
}

.nav-button.submit,
.nav-button.next {
  background-color: #0b79ee;
  color: #fff;
}

.nav-button.submit:hover,
.nav-button.next:hover {
  background-color: #0967d2;
}

.nav-button:disabled {
  background-color: #cedae8;
  color: #97a4b5;
  cursor: not-allowed;
}

input[type="radio"],
input[type="checkbox"] {
  margin-right: 8px;
  transform: scale(1.2);
  cursor: pointer;
}

textarea {
  width: 100%;
  min-height: 100px;
  padding: 12px;
  font-size: 16px;
  border: 1px solid #cedae8;
  border-radius: 8px;
  resize: vertical;
  font-family: inherit;
}

.lesson-text {
  font-size: 18px;
  color: #0d141c;
  margin-bottom: 16px;
  text-align: start;
  white-space: pre-wrap;
}
</style>
