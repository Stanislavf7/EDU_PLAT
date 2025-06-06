<script setup>
import { defineProps, defineEmits } from 'vue';

defineProps({
  form: { type: Object, required: true }
});
defineEmits(['save']);

const difficultyOptions = ['Начальный', 'Средний', 'Продвинутый'];
</script>

<template>
  <div class="step-container">
    <div class="header-section">
      <div class="header-text">
        <h1 class="page-title">Создать/редактировать курс</h1>
        <p class="page-description">
          Определите основные детали вашего курса, включая название, описания и цели обучения.
        </p>
      </div>
    </div>
    <div class="form-section">
      <h2 class="section-title">Название курса</h2>
      <div class="form-container">
        <label class="form-label">
          <input v-model="form.title" type="text" class="form-input" placeholder="Введите название курса" @blur="$emit('save')" />
        </label>
      </div>
    </div>
    <div class="form-section">
      <h2 class="section-title">Краткое описание</h2>
      <div class="form-container">
        <label class="form-label">
          <textarea v-model="form.description" class="form-textarea" placeholder="Введите краткое описание курса" @blur="$emit('save')"></textarea>
        </label>
      </div>
    </div>
    <div class="form-section">
      <h2 class="section-title">Полное описание</h2>
      <div class="form-container">
        <label class="form-label">
          <textarea v-model="form.fullDescription" class="form-textarea" placeholder="Введите подробное описание курса" @blur="$emit('save')"></textarea>
        </label>
      </div>
    </div>
    <div class="form-section">
      <h2 class="section-title">Цели обучения</h2>
      <div class="form-container">
        <label class="form-label">
          <textarea
            id="course-objectives"
            v-model="form.objectivesText"
            class="form-textarea"
            placeholder="Введите каждую цель обучения в новой строке"
            @blur="$emit('save')"
          ></textarea>
        </label>
      </div>
    </div>
    <div class="form-section">
      <h2 class="section-title">Предварительные требования</h2>
      <div class="form-container">
        <label class="form-label">
          <textarea v-model="form.prerequisites" class="form-textarea" placeholder="Введите предварительные требования курса" @blur="$emit('save')"></textarea>
        </label>
      </div>
    </div>
    <div class="form-section">
      <h2 class="section-title">Сложность</h2>
      <div class="form-container">
        <label class="form-label">
          <select v-model="form.difficulty" class="form-select" @blur="$emit('save')">
            <option v-for="option in difficultyOptions" :key="option" :value="option">{{ option }}</option>
          </select>
        </label>
      </div>
    </div>
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

.header-section {
  background-color: #fff;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-text {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 960px;
  margin: 0 auto;
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  color: #0d141c;
}

.page-description {
  font-size: 16px;
  color: #49709c;
}

.form-section {
  background-color: #fff;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 16px;
}

.section-title {
  font-size: 24px;
  font-weight: 700;
  color: #0d141c;
  margin-bottom: 16px;
}

.form-container {
  max-width: 480px;
  margin: 0 auto;
}

.form-label {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.label-text {
  font-size: 16px;
  font-weight: 600;
  color: #0d141c;
  padding-bottom: 8px;
}

.form-input, .form-textarea {
  border: 1px solid #cedae8;
  background-color: #fff;
  border-radius: 8px;
  padding: 12px;
  font-size: 16px;
  color: #0d141c;
  font-family: inherit;
}

.form-input {
  height: 48px;
}

.form-textarea {
  min-height: 120px;
  resize: vertical;
}

.form-input::placeholder, .form-textarea::placeholder {
  color: #97a4b5;
}

</style>