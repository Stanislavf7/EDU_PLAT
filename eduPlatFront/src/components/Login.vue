<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../stores/user';

const router = useRouter();
const userStore = useUserStore();
const form = ref({ email: '', password: '' });
const message = ref('');
const showPassword = ref(false);

const togglePassword = () => {
  showPassword.value = !showPassword.value;
};

const handleLogin = async () => {
  try {
    await userStore.login(form.value);
    router.push('/');
  } catch (error) {
    console.error('Ошибка входа:', error);
    message.value = error.response?.data?.error || 'Не удалось войти';
  }
};
</script>

<template>
  <div class="login-container">
    <div class="content-container">
      <div class="header-section">
        <div class="header-text">
          <h1 class="welcome-title">Добро пожаловать в plusiC</h1>
          <p class="welcome-description">Войдите, чтобы продолжить своё обучение.</p>
        </div>
      </div>
      <div class="form-container">
        <label class="form-label">
          <input v-model="form.email" type="email" class="form-input" placeholder="Электронная почта" />
        </label>
      </div>
      <div class="form-container">
        <label class="form-label">
          <input
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            class="form-input"
            placeholder="Пароль"
          />
          <button type="button" class="toggle-password" @click="togglePassword">
            {{ showPassword ? 'Скрыть' : 'Показать' }}
          </button>
        </label>
      </div>
      <router-link to="/recovery" class="forgot-password">Забыли пароль?</router-link>
      <div class="action-section">
        <button class="login-button" @click="handleLogin">Войти</button>
      </div>
      <p v-if="message" class="login-message">{{ message }}</p>
      <router-link to="/signup" class="signup-link">Нет аккаунта? Зарегистрироваться</router-link>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 20px 24px;
  background-color: #f5f7fa;
}

.content-container {
  display: flex;
  flex-direction: column;
  max-width: 512px;
  width: 100%;
  margin: 0 auto;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 24px;
}

.header-section {
  padding: 0 0 16px;
}

.header-text {
  display: flex;
  flex-direction: column;
  gap: 12px;
  text-align: center;
}

.welcome-title {
  font-size: 32px;
  font-weight: 700;
  color: #0d141c;
}

.welcome-description {
  font-size: 16px;
  color: #49709c;
}

.form-container {
  padding: 12px 0;
}

.form-label {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.form-input {
  height: 48px;
  padding: 12px;
  border: 1px solid #cedae8;
  background-color: #fff;
  border-radius: 8px;
  font-size: 16px;
  color: #0d141c;
}

.form-input::placeholder {
  color: #97a4b5;
}

.forgot-password {
  font-size: 14px;
  color: #0b79ee;
  padding: 8px 0;
  text-decoration: none;
  text-align: right;
}

.forgot-password:hover {
  color: #0967d2;
}

.action-section {
  padding: 12px 0;
}

.login-button {
  width: 100%;
  height: 48px;
  background-color: #0b79ee;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.login-button:hover {
  background-color: #0967d2;
}

.login-message {
  font-size: 14px;
  color: #d32f2f;
  padding: 8px 0;
  text-align: center;
}

.signup-link {
  font-size: 14px;
  color: #0b79ee;
  padding: 8px 0;
  text-align: center;
  text-decoration: none;
}

.signup-link:hover {
  color: #0967d2;
}

.toggle-password {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #0b79ee;
  cursor: pointer;
  font-size: 14px;
}

.form-container {
  position: relative;
}
</style>