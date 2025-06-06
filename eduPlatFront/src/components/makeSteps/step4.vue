<script setup>
import { ref, computed, watch } from 'vue';
import CodeMirrorEditor from '../CodeMirrorEditor.vue';

const props = defineProps({
  course: {
    type: Object,
    required: true
  }
});

const currentStep = ref(1);

const flatSteps = computed(() => {
  const steps = [];
  props.course.modules?.forEach((module, mIdx) => {
    module.steps?.forEach((step, sIdx) => {
      steps.push({
        moduleIdx: mIdx,
        stepIdx: sIdx,
        ...step
      });
    });
  });
  return steps;
});

const groupedSteps = computed(() => {
  return props.course.modules?.map((module, mIdx) => ({
    module,
    steps: flatSteps.value.filter(s => s.moduleIdx === mIdx)
  })) || [];
});

const currentStepData = computed(() => {
  const step = flatSteps.value[currentStep.value - 1] || {};
  return {
    ...step,
    moduleTitle: props.course.modules?.[step.moduleIdx]?.title || '',
    moduleDescription: props.course.modules?.[step.moduleIdx]?.description || ''
  };
});

watch(() => props.course, () => {
  currentStep.value = 1;
}, { deep: true });

function goToStep(step) {
  if (step >= 1 && step <= flatSteps.value.length) {
    currentStep.value = step;
  }
}
</script>

<template>
  <div v-if="!course || !course.modules?.length">
    <p>Курс не загружен или не содержит модулей...</p>
  </div>

  <div v-else class="progress-container">
    <div class="content-container">
      <div class="sidebar">
        <div class="lessons-list">
          <div v-for="(group, mIdx) in groupedSteps" :key="group.module.title" class="module-group">
            <p class="module-title">{{ group.module.title }}</p>
            <div v-for="(step, sIdx) in group.steps" :key="sIdx" class="lesson-item"
              :class="{ active: currentStep === flatSteps.indexOf(step) + 1 }"
              @click="goToStep(flatSteps.indexOf(step) + 1)">
              <p class="list-lesson-title">
                Шаг {{ step.stepIdx + 1 }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div class="main-content">
        <div class="main-inner">
          <div class="breadcrumb">
            <span>{{ course.title || 'Курс' }}</span>
            <span>/</span>
            <span>
              {{ currentStepData.moduleTitle || 'Модуль' }}:
              Шаг {{ currentStepData.stepIdx + 1 || 1 }}
            </span>
          </div>

          <div>
            <h1>{{ currentStepData.moduleTitle || 'Модуль' }}</h1>
            <p>{{ currentStepData.moduleDescription || '' }}</p>
          </div>

          <div v-if="currentStepData.type === 'text'">
            <p class="lesson-text">
              {{ currentStepData.content || '' }}
            </p>
          </div>

          <div v-else-if="currentStepData.type === 'quiz-single'">
            <p class="quiz-question">
              {{ currentStepData.question || '' }}
            </p>
            <ul>
              <li v-for="(option, idx) in currentStepData.options || []" :key="idx">
                {{ option.text || '' }}
              </li>
            </ul>
            <p class="answer-preview">
              Правильный ответ:
              {{ currentStepData.options?.[currentStepData.correctOption]?.text || '' }}
            </p>
          </div>

          <div v-else-if="currentStepData.type === 'quiz-multi'">
            <p class="quiz-question">
              {{ currentStepData.question || '' }}
            </p>
            <ul>
              <li v-for="(option, idx) in currentStepData.options || []" :key="idx">
                {{ option.text || '' }}
                <span v-if="option.correct"> (правильный) </span>
              </li>
            </ul>
            <p class="answer-preview">
              Все правильные ответы:
            </p>
            <ul class="answer-preview">
              <li v-for="(opt, idx) in currentStepData.options?.filter(o => o.correct) || []" :key="idx">
                {{ opt.text }}
              </li>
            </ul>
          </div>

          <div v-else-if="currentStepData.type === 'answer'">
            <p class="quiz-question">
              {{ currentStepData.question || '' }}
            </p>
            <p class="answer-preview">
              Правильный ответ:
              {{ currentStepData.correctAnswer || '' }}
            </p>
          </div>

          <div v-else-if="currentStepData.type === 'fix-error'">
            <p class="quiz-question">
              {{ currentStepData.taskText || 'Задание не указано' }}
            </p>
            <p class="quiz-subtitle">Код с ошибками:</p>
            <CodeMirrorEditor :model-value="currentStepData.initialCode || ''" :read-only="true" />
          </div>


          <div class="navigation">
            <button class="nav-button previous" @click="goToStep(currentStep - 1)" :disabled="currentStep <= 1">
              ← Назад
            </button>
            <button class="nav-button next" @click="goToStep(currentStep + 1)"
              :disabled="currentStep >= flatSteps.length">
              Далее →
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
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

.breadcrumb span {
  font-size: 16px;
  font-weight: 500;
  color: #0d141c;
}

.lesson-text {
  font-size: 18px;
  color: #0d141c;
  margin-bottom: 16px;
  text-align: start;
}

.quiz-question {
  font-size: 18px;
  font-weight: 600;
  color: #0d141c;
  margin-bottom: 12px;
  text-align: start;
}

.answer-preview {
  font-size: 16px;
  color: #2e7d32;
  margin-top: 12px;
  font-style: italic;
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

.nav-button.next {
  background-color: #0b79ee;
  color: #fff;
}

.nav-button.next:hover {
  background-color: #0967d2;
}

.nav-button:disabled {
  background-color: #cedae8;
  color: #97a4b5;
  cursor: not-allowed;
}

ul {
  list-style-type: disc;
  padding-left: 20px;
  margin-bottom: 8px;
}

li {
  font-size: 16px;
  color: #0d141c;
  margin-bottom: 4px;
}

.quiz-input {
  width: 100%;
  min-height: 80px;
  padding: 12px;
  border: 1px solid #cedae8;
  border-radius: 8px;
  font-size: 16px;
  color: #0d141c;
  resize: vertical;
}
</style>
