<script setup>

</script>

<script setup>
</script>

<template>
  <div class="container">
    <main>
      <div class="content-container">
        <div class="hero-section">
          <img src="../assets/plusiC.png" alt="plusiC Logo" class="photo-placeholder" />
          <div class="hero-text">
            <h1>Освойте программирование на C++ с plusiC</h1>
            <h2>Раскройте возможности C++ с нашими всесторонними курсами. Учитесь у экспертов индустрии и создавайте реальные приложения.</h2>
          </div>
          <router-link to="/courses" class="primary-button">Изучить курсы</router-link>
        </div>
        <div class="features-section">
          <div class="features-header">
            <h1>Почему выбирают plusiC?</h1>
            <p>Наша платформа предлагает уникальный образовательный опыт, созданный для начинающих разработчиков на C++.</p>
          </div>
          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-info">
                <h2>Интерактивные упражнения по программированию</h2>
                <p>Практикуйтесь в программировании с мгновенной обратной связью и интерактивными заданиями.</p>
              </div>
            </div>
            <div class="feature-card">
              <div class="feature-info">
                <h2>Видеоуроки от экспертов</h2>
                <p>Учитесь у опытных преподавателей с помощью понятных и кратких видеоуроков.</p>
              </div>
            </div>
            <div class="feature-card">
              <div class="feature-info">
                <h2>Сертификат об окончании</h2>
                <p>Получите сертификат по завершении каждого курса, чтобы продемонстрировать свои навыки.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f5f7fa;
}

main {
  display: flex;
  flex: 1;
  justify-content: center;
  padding: 20px 24px;
}

.content-container {
  display: flex;
  flex-direction: column;
  max-width: 960px;
  width: 100%;
}

.hero-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  padding: 24px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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

.photo-placeholder {
  width: 130px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #e7edf4;
  border-radius: 8px;
  font-size: 14px;
  color: #49709c;
}

.hero-text {
  display: flex;
  flex-direction: column;
  gap: 12px;
  text-align: center;
}

.hero-text h1 {
  font-size: 32px;
  font-weight: 700;
  color: #0d141c;
}

.hero-text h2 {
  font-size: 16px;
  color: #49709c;
}

.features-section {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 24px 0;
}

.features-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-align: center;
}

.features-header h1 {
  font-size: 24px;
  font-weight: 700;
  color: #0d141c;
}

.features-header p {
  font-size: 16px;
  color: #49709c;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.feature-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background-color: #fff;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.icon {
  width: 40px;
  height: 40px;
  background-color: #e7edf4;
  border-radius: 4px;
}

.feature-info h2 {
  font-size: 18px;
  font-weight: 700;
  color: #0d141c;
}

.feature-info p {
  font-size: 14px;
  color: #49709c;
}

@media (min-width: 480px) {
  .hero-text h1 {
    font-size: 36px;
  }

  .hero-text h2 {
    font-size: 18px;
  }

  .features-header h1 {
    font-size: 28px;
  }

  .primary-button {
    height: 48px;
    font-size: 16px;
  }
}
</style>