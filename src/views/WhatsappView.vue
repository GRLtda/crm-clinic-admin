<template>
  <div class="whatsapp-view">
    <h2 class="page-title">Conexão WhatsApp</h2>
    <p class="page-subtitle">
      Gerencie a conexão e envie mensagens em massa para os donos de clínicas.
    </p>

    <!-- ESTADO: Carregando -->
    <div v-if="store.loading" class="info-card loading-card">
      <Loader2 :size="32" class="icon-spin" />
      <h3>Verificando status...</h3>
      <p>Aguarde um momento.</p>
    </div>

    <!-- ESTADO: Conectado -->
    <div v-else-if="store.status === 'connected'" class="layout-wrapper">

      <!-- Cartão de Status -->
      <div class="info-card status-card-connected">
        <div class="status-icon connected">
          <CheckCircle :size="24" />
        </div>
        <div class="status-info">
          <h4>Conexão Ativa</h4>
          <p>O serviço de mensagens está funcionando normalmente.</p>
        </div>
        <button class="logout-button" @click="store.logout">
          Desconectar
        </button>
      </div>

      <!-- Cartão de Envio Unitário (Teste) -->
      <div class="info-card send-card">
        <h4>Enviar Mensagem de Teste</h4>
        <form @submit.prevent="handleSend" class="send-form">
          <FormInput
            v-model="form.to"
            label="Número (com DDI e DDD)"
            placeholder="Ex: 5511999998888"
            required
          />
          <div class="form-group">
            <label for="message" class="form-label">Mensagem</label>
            <textarea
              id="message"
              v-model="form.message"
              class="form-textarea"
              placeholder="Digite sua mensagem de teste..."
              rows="4"
              required
            ></textarea>
          </div>
          <button type="submit" class="send-button" :disabled="store.sending">
            <Loader2 v-if="store.sending" :size="18" class="icon-spin" />
            <Send v-else :size="18" />
            {{ store.sending ? 'Enviando...' : 'Enviar Mensagem' }}
          </button>
        </form>
      </div>

      <!-- ===== CARD DE BROADCAST EM MASSA ===== -->
      <div class="info-card broadcast-card">
        <div class="broadcast-header">
          <div class="broadcast-title-group">
            <div class="broadcast-icon">
              <Megaphone :size="20" />
            </div>
            <div>
              <h4>Envio em Massa</h4>
              <p class="card-subtitle">Dispara a mensagem abaixo para todos os donos de clínicas ativas e com pagamento pendente.</p>
            </div>
          </div>
          <div class="broadcast-badge">
            <Users :size="14" />
            <span>active + past_due</span>
          </div>
        </div>

        <div class="form-group">
          <label for="broadcast-message" class="form-label">Mensagem do Broadcast</label>
          <textarea
            id="broadcast-message"
            v-model="broadcastForm.message"
            class="form-textarea"
            placeholder="Ex: Olá! Temos uma novidade importante para sua clínica..."
            rows="5"
            :disabled="store.broadcasting"
          ></textarea>
        </div>

        <div class="broadcast-actions">
          <button
            class="broadcast-button"
            :disabled="store.broadcasting || !broadcastForm.message.trim()"
            @click="openConfirmModal"
          >
            <Loader2 v-if="store.broadcasting" :size="18" class="icon-spin" />
            <Send v-else :size="18" />
            {{ store.broadcasting ? 'Disparando... (pode demorar)' : 'Disparar para Todos' }}
          </button>

          <button
            v-if="store.broadcastResult"
            class="clear-result-button"
            @click="store.broadcastResult = null"
          >
            Limpar Resultado
          </button>
        </div>

        <!-- Resultado do Broadcast -->
        <div v-if="store.broadcastResult" class="broadcast-result">
          <div class="result-stats">
            <div class="result-stat total">
              <span class="stat-value">{{ store.broadcastResult.total }}</span>
              <span class="stat-label">Total</span>
            </div>
            <div class="result-stat success">
              <CheckCircle :size="16" />
              <span class="stat-value">{{ store.broadcastResult.success }}</span>
              <span class="stat-label">Enviados</span>
            </div>
            <div class="result-stat failed">
              <XCircle :size="16" />
              <span class="stat-value">{{ store.broadcastResult.failed }}</span>
              <span class="stat-label">Falharam</span>
            </div>
          </div>

          <div v-if="store.broadcastResult.errors?.length" class="result-errors">
            <p class="errors-title">
              <AlertTriangle :size="14" />
              Detalhes das falhas:
            </p>
            <ul class="errors-list">
              <li v-for="(err, idx) in store.broadcastResult.errors" :key="idx">
                <strong>{{ err.clinic }}</strong> ({{ err.owner }} — {{ err.phone }}):
                <span class="error-reason">{{ err.reason }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- ESTADO: Desconectado (QR Code) -->
    <div v-else class="layout-wrapper">
      <div class="info-card qr-card">
        <h4>Conectar ao WhatsApp</h4>
        <p class="card-subtitle">
          Escaneie o QR Code com seu celular para ativar o serviço de mensagens.
        </p>

        <div class="qr-code-wrapper">
          <div v-if="store.status === 'qrcode' && store.qrCodeData" class="qr-code-content">
            <img :src="store.qrCodeData" alt="QR Code do WhatsApp" />
            <div class="qr-status-box pending">
              <AlertTriangle :size="16" />
              <span>Aguardando leitura...</span>
            </div>
          </div>

          <div v-else class="qr-code-content">
            <SkeletonLoader width="280px" height="280px" radius="0.75rem" />
            <div class="qr-status-box loading">
              <Loader2 :size="16" class="icon-spin" />
              <span>{{ store.status === 'creating_qr' ? 'Gerando QR Code...' : 'Carregando...' }}</span>
            </div>
          </div>
        </div>

        <p class="qr-help-text">
          Abra o WhatsApp no seu celular, vá em <strong>Aparelhos Conectados</strong> &gt; <strong>Conectar um aparelho</strong>.
        </p>
      </div>

      <div class="info-card send-card disabled">
        <div class="disabled-overlay">
          <Lock :size="20" />
          <p>Conecte-se primeiro para enviar mensagens.</p>
        </div>
        <h4>Enviar Mensagem de Teste</h4>
      </div>
    </div>

    <!-- Modal de Confirmação do Broadcast -->
    <Teleport to="body">
      <div v-if="showConfirmModal" class="modal-backdrop" @click.self="showConfirmModal = false">
        <div class="confirm-modal">
          <div class="confirm-modal-icon">
            <Megaphone :size="28" />
          </div>
          <h3>Confirmar Envio em Massa</h3>
          <p>
            Você está prestes a enviar uma mensagem para <strong>todos os donos de clínicas com assinatura ativa e pagamento pendente</strong>.
            Esta ação não pode ser desfeita.
          </p>
          <div class="confirm-message-preview">
            <p class="preview-label">Mensagem:</p>
            <p class="preview-text">{{ broadcastForm.message }}</p>
          </div>
          <div class="confirm-modal-actions">
            <button class="cancel-modal-button" @click="showConfirmModal = false">
              Cancelar
            </button>
            <button class="confirm-modal-button" @click="handleBroadcast">
              <Send :size="16" />
              Confirmar e Disparar
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, reactive, ref } from 'vue'
import { useWhatsappStore } from '../stores/whatsapp.js'
import {
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Send,
  Lock,
  Megaphone,
  Users,
} from 'lucide-vue-next'
import FormInput from '../components/global/FormInput.vue'
import SkeletonLoader from '../components/global/SkeletonLoader.vue'

const store = useWhatsappStore()

// Formulário de envio unitário (teste)
const form = reactive({
  to: '',
  message: 'Olá! Esta é uma mensagem de teste do Admin CRM.'
})

// Formulário e controle do broadcast
const broadcastForm = reactive({ message: '' })
const showConfirmModal = ref(false)

onMounted(() => {
  store.checkConnection()
})

onUnmounted(() => {
  store.stopPolling()
})

const handleSend = async () => {
  await store.sendMessage(form.to, form.message)
}

const openConfirmModal = () => {
  if (!broadcastForm.message.trim()) return
  showConfirmModal.value = true
}

const handleBroadcast = async () => {
  showConfirmModal.value = false
  const success = await store.broadcastMessage(broadcastForm.message)
  if (success) {
    broadcastForm.message = ''
  }
}
</script>

<style scoped>
.page-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}
.page-subtitle {
  font-size: 1rem;
  color: #6b7280;
  margin-top: 0.25rem;
  margin-bottom: 1.5rem;
  max-width: 600px;
}

/* Layout Wrapper */
.layout-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-width: 800px;
}

/* Card Genérico */
.info-card {
  background-color: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.5rem;
  position: relative;
  overflow: hidden;
}
.info-card h4 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 1rem;
}
.card-subtitle {
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: -0.5rem;
  margin-bottom: 1.25rem;
}

/* Card de Carregamento Inicial */
.loading-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.5rem;
  color: #6b7280;
}
.loading-card h3 {
  font-size: 1.25rem;
  margin: 1rem 0 0.25rem;
  color: #111827;
}
.loading-card p { margin: 0; }

/* Card de Status (Quando Conectado) */
.status-card-connected {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.status-icon {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.status-icon.connected {
  background-color: #dcfce7;
  color: #166534;
}
.status-info { flex: 1; }
.status-info h4 { margin: 0 0 0.25rem; }
.status-info p {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}
.logout-button {
  font-size: 0.875rem;
  font-weight: 600;
  border: 1px solid #d1d5db;
  background-color: #fff;
  color: #dc2626;
  cursor: pointer;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  transition: all 0.2s ease;
}
.logout-button:hover {
  background-color: #fee2e2;
  border-color: #fca5a5;
}

/* Card do QR Code */
.qr-card h4 {
  border-bottom: 1px solid #f3f4f6;
  padding-bottom: 0.75rem;
}
.qr-code-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 1rem 0;
}
.qr-code-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}
.qr-code-wrapper img {
  width: 280px;
  height: 280px;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
}
.qr-status-box {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 99px;
  font-size: 0.875rem;
  font-weight: 500;
}
.qr-status-box.loading { background-color: #f3f4f6; color: #4b5563; }
.qr-status-box.pending { background-color: #fefce8; color: #a16207; }
.qr-help-text {
  font-size: 0.875rem;
  color: #6b7280;
  text-align: center;
  background-color: #f9fafb;
  padding: 0.75rem;
  border-radius: 0.5rem;
  margin: 0;
}

/* Card de Envio (Unitário) */
.send-card.disabled { background-color: #f9fafb; }
.disabled-overlay {
  position: absolute;
  inset: 0;
  background-color: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(2px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 5;
  border-radius: 0.75rem;
  padding: 1rem;
}
.disabled-overlay p {
  font-weight: 500;
  color: #4b5563;
  margin-top: 0.5rem;
  text-align: center;
}
.disabled-overlay svg { color: #4b5563; }

/* Formulários */
.send-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.form-group { width: 100%; }
.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #333;
}
.form-textarea {
  width: 100%;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  line-height: 1.5;
  color: #111;
  background-color: #f8f9fa;
  border: 1px solid #ced4da;
  border-radius: 0.5rem;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
  box-sizing: border-box;
  font-family: inherit;
  resize: vertical;
}
.form-textarea:focus {
  outline: none;
  border-color: var(--color-primary, #007bff);
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}
.form-textarea:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Botão de Envio */
.send-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #fff;
  background-color: var(--color-primary, #0284c7);
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
  align-self: flex-start;
}
.send-button:hover:not(:disabled) {
  background-color: var(--color-primary-dark, #0369a1);
}
.send-button:disabled {
  background-color: #a0c7e8;
  cursor: not-allowed;
}

/* ===== CARD DE BROADCAST ===== */
.broadcast-card {
  border: 1px solid #fbbf24;
  background: linear-gradient(to bottom right, #fffbeb, #ffffff);
}

.broadcast-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
}

.broadcast-title-group {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.broadcast-icon {
  width: 40px;
  height: 40px;
  border-radius: 0.5rem;
  background-color: #fef3c7;
  color: #d97706;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.broadcast-title-group h4 {
  margin: 0 0 0.25rem;
}
.broadcast-title-group .card-subtitle {
  margin: 0;
}

.broadcast-badge {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  background-color: #fef9c3;
  color: #92400e;
  border: 1px solid #fde68a;
  border-radius: 99px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
}

.broadcast-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  margin-top: 1rem;
}

.broadcast-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #fff;
  background-color: #d97706;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
}
.broadcast-button:hover:not(:disabled) {
  background-color: #b45309;
}
.broadcast-button:disabled {
  background-color: #fcd34d;
  color: #78350f;
  cursor: not-allowed;
}

.clear-result-button {
  font-size: 0.8rem;
  font-weight: 500;
  color: #6b7280;
  background: none;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  padding: 0.5rem 0.875rem;
  cursor: pointer;
  transition: all 0.15s ease;
}
.clear-result-button:hover {
  background-color: #f3f4f6;
  color: #374151;
}

/* Resultado do Broadcast */
.broadcast-result {
  margin-top: 1.25rem;
  border-top: 1px solid #e5e7eb;
  padding-top: 1.25rem;
}

.result-stats {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.result-stat {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  min-width: 100px;
}
.result-stat .stat-value {
  font-size: 1.25rem;
  font-weight: 700;
}
.result-stat .stat-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: inherit;
  opacity: 0.8;
}

.result-stat.total { background-color: #f3f4f6; color: #374151; flex-direction: column; align-items: center; }
.result-stat.success { background-color: #dcfce7; color: #166534; flex-direction: column; align-items: center; }
.result-stat.failed { background-color: #fee2e2; color: #991b1b; flex-direction: column; align-items: center; }

.result-errors {
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.5rem;
  padding: 1rem;
}
.errors-title {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #991b1b;
  margin: 0 0 0.75rem;
}
.errors-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}
.errors-list li {
  font-size: 0.8rem;
  color: #7f1d1d;
  padding: 0.25rem 0;
  border-bottom: 1px dashed #fecaca;
}
.errors-list li:last-child { border-bottom: none; }
.error-reason {
  color: #b91c1c;
  font-style: italic;
  margin-left: 0.25rem;
}

/* ===== MODAL DE CONFIRMAÇÃO ===== */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
  backdrop-filter: blur(4px);
}

.confirm-modal {
  background-color: #fff;
  border-radius: 1rem;
  padding: 2rem;
  max-width: 480px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  text-align: center;
}

.confirm-modal-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background-color: #fef3c7;
  color: #d97706;
  display: flex;
  align-items: center;
  justify-content: center;
}

.confirm-modal h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.confirm-modal p {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.6;
}

.confirm-message-preview {
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 0.875rem 1rem;
  width: 100%;
  text-align: left;
}
.preview-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  margin: 0 0 0.35rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.preview-text {
  font-size: 0.875rem;
  color: #111827;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}

.confirm-modal-actions {
  display: flex;
  gap: 0.75rem;
  width: 100%;
  justify-content: center;
  flex-wrap: wrap;
}

.cancel-modal-button {
  flex: 1;
  min-width: 120px;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  border: 1px solid #d1d5db;
  background-color: #fff;
  color: #374151;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.15s ease;
}
.cancel-modal-button:hover {
  background-color: #f3f4f6;
}

.confirm-modal-button {
  flex: 1;
  min-width: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #fff;
  background-color: #d97706;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
}
.confirm-modal-button:hover {
  background-color: #b45309;
}

/* Animação de spin */
.icon-spin {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>