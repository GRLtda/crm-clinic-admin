<template>
    <div class="login-container">
      <div class="login-card">
        <h1 class="login-title">Admin</h1>
        <p class="login-subtitle">Acesse o painel administrativo</p>
  
        <form @submit.prevent="handleSubmit">
          <FormInput
            label="Usuário"
            v-model="username"
            placeholder="Digite seu usuário"
            required
          />
  
          <FormInput
            label="Senha"
            type="password"
            v-model="password"
            placeholder="Digite sua senha"
            required
          />
  
          <div v-if="authStore.error" class="error-message">
            {{ authStore.error }}
          </div>
  
          <button type="submit" class="login-button" :disabled="authStore.loading">
            {{ authStore.loading ? 'Entrando...' : 'Entrar' }}
          </button>
        </form>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  import { useAuthStore } from '../stores/auth.js' // 👈 MUDANÇA AQUI
  import FormInput from '../components/global/FormInput.vue' // 👈 MUDANÇA AQUI
  
  const authStore = useAuthStore()
  
  const username = ref('')
  const password = ref('')
  
  username.value = ''
  password.value = ''
  
  const handleSubmit = () => {
    if (username.value && password.value) {
      authStore.login(username.value, password.value)
    }
  }
  </script>
  
  <style scoped>
  .login-container {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background-color: #f4f7f6; /* Fundo da página */
    /* Você pode adicionar o 'noise.jpg' aqui se quiser */
  }
  
  .login-card {
    background: #ffffff;
    padding: 2.5rem; /* 40px */
    border-radius: 1rem; /* 16px */
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
    width: 100%;
    max-width: 400px;
    box-sizing: border-box;
  }
  
  .login-title {
    text-align: center;
    font-size: 1.75rem; /* 28px */
    font-weight: 700;
    color: #222;
    margin-top: 0;
    margin-bottom: 0.5rem; /* 8px */
  }
  
  .login-subtitle {
    text-align: center;
    font-size: 1rem; /* 16px */
    color: #777;
    margin-bottom: 2rem; /* 32px */
  }
  
  .error-message {
    background-color: #ffebee; /* Fundo vermelho claro */
    color: #c62828; /* Texto vermelho escuro */
    border: 1px solid #ef9a9a; /* Borda vermelha */
    border-radius: 0.5rem; /* 8px */
    padding: 0.75rem 1rem; /* 12px 16px */
    margin-bottom: 1rem;
    font-size: 0.875rem; /* 14px */
    text-align: center;
  }
  
  .login-button {
    width: 100%;
    padding: 0.875rem 1rem; /* 14px 16px */
    font-size: 1rem; /* 16px */
    font-weight: 600;
    color: #fff;
    background-color: var(--color-primary, #007bff); /* Cor primária */
    border: none;
    border-radius: 0.5rem; /* 8px */
    cursor: pointer;
    transition:
      background-color 0.2s ease,
      transform 0.1s ease;
  }
  
  .login-button:hover {
    background-color: var(--color-primary-dark, #0056b3); /* Tom mais escuro */
  }
  
  .login-button:active {
    transform: scale(0.98);
  }
  
  .login-button:disabled {
    background-color: #a0c7e8; /* Cor quando desabilitado */
    cursor: not-allowed;
  }
  </style>