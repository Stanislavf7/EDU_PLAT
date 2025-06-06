<script>
export default {
  name: 'PasswordRecovery',
  data() {
    return {
      form: {
        identifier: ''
      }
    }
  }
}
</script>

<template>
  <div class="recovery-container">
    <div class="content-container">
      <div class="header-section">
        <div class="header-text">
          <h1 class="recovery-title">Восстановление пароля</h1>
          <p class="recovery-description">Введите вашу электронную почту или имя пользователя для сброса пароля.</p>
        </div>
      </div>
      <div class="form-container">
        <label class="form-label">
          <input v-model="form.identifier" type="text" class="form-input" placeholder="Электронная почта или имя пользователя" />
        </label>
      </div>
      <div class="action-section">
        <button class="submit-button">Отправить</button>
      </div>
      <p class="instruction-text">Проверьте вашу электронную почту для дальнейших инструкций по сбросу пароля.</p>
    </div>
  </div>
</template>

<style scoped>
.recovery-container {
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

.recovery-title {
  font-size: 32px;
  font-weight: 700;
  color: #0d141c;
}

.recovery-description {
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

.action-section {
  padding: 12px 0;
}

.submit-button {
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

.submit-button:hover {
  background-color: #0967d2;
}

.instruction-text {
  font-size: 14px;
  color: #49709c;
  padding: 8px 0;
  text-align: center;
}
</style>