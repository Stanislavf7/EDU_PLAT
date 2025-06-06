<template>
  <div class="contact-container">
    <div class="content-container">
      <div class="header-section">
        <div class="header-text">
          <h1 class="page-title">Связаться с нами</h1>
          <p class="page-description">Мы здесь, чтобы помочь! Пожалуйста, заполните форму ниже, и мы свяжемся с вами как можно скорее.</p>
        </div>
      </div>
      <form @submit.prevent="handleSubmit">
        <div class="form-container">
          <label class="form-label">
            <p class="label-text">Тема</p>
            <input v-model="form.subject" type="text" class="form-input" placeholder="Введите тему сообщения" />
          </label>
        </div>
        <div class="form-container">
          <label class="form-label">
            <p class="label-text">Сообщение</p>
            <textarea v-model="form.message" class="form-textarea" placeholder="Введите ваше сообщение здесь"></textarea>
          </label>
        </div>
        <div class="form-container">
          <label class="form-label">
            <p class="label-text">Вложения (необязательно, до 5 файлов)</p>
            <input type="file" accept=".png,.pdf,.docx" multiple @change="handleFileChange" class="attachment-input" />
            <div v-if="form.attachments.length" class="attachment-list">
              <div v-for="(file, index) in form.attachments" :key="index" class="attachment-item">
                <span>{{ file.name }}</span>
                <button type="button" @click="removeFile(index)" class="remove-file-button">✕</button>
              </div>
            </div>
          </label>
        </div>
        <div class="action-section">
          <button type="submit" class="submit-button">Отправить</button>
          <p v-if="success" class="success-message">Сообщение успешно отправлено!</p>
          <p v-if="error" class="error-message">{{ error }}</p>
        </div>
      </form>
      <h3 class="quick-access-title">Быстрый доступ</h3>
      <div class="quick-access-container">
        <div class="quick-access-item">
          <div class="icon-container">
            <img src="../assets/mail.svg" alt="Mail" class="icon-placeholder">
          </div>
          <p class="icon-label">Электронная почта</p>
        </div>
        <div class="quick-access-item">
          <div class="icon-container">
            <img src="../assets/mail.svg" alt="Mail" class="icon-placeholder">
          </div>
          <p class="icon-label">Соцсеть 1</p>
        </div>
        <div class="quick-access-item">
          <div class="icon-container">
            <img src="../assets/mail.svg" alt="Mail" class="icon-placeholder">
          </div>
          <p class="icon-label">Соцсеть 2</p>
        </div>
        <div class="quick-access-item">
          <div class="icon-container">
            <img src="../assets/mail.svg" alt="Mail" class="icon-placeholder">
          </div>
          <p class="icon-label">Соцсеть 3</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useUserStore } from '../stores/user';
import api from '../api';

const userStore = useUserStore();

const form = ref({
  subject: '',
  message: '',
  attachments: []
});
const error = ref(null);
const success = ref(false);

async function handleSubmit() {
  try {
    error.value = null;
    success.value = false;

    if (!form.value.subject || !form.value.message) {
      throw new Error('Тема и сообщение обязательны');
    }

    const formData = new FormData();
    formData.append('type', 'user_message');
    formData.append('message', `Новое сообщение от ${userStore.isAuthenticated ? userStore.username : 'гостя'}`);
    formData.append('user_id', userStore.isAuthenticated ? userStore.id : '');
    formData.append('metadata', JSON.stringify({
      subject: form.value.subject,
      message: form.value.message
    }));

    form.value.attachments.forEach(file => {
      formData.append('attachments', file);
    });

    await api.post('/notifications', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    form.value = { subject: '', message: '', attachments: [] };
    success.value = true;
  } catch (err) {
    error.value = err.response?.data?.error || err.message || 'Не удалось отправить сообщение';
    console.error('Ошибка отправки сообщения:', err);
  }
}

function handleFileChange(event) {
  const files = Array.from(event.target.files);
  if (files.length > 5) {
    error.value = 'Можно прикрепить не более 5 файлов';
    form.value.attachments = [];
    event.target.value = '';
    return;
  }

  const allowedTypes = ['image/png', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  const maxSize = 20 * 1024 * 1024;

  const validFiles = files.filter(file => {
    if (!allowedTypes.includes(file.type)) {
      error.value = `Файл ${file.name} имеет недопустимый формат. Допустимы: PNG, PDF, DOCX`;
      return false;
    }
    if (file.size > maxSize) {
      error.value = `Файл ${file.name} превышает 20 МБ`;
      return false;
    }
    return true;
  });

  if (validFiles.length !== files.length) {
    form.value.attachments = [];
    event.target.value = '';
    return;
  }

  form.value.attachments = validFiles;
}

function removeFile(index) {
  form.value.attachments.splice(index, 1);
}
</script>

<style scoped>

p, h1, h2, h3 {
  margin: 0;
}

.contact-container {
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
  width: 100%;
  margin: 0 auto;
  align-items: center;
  background-color: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 16px;
}

.header-section {
  padding: 16px;
  width: 100%;
}

.header-text {
  display: flex;
  flex-direction: column;
  gap: 12px;
  text-align: center;
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

.form-container {
  padding: 16px;
  margin-bottom: 16px;
  max-width: 640px;
  width: 100%;
  display: inline-block;
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

.form-input,
.form-textarea,
.attachment-input {
  border: 1px solid #cedae8;
  background-color: #fff;
  border-radius: 8px;
  padding: 12px;
  font-size: 16px;
  color: #0d141c;
  font-family: inherit;
}

.form-input,
.attachment-input {
  height: 48px;
}

.form-textarea {
  min-height: 120px;
  resize: vertical;
}

.form-input::placeholder,
.form-textarea::placeholder {
  color: #97a4b5;
}

.attachment-list {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.attachment-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px;
  background-color: #e7edf4;
  border-radius: 4px;
}

.remove-file-button {
  background: none;
  border: none;
  color: #ff4d4f;
  cursor: pointer;
  font-size: 16px;
}

.action-section {
  display: flex;
  justify-content: center;
  padding: 16px;
}

.submit-button {
  height: 40px;
  padding: 0 24px;
  background-color: #0b79ee;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.submit-button:hover {
  background-color: #0967d2;
}

.success-message {
  margin-top: 8px;
  color: #155724;
  background-color: #d4edda;
  padding: 8px 12px;
  border-radius: 4px;
}

.error-message {
  margin-top: 8px;
  color: #721c24;
  background-color: #f8d7da;
  padding: 8px 12px;
  border-radius: 4px;
}

.quick-access-title {
  font-size: 20px;
  font-weight: 700;
  color: #0d141c;
  padding: 16px 0;
}

.quick-access-container {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding: 0 16px;
}

.quick-access-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  background-color: #fff;
  padding: 12px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  width: 100px;
}

.icon-container {
  width: 40px;
  height: 40px;
  background-color: #e7edf4;
  border-radius: 50%;
}

.icon-label {
  font-size: 14px;
  font-weight: 500;
  color: #0d141c;
}

.icon-placeholder {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #e7edf4;
  border-radius: 50%;
  font-size: 14px;
  color: #49709c;
}
</style>