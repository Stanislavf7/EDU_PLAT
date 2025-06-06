<script setup>
import { useUserStore } from '../stores/user';

const userStore = useUserStore();
</script>

<template>
  <header>
    <div class="logo-container">
      <div>
        <img src="../assets/plusiC.png" alt="plusiC Logo" class="logo" />
      </div>
      <router-link to="/" class="comp-name">plusiC</router-link>
    </div>

    <div class="nav-container">
      <nav>
        <router-link to="/courses">Курсы</router-link>
        <router-link to="/about">О нас</router-link>
        <router-link to="/contact">Контакты</router-link>
      </nav>

      <router-link v-if="userStore.role === 'creator' || userStore.role === 'admin'" to="/edit-course" class="primary-button">
        Редактировать курсы
      </router-link>

      <router-link v-if="userStore.role === 'admin'" to="/admin" class="primary-button">
        Панель администратора
      </router-link>

      <router-link v-if="!userStore.isAuthenticated" to="/login" class="primary-button">
        Войти
      </router-link>

      <router-link v-else to="/profile" class="primary-button">
        {{ userStore.username }}
      </router-link>
    </div>
  </header>
</template>



<style scoped>
header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #fff;
  border-bottom: 1px solid #cedae8;
  padding: 16px 24px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.logo-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo {
  width: 48px;
  height: 48px;
  background-color: #e7edf4;
  border-radius: 4px;
}

.comp-name {
  font-size: 20px;
  font-weight: 700;
  color: #0d141c;
  text-decoration: none;
}

.nav-container {
  display: flex;
  align-items: center;
  gap: 16px;
}

nav {
  display: flex;
  align-items: center;
  gap: 24px;
}

nav a {
  font-size: 16px;
  font-weight: 500;
  color: #0d141c;
  text-decoration: none;
}

nav a:hover {
  color: #0b79ee;
}

.primary-button {
  height: 40px;
  padding: 0 24px;
  background-color: #0b79ee;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
}

.primary-button:hover {
  background-color: #0967d2;
}

@media (min-width: 480px) {
  .primary-button {
    height: 48px;
    font-size: 16px;
  }
}
</style>