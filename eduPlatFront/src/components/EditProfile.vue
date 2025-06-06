<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../stores/user';

const userStore = useUserStore();
const router = useRouter();
const form = ref({
  username: '',
  email: '',
  img: null
});
const error = ref(null);
const success = ref(false);

onMounted(() => {
  if (!userStore.isAuthenticated) {
    router.push('/login');
    return;
  }
  // Инициализация формы текущими данными
  form.value.username = userStore.username;
  form.value.email = userStore.email;
  form.value.img = userStore.img ?? 0;
});

const handleSave = async () => {
  error.value = null;
  success.value = false;
  try {
    // Отправляем только изменённые поля
    const updateData = {};
    if (form.value.username !== userStore.username) {
      updateData.username = form.value.username;
    }
    if (form.value.email !== userStore.email) {
      updateData.email = form.value.email;
    }
    if (form.value.img !== userStore.img) {
      updateData.img = Number(form.value.img) + 1;
    }
    if (Object.keys(updateData).length === 0) {
      error.value = 'Нет изменений для сохранения';
      return;
    }
    await userStore.updateProfile(updateData);
    success.value = true;
    setTimeout(() => {
      router.push('/profile');
    }, 2000); // Перенаправление через 2 секунды
  } catch (err) {
    error.value = err.response?.data?.error || 'Не удалось обновить профиль';
  }
};
const avatarPath = computed(() => {
  const imgVal = Number(form.value.img) + 1;
  if (isNaN(imgVal) || imgVal < 1 || imgVal > 4) return '/assets/avatar.svg';
  return `../assets/avatar${imgVal === 1 ? '' : imgVal}.svg`;
});
</script>

<template>
  <div class="edit-profile-container">
    <div class="content-container">
      <div class="header-section">
        <h1 class="page-title">Редактировать профиль</h1>
      </div>
      <div v-if="success" class="success-message">Изменения сохранены!</div>
      <div v-if="error" class="error-message">{{ error }}</div>
      <div class="form-container">
        <label class="form-label">
          <p class="label-text">Имя пользователя</p>
          <input v-model="form.username" type="text" class="form-input" placeholder="Введите имя пользователя" />
        </label>
      </div>
      <div class="form-container">
        <label class="form-label">
          <p class="label-text">Электронная почта</p>
          <input v-model="form.email" type="email" class="form-input" placeholder="Введите электронную почту" />
        </label>
      </div>
      <div class="form-container">
        <label class="form-label">
          <p class="label-text">Аватар</p>
          <select v-model="form.img" class="form-select">
            <option value="0">Аватар 1 (по умолчанию)</option>
            <option value="1">Аватар 2</option>
            <option value="2">Аватар 3</option>
            <option value="3">Аватар 4</option>
          </select>
        </label>
        <div class="avatar-preview">
          <img :src="avatarPath" alt="Предпросмотр аватара" class="avatar-image" />
        </div>
      </div>
      <div class="action-section">
        <button class="save-button" @click="handleSave">Сохранить изменения</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.edit-profile-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f5f7fa;
}

.content-container {
  display: flex;
  flex-direction: column;
  max-width: 960px;
  width: 100%;
  margin: 0 auto;
  padding: 20px 24px;
}

.header-section {
  margin-bottom: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #0d141c;
}

.success-message {
  color: #2e7d32;
  font-size: 14px;
  margin-bottom: 16px;
}

.error-message {
  color: #d32f2f;
  font-size: 14px;
  margin-bottom: 16px;
}

.form-container {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 16px;
  margin-bottom: 16px;
}

.form-label {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.label-text {
  font-size: 14px;
  color: #49709c;
}

.form-input,
.form-select {
  height: 40px;
  padding: 0 12px;
  border: 1px solid #e7edf4;
  border-radius: 8px;
  font-size: 14px;
  color: #0d141c;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #0b79ee;
}

.form-select {
  background-color: #fff;
}

.action-section {
  display: flex;
  justify-content: flex-end;
}

.save-button {
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

.save-button:hover {
  background-color: #0967d2;
}

.avatar-preview {
  display: flex;
  justify-content: center;
  margin-top: 16px;
  width: 100px;
  height: 100px;
  border-radius: 10px;
}
</style>
