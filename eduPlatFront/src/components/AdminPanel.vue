<script setup>
import { ref, computed, onMounted, reactive } from 'vue';
import { useUserStore } from '../stores/user';
import { useCourseStore } from '../stores/course';
import { useRouter } from 'vue-router';
import api from '../api';

const userStore = useUserStore();
const courseStore = useCourseStore();
const router = useRouter();
const activeTab = ref('notifications');
const notifications = ref([]);
const selectedNotification = ref(null);
const deleteConfirmId = ref(null);
const deleteType = ref(null); // 'notification', 'course', 'user'
const courses = ref([]);
const participantsCount = reactive({});
const loadingCourses = ref(false);
const errorCourses = ref(null);
const loadingUsers = ref(false);
const errorUsers = ref(null);

onMounted(async () => {
  if (!userStore.isAuthenticated) {
    try {
      await userStore.checkAuth();
      if (!userStore.isAuthenticated) {
        router.push('/login');
        return;
      }
    } catch {
      router.push('/login');
      return;
    }
  }
  if (userStore.role !== 'admin') {
    console.error('Access denied: Admin only');
    router.push('/login');
    return;
  }
  await fetchNotifications();
  await loadCourses();
  await loadUsers();
});

async function fetchNotifications() {
  try {
    const response = await api.get('/notifications');
    notifications.value = response.data.notifications;
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
  }
}

function selectNotification(notification) {
  selectedNotification.value = notification;
}

async function markAsRead(id) {
  try {
    await api.patch(`/notifications/${id}`, { is_read: true });
    const notification = notifications.value.find(n => n.id === id);
    if (notification) notification.is_read = true;
    if (selectedNotification.value?.id === id) {
      selectedNotification.value.is_read = true;
    }
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
  }
}

async function markAsUnread(id) {
  try {
    await api.patch(`/notifications/${id}`, { is_read: false });
    const notification = notifications.value.find(n => n.id === id);
    if (notification) notification.is_read = false;
    if (selectedNotification.value?.id === id) {
      selectedNotification.value.is_read = false;
    }
  } catch (error) {
    console.error('Failed to mark notification as unread:', error);
  }
}

function showDeleteConfirm(id, type) {
  deleteConfirmId.value = id;
  deleteType.value = type;
}

async function confirmDelete() {
  try {
    await api.delete(`/notifications/${deleteConfirmId.value}`);
    notifications.value = notifications.value.filter(n => n.id !== deleteConfirmId.value);
    if (selectedNotification.value?.id === deleteConfirmId.value) {
      selectedNotification.value = null;
    }
    deleteConfirmId.value = null;
    deleteType.value = null;
  } catch (error) {
    console.error('Failed to delete notification:', error);
  }
}

async function confirmDeleteCourse() {
  try {
    await api.delete(`/courses/${deleteConfirmId.value}`);
    courses.value = courses.value.filter(c => c.id !== deleteConfirmId.value);
    delete participantsCount[deleteConfirmId.value];
    deleteConfirmId.value = null;
    deleteType.value = null;
  } catch (error) {
    console.error('Failed to delete course:', error);
    errorCourses.value = 'Failed to delete course. Please try again.';
  }
}

async function confirmDeleteUser() {
  try {
    await api.delete(`/user/${deleteConfirmId.value}`);
    userStore.users = userStore.users.filter(u => u.id !== deleteConfirmId.value);
    deleteConfirmId.value = null;
    deleteType.value = null;
  } catch (error) {
    console.error('Failed to delete user:', error);
    errorUsers.value = 'Failed to delete user. Please try again.';
  }
}

async function changeRole(user) {
  try {
    await api.patch(`/user/${user.id}`, { role: user.role });
  } catch (error) {
    console.error('Failed to change user role:', error);
    errorUsers.value = 'Failed to update user role. Please try again.';
    // Откатываем изменения в UI
    await loadUsers();
  }
}

function viewCourse(courseId) {
  router.push(`/courses/${courseId}/preview`);
}

function formatTime(date) {
  return new Date(date).toLocaleString();
}

const sortedNotifications = computed(() => {
  return [...notifications.value].sort((a, b) => {
    if (a.is_read !== b.is_read) {
      return a.is_read ? 1 : -1;
    }
    return new Date(b.created_at) - new Date(a.created_at);
  });
});

function getFileExtension(path) {
  return path.match(/\.[0-9a-z]+$/i)?.[0] || '';
}

async function loadCourses() {
  try {
    loadingCourses.value = true;
    await courseStore.fetchCourses();
    courses.value = courseStore.courses.slice();
    courses.value.forEach(course => {
      fetchParticipantsCount(course.id);
    });
  } catch (error) {
    console.error('Failed to load courses:', error);
    errorCourses.value = 'Failed to load courses. Please try again.';
  } finally {
    loadingCourses.value = false;
  }
}

async function fetchParticipantsCount(courseId) {
  try {
    const response = await api.get(`/courses/${courseId}/participants-count`);
    participantsCount[courseId] = response.data.count;
  } catch (error) {
    console.error('Failed to fetch participants count:', error);
    participantsCount[courseId] = '—';
  }
}

async function togglePublish(course) {
  try {
    const newStatus = !course.is_published;
    await api.patch(`/courses/${course.id}`, { is_published: newStatus });
    course.is_published = newStatus;
  } catch (error) {
    console.error('Failed to toggle publish:', error);
    errorCourses.value = 'Failed to toggle publish status. Please try again.';
  }
}

async function loadUsers() {
  try {
    loadingUsers.value = true;
    await userStore.fetchUsers();
  } catch (error) {
    console.error('Failed to load users:', error);
    errorUsers.value = 'Failed to load users. Please try again.';
  } finally {
    loadingUsers.value = false;
  }
}
</script>

<template>
  <div class="admin-panel-container">
    <div class="content-container">
      <div class="header-section">
        <h1 class="page-title">Панель администратора</h1>
      </div>
      <div class="tabs-section">
        <div class="tabs">
          <a :class="['tab', { 'active': activeTab === 'notifications' }]" href="#"
            @click.prevent="activeTab = 'notifications'">
            <p class="tab-text">Уведомления</p>
          </a>
          <a :class="['tab', { 'active': activeTab === 'courses' }]" href="#" @click.prevent="activeTab = 'courses'">
            <p class="tab-text">Управление курсами</p>
          </a>
          <a :class="['tab', { 'active': activeTab === 'users' }]" href="#" @click.prevent="activeTab = 'users'">
            <p class="tab-text">Управление пользователями</p>
          </a>
        </div>
      </div>
      <div class="content">
        <div v-if="activeTab === 'notifications'" class="chat-style-panel">
          <div class="notification-sidebar">
            <div v-for="notification in sortedNotifications" :key="notification.id" class="notification-item"
              :class="{ selected: selectedNotification?.id === notification.id, read: notification.is_read }"
              @click="selectNotification(notification)">
              <div class="notification-details">
                <p class="user-name">{{ notification.username || 'пользователь' }}</p>
                <p class="notification-message">{{ notification.message }}</p>
                <p class="notification-time">{{ formatTime(notification.created_at) }}</p>
              </div>
            </div>
          </div>
          <div class="notification-viewer" v-if="selectedNotification">
            <div class="notification-header">
              <p class="user-image-placeholder">👤</p>
              <h3>{{ selectedNotification.username || 'пользователь' }}</h3>
              <button class="close-button" @click="selectedNotification = null">✕</button>
            </div>
            <p class="notification-message-full">{{ selectedNotification.message }}</p>
            <p class="notification-meta" v-if="selectedNotification.type === 'user_message'">
              <strong>Тема:</strong> {{ selectedNotification.metadata.subject }}<br />
              <strong>Сообщение:</strong> {{ selectedNotification.metadata.message }}<br />
              <strong>Вложения:</strong>
              <span v-if="selectedNotification.metadata.attachments?.length">
                <a v-for="(attachment, index) in selectedNotification.metadata.attachments" :key="index"
                  :href="`http://localhost:5001${attachment}`" class="attachment-link"
                  :download="`файл-${index + 1}${getFileExtension(attachment)}`">
                  Файл {{ index + 1 }}
                </a>
              </span>
              <span v-else>Нет вложений</span>
            </p>
            <p class="notification-meta"
              v-else-if="selectedNotification.type === 'course_created' || selectedNotification.type === 'course_updated'">
              <strong>Тип:</strong> {{ selectedNotification.type === 'course_created' ? 'Курс создан' : 'Курс обновлён' }}<br />
              <strong>ID курса:</strong> {{ selectedNotification.metadata.course_id }}<br />
              <strong>Название курса:</strong> {{ selectedNotification.metadata.course_title }}
            </p>
            <p class="notification-meta" v-else>
              Дополнительные детали отсутствуют
            </p>
            <div class="notification-actions">
              <button class="mark-read-button" v-if="!selectedNotification.is_read"
                @click="markAsRead(selectedNotification.id)">
                Пометить как прочитанное
              </button>
              <button class="mark-unread-button" v-else @click="markAsUnread(selectedNotification.id)">
                Пометить как непрочитанное
              </button>
              <button class="view-course-button"
                v-if="selectedNotification.type === 'course_created' || selectedNotification.type === 'course_updated'"
                @click="viewCourse(selectedNotification.metadata.course_id)">
                Просмотреть курс
              </button>
              <button class="delete-button" @click="showDeleteConfirm(selectedNotification.id, 'notification')">
                Удалить
              </button>
            </div>
          </div>
          <div class="notification-placeholder" v-else>
            <p>Выберите уведомление для просмотра деталей</p>
          </div>
        </div>
        <div v-else-if="activeTab === 'courses'" class="courses-management">
          <div v-if="loadingCourses" class="loading">Загрузка курсов...</div>
          <div v-else-if="errorCourses" class="error">Не удалось загрузить курсы. Пожалуйста, попробуйте снова.</div>
          <div v-else class="courses-list-scroll">
            <div v-for="course in courses" :key="course.id" class="course-card">
              <div class="course-header">
                <p class="course-title">{{ course.title }}</p>
                <p class="course-status">
                  Статус:
                  <span :class="{ published: course.is_published, hidden: !course.is_published }">
                    {{ course.is_published ? 'Опубликован' : 'Скрыт' }}
                  </span>
                </p>
              </div>
              <p class="course-description">{{ course.description }}</p>
              <p class="course-difficulty">Сложность: {{ course.difficulty }}</p>
              <p class="course-participants">
                Участники: {{ participantsCount[course.id] ?? '—' }}
              </p>
              <div class="course-actions">
                <button class="action-button toggle-button" @click="togglePublish(course)">
                  {{ course.is_published ? 'Скрыть' : 'Опубликовать' }}
                </button>
                <button class="action-button delete-button" @click="showDeleteConfirm(course.id, 'course')">
                  Удалить
                </button>
              </div>
            </div>
            <p v-if="!courses.length" class="no-courses">Курсы отсутствуют.</p>
          </div>
        </div>
        <div v-else-if="activeTab === 'users'" class="users-management">
          <div v-if="loadingUsers" class="loading">Загрузка пользователей...</div>
          <div v-else-if="errorUsers" class="error">Не удалось загрузить пользователей. Пожалуйста, попробуйте снова.</div>
          <div v-else class="users-list-scroll">
            <div v-for="user in userStore.users" :key="user.id" class="user-card">
              <div class="user-header">
                <p class="user-name">{{ user.username }}</p>
                <p class="user-id">ID: {{ user.id }}</p>
              </div>
              <p class="user-email">{{ user.email }}</p>
              <p class="user-joined">Дата регистрации: {{ formatTime(user.created_at) }}</p>
              <div class="user-role">
                <label class="role-label">Роль:</label>
                <select v-model="user.role" class="role-select" @change="changeRole(user)">
                  <option value="admin">Администратор</option>
                  <option value="creator">Создатель</option>
                  <option value="user">Пользователь</option>
                </select>
              </div>
              <div class="user-actions">
                <button class="action-button delete-button" @click="showDeleteConfirm(user.id, 'user')">
                  Удалить
                </button>
              </div>
            </div>
            <p v-if="!userStore.users.length" class="no-users">Пользователи отсутствуют.</p>
          </div>
        </div>
      </div>
    </div>
    <div class="modal" v-if="deleteConfirmId">
      <div class="modal-content">
        <h3>Подтверждение удаления</h3>
        <p>
          Вы уверены, что хотите удалить
          {{ deleteType === 'course' ? 'курс' : deleteType === 'user' ? 'пользователя' : 'уведомление' }}?
          Это действие нельзя отменить.
        </p>
        <div class="modal-actions">
          <button class="modal-confirm"
            @click="deleteType === 'course' ? confirmDeleteCourse() : deleteType === 'user' ? confirmDeleteUser() : confirmDelete()">
            Да, удалить
          </button>
          <button class="modal-cancel" @click="deleteConfirmId = null">Отмена</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-panel-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 16px;
  background-color: #f5f7fa;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.content-container {
  max-width: 1280px;
  width: 100%;
  margin: 0 auto;
}

.header-section {
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px-3px rgba(0, 0, 0, 0.1);
  margin-bottom: 16px;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #0d141c;
  margin: 0;
}

.tabs-section {
  margin-bottom: 16px;
}

.tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tab {
  padding: 10px 20px;
  background-color: #e7edf4;
  border-radius: 6px;
  text-decoration: none;
  transition: all 0.2s ease;
}

.tab.active {
  background-color: #0b79ee;
}

.tab-text {
  font-size: 16px;
  font-weight: bold;
  color: #0d141c;
  margin: 0;
}

.tab.active .tab-text {
  color: #fff;
}

.chat-style-panel {
  display: flex;
  flex: 1;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  overflow: hidden;
  min-height: 400px;
}

.notification-sidebar {
  width: 320px;
  background-color: #fafbfc;
  border-right: 1px solid #e7edf4;
  overflow-y: auto;
  max-height: calc(100vh - 200px);
}

.notification-item {
  padding: 12px 16px;
  border-bottom: 1px solid #e7edf4;
  cursor: pointer;
  transition: background-color 0.2s ease;
  position: relative;
}

.notification-item:hover {
  background-color: #f0f5ff;
}

.notification-item.selected {
  background-color: #e7edf4;
}

.notification-item.read {
  opacity: 0.7;
}

.notification-item:not(.read)::before {
  content: '';
  position: absolute;
  left: 0;
  top: 12px;
  bottom: 12px;
  width: 4px;
  background-color: #0b79ee;
  border-radius: 0 2px 2px 0;
}

.notification-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.user-name {
  font-size: 15px;
  font-weight: bold;
  color: #0d141c;
}

.notification-message {
  font-size: 13px;
  color: #49709c;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.notification-time {
  font-size: 12px;
  color: #7890b0;
}

.notification-viewer {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.notification-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 12px;
  margin-bottom: 16px;
  border-bottom: 1px solid #e7edf4;
}

.user-image-placeholder {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #e7edf4;
  border-radius: 50%;
  font-size: 18px;
  color: #49709c;
}

.notification-header h3 {
  font-size: 17px;
  font-weight: bold;
  color: #0d141c;
  flex: 1;
  margin: 0;
}

.close-button {
  background: none;
  border: none;
  font-size: 18px;
  color: #49709c;
  cursor: pointer;
  padding: 4px 8px;
  transition: color 0.2s ease;
}

.close-button:hover {
  color: #0b79ee;
}

.notification-message-full {
  font-size: 15px;
  color: #0d141c;
  line-height: 1.5;
  text-align: justify;
}

.notification-meta {
  font-size: 14px;
  color: #49709c;
  margin-top: 12px;
  line-height: 1.6;
  text-align: justify;
}

.attachment-link {
  display: block;
  color: #0b79ee;
  text-decoration: underline;
  margin-top: 4px;
}

.attachment-link:hover {
  color: #0967d2;
}

.notification-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}

.mark-read-button {
  padding: 8px 16px;
  background-color: #0079ee;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.mark-read-button:hover {
  background-color: #095bb5;
}

.mark-unread-button {
  padding: 8px 16px;
  background-color: #e7edf4;
  color: #0d141c;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.mark-unread-button:hover {
  background-color: #d0e2ff;
}

.view-course-button {
  padding: 8px 16px;
  background-color: #4caf50;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.view-course-button:hover {
  background-color: #388e3c;
}

.delete-button {
  padding: 8px 16px;
  background-color: #ff4d4f;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.delete-button:hover {
  background-color: #cc3d3f;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
}

.modal-content h3 {
  font-size: 18px;
  font-weight: bold;
  color: #0d141c;
  margin: 0 0 12px;
}

.modal-content p {
  font-size: 15px;
  color: #49709c;
  margin: 0 0 16px;
}

.modal-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.modal-confirm {
  padding: 8px 16px;
  background-color: #ff4d4f;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
}

.modal-confirm:hover {
  background-color: #cc3d3f;
}

.modal-cancel {
  padding: 8px 16px;
  background-color: #e7edf4;
  color: #0d141c;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
}

.modal-cancel:hover {
  background-color: #d0e2ff;
}

.notification-placeholder {
  flex: 1;
  padding: 20px;
  font-size: 15px;
  color: #7890b0;
}

.courses-management {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 20px;
  min-height: 400px;
}

.courses-list-scroll {
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}

.course-card {
  border-bottom: 1px solid #e7edf4;
  padding: 16px;
  transition: background-color 0.2s ease;
  text-align: justify;
}

.course-card:hover {
  background-color: #f0f5ff;
}

.course-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.course-title {
  font-size: 16px;
  font-weight: bold;
  color: #0d141c;
  margin: 0;
}

.course-status {
  font-size: 14px;
  color: #49709c;
  margin: 0;
}

.course-status .published {
  color: #4caf50;
  font-weight: bold;
}

.course-status .hidden {
  color: #ff4d4f;
  font-weight: bold;
}

.course-description {
  font-size: 14px;
  color: #49709c;
  margin: 8px 0;
  line-height: 1.5;
}

.course-difficulty {
  font-size: 13px;
  color: #7890b0;
  margin: 4px 0;
}

.course-participants {
  font-size: 13px;
  color: #7890b0;
  margin: 4px 0;
}

.course-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.action-button {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.toggle-button {
  background-color: #0b79ee;
  color: #fff;
}

.toggle-button:hover {
  background-color: #095bb5;
}

.action-button.delete-button {
  background-color: #ff4d4f;
  color: #fff;
}

.action-button.delete-button:hover {
  background-color: #cc3d3f;
}

.no-courses {
  font-size: 15px;
  color: #7890b0;
  text-align: center;
  margin-top: 20px;
}

.users-management {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  padding: 20px;
  min-height: 400px;
}

.users-list-scroll {
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}

.user-card {
  border-bottom: 1px solid #e7edf4;
  padding: 16px;
  transition: background-color 0.2s ease;
  text-align: justify;
}

.user-card:hover {
  background-color: #f0f5ff;
}

.user-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.user-name {
  font-size: 16px;
  font-weight: bold;
  color: #0d141c;
  margin: 0;
}

.user-id {
  font-size: 14px;
  color: #49709c;
  margin: 0;
}

.user-email {
  font-size: 14px;
  color: #49709c;
  margin: 4px 0;
}

.user-joined {
  font-size: 14px;
  color: #7890b0;
  margin: 4px 0;
}

.user-role {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.role-label {
  font-size: 14px;
  color: #0d141c;
  font-weight: bold;
}

.role-select {
  padding: 6px;
  background-color: #fff;
  border: 1px solid #cedae8;
  border-radius: 4px;
  font-size: 14px;
  color: #0d141c;
  cursor: pointer;
}

.role-select:hover {
  border:1px solid #007bff;
}

.user-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.no-users {
  font-size: 15px;
  color: #7890b0;
  text-align: center;
  margin-top: 20px;
}

.loading {
  font-size: 16px;
  color: #49709c;
  text-align: center;
  padding: 20px;
}

.error {
  font-size: 16px;
  color: #ff4d4f;
  text-align: center;
  padding: 20px;
}

@media (max-width: 768px) {
  .chat-style-panel {
    flex-direction: column;
  }

  .notification-sidebar {
    width: 100%;
    max-height: 200px;
  }

  .notification-viewer {
    padding: 16px;
  }

  .users-management {
    padding: 16px;
  }

  .user-card {
    padding: 12px;
  }

  .user-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .user-actions {
    flex-direction: column;
    gap: 8px;
  }

  .action-button {
    width: 100%;
    text-align: center;
  }
}
</style>