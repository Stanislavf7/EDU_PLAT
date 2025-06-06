import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '../api';

export const useUserStore = defineStore('user', () => {
  const id = ref(null);
  const username = ref('');
  const email = ref('');
  const role = ref('');
  const img = ref(null);
  const isAuthenticated = ref(false);
  const progress = ref({});
  const users = ref([]); // Новый массив для списка пользователей

  const avatarPath = computed(() => {
    if (img.value === null || img.value < 0 || img.value > 3) {
      return '/assets/avatar.svg'; // Аватар по умолчанию
    }
    return `/assets/avatar${img.value === 1 ? '' : img.value}.svg`;
  });

  // Вход
  const login = async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      const user = response.data.user;
      id.value = user.id || null;
      username.value = user.username || 'anonymous';
      email.value = user.email || '';
      role.value = user.role || 'user';
      img.value = user.img || null;
      isAuthenticated.value = true;
      await fetchProgress();
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  // Регистрация
  const signup = async (userData) => {
    try {
      const response = await api.post('/auth/signup', userData);
      const user = response.data.user;
      id.value = user.id || null;
      username.value = user.username || 'anonymous';
      email.value = user.email || '';
      role.value = user.role || 'user';
      isAuthenticated.value = true;
      await fetchProgress();
    } catch (error) {
      console.error('Signup failed:', error);
      throw error;
    }
  };

  // Выход
  const logout = async () => {
    try {
      await api.post('/auth/logout');
      id.value = null;
      username.value = '';
      email.value = '';
      role.value = '';
      isAuthenticated.value = false;
      progress.value = {};
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Проверка текущего пользователя
  const checkAuth = async () => {
    try {
      const response = await api.get('/auth/me');
      const user = response.data.user;
      id.value = user.id || null;
      username.value = user.username || 'anonymous';
      email.value = user.email || '';
      role.value = user.role || 'user';
      isAuthenticated.value = true;
      await fetchProgress();
    } catch (error) {
      console.error('Auth check failed:', error);
      isAuthenticated.value = false;
    }
  };

  // Обновление профиля
  const updateProfile = async (profileData) => {
    try {
      const response = await api.patch('/user', profileData);
      const user = response.data.user;
      username.value = user.username || username.value;
      email.value = user.email || email.value;
      img.value = user.img ?? img.value;
      return { success: true };
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  };

  // Загрузка прогресса с сервера
  const fetchProgress = async () => {
    try {
      const response = await api.get('/user/progress');
      progress.value = response.data.progress || {};
    } catch (error) {
      console.error('Failed to fetch progress:', error);
    }
  };

  // Начало курса
  const startCourse = async (course) => {
    if (!isAuthenticated.value) {
      console.warn('User not authenticated');
      return;
    }
    try {
      if (!progress.value[course.id]) {
        progress.value[course.id] = [];
        await api.post('/user/progress', {
          courseId: course.id,
          completedSteps: []
        });
        await fetchProgress();
      }
    } catch (error) {
      console.error('Failed to start course:', error);
    }
  };

  // Завершение шага
  const completeStep = async (courseId, step) => {
    if (!isAuthenticated.value) return;
    try {
      if (!progress.value[courseId]) {
        progress.value[courseId] = [];
        await api.post('/user/progress', {
          courseId,
          completedSteps: []
        });
      }
      if (!progress.value[courseId].includes(step)) {
        progress.value[courseId].push(step);
        await api.post('/user/progress', {
          courseId,
          completedSteps: progress.value[courseId]
        });
      }
    } catch (error) {
      console.error('Failed to complete step:', error);
    }
  };

  // Загрузка списка пользователей
  const fetchUsers = async () => {
    try {
      const response = await api.get('/user');
      users.value = response.data.users;
    } catch (error) {
      console.error('Failed to fetch users:', error);
      throw error;
    }
  };

  return {
    id,
    username,
    email,
    role,
    isAuthenticated,
    progress,
    users,
    avatarPath,
    login,
    signup,
    logout,
    checkAuth,
    fetchProgress,
    startCourse,
    completeStep,
    fetchUsers,
    updateProfile
  };
});