
<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useCourseStore } from '../stores/course';

const router = useRouter();
const courseStore = useCourseStore();
const searchQuery = ref('');
const sortKey = ref('name');

// Загрузка курсов при монтировании
onMounted(() => {
  courseStore.fetchCourses();
});

// Фильтрация курсов по поиску и статусу is_published
const filteredCourses = computed(() => {
  const publishedCourses = courseStore.courses.filter(course => course.is_published === true);
  if (!searchQuery.value) return publishedCourses;
  const query = searchQuery.value.toLowerCase();
  return publishedCourses.filter(course =>
    course.title.toLowerCase().includes(query) ||
    course.description.toLowerCase().includes(query)
  );
});

// Сортировка курсов
const sortedCourses = computed(() => {
  const sorted = [...filteredCourses.value];
  if (sortKey.value === 'name') {
    return sorted.sort((a, b) => a.title.localeCompare(b.title));
  } else if (sortKey.value === 'difficulty') {
    const difficultyOrder = { Beginner: 1, Intermediate: 2, Advanced: 3 };
    return sorted.sort((a, b) => difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]);
  } else if (sortKey.value === 'dateAdded') {
    return sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }
  return sorted;
});

const sortCourses = (key) => {
  sortKey.value = key;
};

const viewCourse = (course) => {
  courseStore.setCourse(course);
  router.push({ name: 'Overview', params: { id: course.id } });
};
</script>

<template>
  <div class="courses-container">
    <div class="courses-header">
      <div class="header-text">
        <h1 class="courses-title">Курсы по C++</h1>
        <p class="courses-description">
          Ознакомьтесь с нашими всесторонними курсами по C++, разработанными для всех уровней подготовки — от новичков до опытных программистов. 
          Освойте основы, углубитесь в продвинутые темы и создавайте реальные приложения.
        </p>
      </div>
    </div>
    <div class="search-container">
      <label class="search-label">
        <div class="search-wrapper">
          <input v-model="searchQuery" type="text" class="search-input" placeholder="Поиск курсов" />
        </div>
      </label>
    </div>
    <div class="sort-buttons">
      <button class="sort-button" @click="sortCourses('name')">По названию</button>
      <button class="sort-button" @click="sortCourses('difficulty')">По сложности</button>
      <button class="sort-button" @click="sortCourses('dateAdded')">По дате добавления</button>
    </div>
    <div class="courses-list">
      <div v-for="course in sortedCourses" :key="course.id" class="course-card">
        <div class="course-content">
          <img src="../assets/cplusplus.svg" alt="Course Image" class="photo-placeholder">
          <div class="course-info">
            <h3>{{ course.title }}</h3>
            <p>{{ course.description }}</p>
            <p><strong>Сложность:</strong> {{ course.difficulty }}</p>
            <p><strong>Дата добавления:</strong> {{ new Date(course.created_at).toLocaleDateString('ru-RU') }}</p>
          </div>
          <button class="view-button" @click="viewCourse(course)">Просмотреть курс</button>
        </div>
      </div>
      <p v-if="!sortedCourses.length" class="no-courses">Курсы не найдены.</p>
    </div>
  </div>
</template>

<style scoped>
.courses-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 20px 24px;
  background-color: #f5f7fa;
}

.courses-header {
  background-color: #fff;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 16px;
}

.header-text {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 960px;
  margin: 0 auto;
}

.courses-title {
  font-size: 32px;
  font-weight: 700;
  color: #0d141c;
}

.courses-description {
  font-size: 16px;
  color: #49709c;
}

.search-container {
  padding: 12px 0;
  max-width: 480px;
  margin: 0 auto;
}

.search-label {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.search-wrapper {
  display: flex;
  align-items: center;
  background-color: #fff;
  border: 1px solid #cedae8;
  border-radius: 8px;
}

.search-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 12px;
  color: #49709c;
  width: 40px;
}

.search-input {
  width: 356px;
  height: 48px;
  border: none;
  background-color: transparent;
  padding: 12px;
  font-size: 16px;
  color: #0d141c;
}

.search-input::placeholder {
  color: #97a4b5;
}

.sort-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px 0;
  justify-content: center;
}

.sort-button {
  height: 40px;
  padding: 0 24px;
  background-color: #e7edf4;
  color: #0d141c;
  font-size: 14px;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.sort-button:hover {
  background-color: #d1dbe7;
}

.courses-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px 0;
}

.course-card {
  background-color: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.course-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.photo-placeholder {
  width: 100px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #e7edf4;
  border-radius: 8px;
  font-size: 14px;
  color: #49709c;
}

.course-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.course-info h3 {
  font-size: 18px;
  font-weight: 600;
  color: #0d141c;
}

.course-info p {
  font-size: 14px;
  color: #49709c;
}

.view-button {
  height: 40px;
  padding: 0 24px;
  background-color: #0b79ee;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  text-decoration: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.view-button:hover {
  background-color: #0967d2;
}

.no-courses {
  font-size: 15px;
  color: #7890b0;
  text-align: center;
  margin-top: 20px;
}
</style>
