<script setup>
import { ref } from 'vue';
import CodeMirrorEditor from '../CodeMirrorEditor.vue';

const props = defineProps(['form']);
const emit = defineEmits(['save']);

const modules = ref([...props.form.modules || []]);

function addModule() {
  modules.value.push({
    title: '',
    description: '',
    steps: []
  });
  emit('save', { modules: modules.value });
}

function removeModule(index) {
  modules.value.splice(index, 1);
  emit('save', { modules: modules.value });
}

function addStep(moduleIndex) {
  modules.value[moduleIndex].steps.push({
    type: 'text',
    content: '',
    question: '',
    taskText: '', // Новое поле для fix-error
    options: [],
    correctOption: null,
    correctAnswer: '',
    initialCode: '',
    correctCode: ''
  });
  emit('save', { modules: modules.value });
}


function removeStep(moduleIndex, stepIndex) {
  modules.value[moduleIndex].steps.splice(stepIndex, 1);
  emit('save', { modules: modules.value });
}

function addOption(step) {
  if (!step.options) step.options = [];
  step.options.push({ text: '', correct: false });
  if (step.type === 'quiz-single' && step.correctOption === null) {
    step.correctOption = 0;
  }
  emit('save', { modules: modules.value });
}

function removeOption(step, optIdx) {
  step.options.splice(optIdx, 1);
  if (step.type === 'quiz-single' && step.correctOption >= step.options.length) {
    step.correctOption = step.options.length ? 0 : null;
  }
  emit('save', { modules: modules.value });
}

function resetStepData(step) {
  step.content = '';
  step.question = '';
  step.taskText = step.type === 'fix-error' ? '' : undefined;
  step.options = step.type === 'quiz-single' || step.type === 'quiz-multi' ? [] : undefined;
  step.correctOption = step.type === 'quiz-single' ? null : undefined;
  step.correctAnswer = step.type === 'answer' ? '' : undefined;
  step.initialCode = step.type === 'fix-error' ? '' : undefined;
  step.correctCode = step.type === 'fix-error' ? '' : undefined;
}

</script>

<template>
  <div class="step-container">
    <h2 class="section-title">Структура курса</h2>
    <div v-for="(module, moduleIndex) in modules" :key="moduleIndex" class="module-block">
      <div class="module-header">
        <h3 class="module-title">Модуль {{ moduleIndex + 1 }}</h3>
        <button class="remove-button" @click="removeModule(moduleIndex)">Удалить модуль</button>
      </div>
      <div class="form-container">
        <label class="form-label">
          <p class="label-text">Название модуля</p>
          <input v-model="module.title" class="form-input" placeholder="Введите название модуля"
            @blur="emit('save', { modules: modules.value })" />
        </label>
      </div>
      <div class="form-container">
        <label class="form-label">
          <p class="label-text">Описание</p>
          <textarea v-model="module.description" class="form-textarea" placeholder="Введите описание модуля"
            @blur="emit('save', { modules: modules.value })"></textarea>
        </label>
      </div>
      <div class="steps-section">
        <h4 class="steps-title">Шаги</h4>
        <div v-for="(step, stepIndex) in module.steps" :key="stepIndex" class="step-block">
          <div class="step-header">
            <label class="form-label">
              <p class="label-text">Тип шага</p>
              <select v-model="step.type" class="form-select"
                @change="resetStepData(step); emit('save', { modules: modules.value })">
                <option value="text">Текст</option>
                <option value="quiz-single">Викторина (один ответ)</option>
                <option value="quiz-multi">Викторина (несколько ответов)</option>
                <option value="answer">Письменный ответ</option>
                <option value="fix-error">Исправить ошибку</option>
              </select>
            </label>
            <button class="remove-button" @click="removeStep(moduleIndex, stepIndex)">Удалить шаг</button>
          </div>
          <div v-if="step.type === 'text'" class="form-container">
            <label class="form-label">
              <p class="label-text">Содержание</p>
              <textarea v-model="step.content" class="form-textarea" placeholder="Введите содержание лекции"
                @blur="emit('save', { modules: modules.value })"></textarea>
            </label>
          </div>
          <div v-if="step.type === 'quiz-single' || step.type === 'quiz-multi'" class="quiz-section">
            <div class="form-container">
              <label class="form-label">
                <p class="label-text">Вопрос</p>
                <input v-model="step.question" class="form-input" placeholder="Введите вопрос викторины"
                  @blur="emit('save', { modules: modules.value })" />
              </label>
            </div>
            <div class="quiz-options">
              <p v-if="!step.options?.length" class="error-text">Добавьте хотя бы один вариант.</p>
              <div v-for="(option, optIdx) in step.options" :key="optIdx" class="quiz-option">
                <input v-model="option.text" class="form-input" placeholder="Введите текст варианта"
                  @input="emit('save', { modules: modules.value })" />
                <label v-if="step.type === 'quiz-single'" class="radio-label">
                  <input type="radio" :value="optIdx" v-model="step.correctOption" class="radio-input"
                    :name="'correct-option-' + moduleIndex + '-' + stepIndex"
                    @change="emit('save', { modules: modules.value })" />
                  <span class="radio-text">Правильный</span>
                </label>
                <label v-else class="checkbox-label">
                  <input type="checkbox" v-model="option.correct" class="checkbox-input"
                    @change="emit('save', { modules: modules.value })" />
                  <span class="checkbox-text">Правильный</span>
                </label>
                <button class="remove-button" @click="removeOption(step, optIdx)">Удалить</button>
              </div>
              <button class="add-button" @click="addOption(step)">Добавить вариант</button>
            </div>
          </div>
          <div v-if="step.type === 'answer'" class="form-container">
            <label class="form-label">
              <p class="label-text">Вопрос</p>
              <input v-model="step.question" class="form-input" placeholder="Введите вопрос"
                @input="emit('save', { modules: modules.value })" />
            </label>
            <label class="form-label">
              <p class="label-text">Правильный ответ</p>
              <textarea v-model="step.correctAnswer" class="form-textarea" placeholder="Введите правильный ответ"
                @input="emit('save', { modules: modules.value })"></textarea>
            </label>
          </div>
          <div v-if="step.type === 'fix-error'" class="code-section">
            <label class="form-label">
              <p class="label-text">Текст задания</p>
              <textarea v-model="step.taskText" class="form-textarea" placeholder="Введите формулировку задания"
                @input="emit('save', { modules: modules.value })"></textarea>
            </label>
            <label class="form-label">
              <p class="label-text">Код с ошибкой</p>
              <CodeMirrorEditor v-model="step.initialCode" />
            </label>
            <label class="form-label">
              <p class="label-text">Правильный код</p>
              <CodeMirrorEditor v-model="step.correctCode" />
            </label>
          </div>
        </div>
        <button class="add-button" @click="addStep(moduleIndex)">Добавить новый шаг</button>
      </div>
    </div>
    <button class="add-button" @click="addModule">Добавить новый модуль</button>
  </div>
</template>

<style scoped>
.step-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 20px 24px;
  background-color: #f5f7fa;
  gap: 16px;
}

.section-title {
  font-size: 24px;
  font-weight: 700;
  color: #0d141c;
  padding: 16px 0;
}

.module-block {
  background-color: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 16px;
}

.module-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.module-title {
  font-size: 18px;
  font-weight: 700;
  color: #0d141c;
}

.steps-section {
  background-color: #e7edf4;
  border-radius: 8px;
  padding: 12px;
  margin-top: 16px;
}

.steps-title {
  font-size: 16px;
  font-weight: 600;
  color: #0d141c;
  margin-bottom: 12px;
}

.step-block {
  background-color: #fff;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  margin-bottom: 12px;
}

.step-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  gap: 16px;
}

.form-container {
  margin-bottom: 12px;
}

.form-label {
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 8px;
}

.label-text {
  font-size: 16px;
  font-weight: 600;
  color: #0d141c;
  padding-bottom: 8px;
}

.form-input,
.form-textarea,
.form-select {
  border: 1px solid #cedae8;
  background-color: #fff;
  border-radius: 8px;
  padding: 12px;
  font-size: 16px;
  color: #0d141c;
  font-family: inherit;
}

.form-input,
.form-select {
  height: 48px;
}

.form-textarea {
  min-height: 120px;
  resize: vertical;
}

.form-select {
  background-position: right 12px center;
  background-repeat: no-repeat;
}

.form-input::placeholder,
.form-textarea::placeholder {
  color: #97a4b5;
}

.quiz-section,
.code-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.quiz-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.quiz-option {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 8px 0;
}

.radio-label,
.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
}

.radio-input,
.checkbox-input {
  width: 20px;
  height: 20px;
  border: 2px solid #cedae8;
  border-radius: 4px;
  background-color: transparent;
}

.radio-input:checked,
.checkbox-input:checked {
  background-color: #0b79ee;
  border-color: #0b79ee;
}

.radio-text,
.checkbox-text {
  font-size: 14px;
  color: #0d141c;
}

.error-text {
  font-size: 14px;
  color: #d32f2f;
  margin-bottom: 8px;
}

.add-button,
.remove-button {
  height: 40px;
  padding: 0 24px;
  font-size: 14px;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.add-button {
  background-color: #0b79ee;
  color: #fff;
}

.add-button:hover {
  background-color: #0967d2;
}

.remove-button {
  background-color: #e7edf4;
  color: #0d141c;
  display: flex;
  align-self: end;
  align-items: center;
}

.remove-button:hover {
  background-color: #d1dbe7;
}
</style>
