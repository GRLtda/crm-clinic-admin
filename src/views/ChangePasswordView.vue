<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { Lock, ShieldCheck, AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-vue-next'
import api from '../utils/api'
import { useToast } from 'vue-toastification'

const authStore = useAuthStore()
const router = useRouter()
const toast = useToast()

const newPassword = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const loading = ref(false)

const hasMinLength = computed(() => newPassword.value.length >= 8)
const hasSymbol = computed(() => /[!@#$%^&*(),.?":{}|<>]/.test(newPassword.value))
const passwordsMatch = computed(() => newPassword.value === confirmPassword.value && confirmPassword.value !== '')
const isFormValid = computed(() => hasMinLength.value && hasSymbol.value && passwordsMatch.value)

const handleSubmit = async () => {
  if (!isFormValid.value) return

  loading.value = true
  try {
    const response = await api.post('/auth/change-password', {
      newPassword: newPassword.value
    })

    const { token } = response.data

    toast.success('Senha alterada com sucesso! Bem-vindo.')
    
    // Atualiza o estado no store
    authStore.updateToken(token)
    authStore.mustChangePassword = false
    localStorage.setItem('must_change_password', 'false')
    
    // Redireciona para o dashboard
    router.push({ name: 'dashboard' })
  } catch (err) {
    toast.error(err.response?.data?.message || 'Erro ao alterar senha.')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="change-password-container">
    <div class="background-decor">
      <div class="circle circle-1"></div>
      <div class="circle circle-2"></div>
    </div>

    <div class="auth-card">
      <div class="card-header">
        <div class="icon-wrapper">
          <ShieldCheck :size="32" />
        </div>
        <h1>Configure sua Senha</h1>
        <p>Por motivos de segurança, você precisa definir uma nova senha no seu primeiro acesso ao AgendaDoutor.</p>
      </div>

      <form @submit.prevent="handleSubmit" class="auth-form">
        <div class="form-group">
          <label>Nova Senha</label>
          <div class="input-wrapper" :class="{ 'focused': !!newPassword }">
            <Lock class="input-icon" :size="18" />
            <input 
              :type="showPassword ? 'text' : 'password'" 
              v-model="newPassword"
              placeholder="Digite sua nova senha"
              required
            >
            <button type="button" @click="showPassword = !showPassword" class="toggle-password">
              <Eye v-if="!showPassword" :size="18" />
              <EyeOff v-else :size="18" />
            </button>
          </div>
        </div>

        <div class="form-group">
          <label>Confirmar Senha</label>
          <div class="input-wrapper" :class="{ 'focused': !!confirmPassword }">
            <Lock class="input-icon" :size="18" />
            <input 
              :type="showPassword ? 'text' : 'password'" 
              v-model="confirmPassword"
              placeholder="Repita a nova senha"
              required
            >
          </div>
        </div>

        <div class="requirements-box">
          <div class="requirements-header">
            <AlertCircle :size="16" />
            <span>Requisitos de Segurança</span>
          </div>
          <ul class="requirements-list">
            <li :class="{ 'met': hasMinLength }">Mínimo de 8 caracteres</li>
            <li :class="{ 'met': hasSymbol }">Pelo menos um símbolo (!@#...)</li>
            <li :class="{ 'met': passwordsMatch }">As senhas devem coincidir</li>
          </ul>
        </div>

        <button type="submit" class="submit-btn" :disabled="!isFormValid || loading">
          <Loader2 v-if="loading" class="animate-spin" :size="20" />
          <span v-else>Definir Senha e Entrar</span>
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.change-password-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f8fafc;
  padding: 1.5rem;
  position: relative;
  overflow: hidden;
}

.background-decor {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.circle {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.4;
}

.circle-1 {
  width: 400px;
  height: 400px;
  background: var(--azul-principal);
  top: -100px;
  opacity: 0.2;
  right: -100px;
}

.circle-2 {
  width: 300px;
  height: 300px;
  background: #6366f1;
  opacity: 0.2;
  bottom: -50px;
  left: -50px;
}

.auth-card {
  width: 100%;
  max-width: 440px;
}

.card-header {
  text-align: center;
  margin-bottom: 2rem;
}

.icon-wrapper {
  width: 64px;
  height: 64px;
  background: #eff6ff;
  color: var(--azul-principal);
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
}

.card-header h1 {
  font-size: 1.5rem;
  color: #1e293b;
  margin-bottom: 0.5rem;
}

.card-header p {
  font-size: 0.875rem;
  color: #64748b;
  line-height: 1.5;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  color: #94a3b8;
  letter-spacing: 0.05em;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  border: 1.5px solid #e2e8f0;
  border-radius: 0.75rem;
  transition: all 0.2s ease;
  background: #fcfcfc;
}

.input-wrapper.focused {
  border-color: var(--azul-principal);
  background: white;
}

.input-wrapper:focus-within {
  border-color: var(--azul-principal);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  background: white;
}

.input-icon {
  position: absolute;
  left: 1rem;
  color: #94a3b8;
}

.input-wrapper input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.75rem;
  border: none;
  background: transparent;
  outline: none;
  font-size: 0.9375rem;
  color: #1e293b;
}

.toggle-password {
  position: absolute;
  right: 0.75rem;
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 0.25rem;
}

.toggle-password:hover {
  color: #64748b;
}

.requirements-box {
  background: #f8fafc;
  padding: 1rem;
  border-radius: 0.75rem;
  border: 1px solid #e2e8f0;
}

.requirements-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #475569;
  margin-bottom: 0.75rem;
}

.requirements-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.requirements-list li {
  font-size: 0.75rem;
  color: #94a3b8;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.requirements-list li::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #cbd5e1;
}

.requirements-list li.met {
  color: #10b981;
}

.requirements-list li.met::before {
  background: #10b981;
}

.submit-btn {
  margin-top: 1rem;
  background: var(--azul-principal);
  color: white;
  padding: 0.875rem;
  border-radius: 0.75rem;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.submit-btn:hover:not(:disabled) {
  background: var(--azul-escuro);
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.submit-btn:active:not(:disabled) {
  transform: translateY(0);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  filter: grayscale(0.5);
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>
