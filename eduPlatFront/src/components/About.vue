<script>
export default {
  name: 'AboutUs',
  data() {
    return {
      mission: 'Наша миссия — дать людям по всему миру возможность освоить программирование на C++ с помощью доступного и высококачественного образования. Мы стремимся создать поддерживающую среду обучения, которая развивает творчество, навыки решения проблем и глубокое понимание концепций C++. Наша цель — вооружить учащихся знаниями и уверенностью, чтобы они могли преуспеть в своей карьере программистов и внести значимый вклад в технологическую индустрию.',
      values: 'В основе нашей работы лежат стремление к совершенству, инновации и инклюзивность. Мы привержены созданию исключительного образовательного контента, постоянно совершенствуем наши методы преподавания, чтобы соответствовать меняющимся потребностям учащихся, и создаём разнообразное и инклюзивное сообщество, где каждый чувствует себя принятым и поддержанным. Мы верим в силу сотрудничества, постоянного улучшения и позитивного влияния на жизнь наших студентов.',
      team: [
        { id: 1, name: 'Станислав Фабричников', role: 'Ведущий преподаватель' },
        { id: 2, name: 'Станислав Фабричников', role: 'Разработчик учебных программ' },
        { id: 3, name: 'Станислав Фабричников', role: 'Менеджер сообщества' }
      ]
    }
  }
}
</script>

<template>
  <div class="about-container">
    <div class="content-container">
      <div class="header-section">
        <h1 class="page-title">О нас</h1>
      </div>
      <h2 class="section-title">Наша миссия</h2>
      <p class="section-content">
        {{ mission }}
      </p>
      <h2 class="section-title">Наши ценности</h2>
      <p class="section-content">
        {{ values }}
      </p>
      <h2 class="section-title">Познакомьтесь с нашей командой</h2>
      <div class="team-grid">
        <div v-for="member in team" :key="member.id" class="team-member">
          <div class="photo-container">
            <img src="../assets/avatar.svg" alt="Avatar" class="photo-placeholder">
          </div>
          <div class="member-info">
            <p class="member-name">{{ member.name }}</p>
            <p class="member-role">{{ member.role }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>



<style scoped>

p, h1, h2 {
  margin: 0;
}

.about-container {
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
}

.header-section {
  background-color: #fff;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  color: #0d141c;
}

.section-title {
  font-size: 24px;
  font-weight: 700;
  color: #0d141c;
  padding: 16px 0;
}

.section-content {
  font-size: 16px;
  color: #49709c;
  padding: 0 0 16px;
  text-align: justify;
}

.team-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  padding: 16px 0;
}

.team-member {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background-color: #fff;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.photo-container {
  display: flex;
  justify-content: center;
}

.photo-placeholder {
  width: 100px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #e7edf4;
  border-radius: 50%;
  font-size: 14px;
  color: #49709c;
}

.member-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.member-name {
  font-size: 18px;
  font-weight: 600;
  color: #0d141c;
}

.member-role {
  font-size: 14px;
  color: #49709c;
}
</style>