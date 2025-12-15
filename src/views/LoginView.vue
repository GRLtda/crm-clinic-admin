<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import AuthCard from '../components/layout/AuthCard.vue'
import FormInput from '../components/global/FormInput.vue'
import PasswordInput from '../components/global/PasswordInput.vue'
import ClinicLogo from '../components/global/ClinicLogo.vue'
import AppButton from '../components/global/AppButton.vue'

const router = useRouter()
const authStore = useAuthStore()

const username = ref('')
const password = ref('')

const imageUrl = new URL('@/assets/clinic1.webp', import.meta.url).href

const handleSubmit = () => {
  if (username.value && password.value) {
    authStore.login(username.value, password.value)
  }
}
</script>

<template>
  <AuthCard :image-url="imageUrl" image-side="right">

    <template #image-content>
      <div class="brand-logo" @click="router.push('/')">
        <ClinicLogo size="120px" />
      </div>
      <div class="testimonial-overlay">
        <p class="quote">“Simplesmente todas as ferramentas que minha equipe e eu precisamos.”</p>
        <div class="author">
          <strong>Karen Yue</strong>
          <span>Diretora de Tecnologia Clínica</span>
        </div>
      </div>
    </template>

    <template #title>
        <div class="header-title-wrapper">
          <span class="title-text">Bem-vindo!</span>
          <span class="subtitle-text">Por favor, insira seus dados para entrar.</span>
        </div>
    </template>

    <form @submit.prevent="handleSubmit">
      <FormInput
        label="Usuário"
        v-model="username"
        placeholder="Digite seu usuário"
        required
      />

      <PasswordInput
        label="Senha"
        v-model="password"
        :required="true"
        :show-validation="false"
      />

      <div v-if="authStore.error" class="error-message">
        {{ authStore.error }}
      </div>

      <AppButton
        type="submit"
        variant="primary"
        size="lg"
        :loading="authStore.loading"
        style="width: 100%; margin-top: 0.5rem;"
      >
        Entrar
      </AppButton>
    </form>

    <template #footer>
        <!-- Removed "Forgot Password" / "Contact" links as per admin requirements -->
    </template>

  </AuthCard>
</template>

<style scoped>
/* Overlay da Imagem */
.brand-logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.5rem;
  font-weight: 700;
}

.brand-logo:hover {
  cursor: pointer;
  opacity: 0.8;
  transition: opacity 0.3s ease;
}

.testimonial-overlay {
  margin-bottom: 2rem;
}

.quote {
  font-size: 1.75rem;
  font-weight: 600;
  line-height: 1.3;
  margin-bottom: 1.5rem;
}

.author {
  display: flex;
  flex-direction: column;
}

.author strong {
  font-size: 1rem;
  font-weight: 600;
}

.author span {
  font-size: 0.875rem;
  opacity: 0.8;
}

/* Títulos */
.header-title-wrapper {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
  text-align: left;
}

.title-text {
  font-size: 1.75rem;
  font-weight: 700;
  line-height: 1.2;
  color: #222; /* var(--preto-principal) fallback */
  margin-bottom: 0.75rem;
}

.subtitle-text {
  font-size: 0.95rem;
  color: #777; /* var(--cinza-texto) fallback */
  font-weight: 400;
  line-height: 1.5;
}

.error-message {
  background-color: #ffebee;
  color: #c62828;
  border: 1px solid #ef9a9a;
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
  font-size: 0.875rem;
  text-align: center;
}

/* Override global input styles for this view */
:deep(.form-input:focus) {
  border-color: #3b82f6 !important; /* var(--azul-principal) fallback */
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3) !important;
}
</style>
