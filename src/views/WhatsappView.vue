<template>
    <div class="whatsapp-view">
      <h2 class="page-title">Conexão WhatsApp</h2>
      <p class="page-subtitle">
        Gerencie a conexão para o envio de mensagens transacionais.
      </p>
  
      <div v-if="store.loading" class="info-card loading-card">
        <Loader2 :size="32" class="icon-spin" />
        <h3>Verificando status...</h3>
        <p>Aguarde um momento.</p>
      </div>
  
      <div v-else-if="store.status === 'connected'" class="layout-wrapper">
        <div class="info-card status-card-connected">
          <div class="status-icon connected">
            <CheckCircle :size="24" />
          </div>
          <div class="status-info">
            <h4>Conexão Ativa</h4>
            <p>O serviço de mensagens está funcionando.</p>
          </div>
          <button class="logout-button" @click="store.logout">
            Desconectar
          </button>
        </div>
        
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
      </div>
  
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
  
    </div>
  </template>
  
  <script setup>
  import { onMounted, onUnmounted, reactive } from 'vue'
  import { useWhatsappStore } from '../stores/whatsapp.js'
  import { 
    Loader2, 
    CheckCircle, 
    XCircle, 
    AlertTriangle, 
    Send,
    Lock // 👈 Importar Lock
  } from 'lucide-vue-next'
  import FormInput from '../components/global/FormInput.vue'
  import SkeletonLoader from '../components/global/SkeletonLoader.vue'
  
  const store = useWhatsappStore()
  
  const form = reactive({
    to: '',
    message: 'Olá! Esta é uma mensagem de teste do Admin CRM.'
  })
  
  onMounted(() => {
    store.checkConnection()
  })
  
  onUnmounted(() => {
    store.stopPolling()
  })
  
  const handleSend = async () => {
    const success = await store.sendMessage(form.to, form.message)
    if (success) {
      // (Opcional) Limpar formulário
      // form.to = ''
      // form.message = ''
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
    max-width: 800px; /* Limita a largura para melhor leitura */
  }
  
  /* Card Genérico */
  .info-card {
    background-color: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 0.75rem;
    padding: 1.5rem;
    position: relative;
    overflow: hidden; /* Para o overlay */
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
    margin-top: -0.75rem;
    margin-bottom: 1rem;
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
  .loading-card p {
    margin: 0;
  }
  
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
  .status-info {
    flex: 1;
  }
  .status-info h4 {
    margin: 0 0 0.25rem;
  }
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
  
  /* Card do QR Code (Quando Desconectado) */
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
  
  /* Card de Envio */
  .send-card.disabled {
    background-color: #f9fafb;
  }
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
  .disabled-overlay svg {
    color: #4b5563;
  }
  
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
  }
  .form-textarea:focus {
    outline: none;
    border-color: var(--color-primary, #007bff);
    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
  }
  
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
    align-self: flex-start; /* Botão não ocupa 100% */
  }
  .send-button:hover:not(:disabled) {
    background-color: var(--color-primary-dark, #0369a1);
  }
  .send-button:disabled {
    background-color: #a0c7e8;
    cursor: not-allowed;
  }
  
  .icon-spin {
    animation: spin 1s linear infinite;
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  </style>