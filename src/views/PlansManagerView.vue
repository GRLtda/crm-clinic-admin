<template>
  <div class="plans-manager-view animate-fade-in">
    <div class="page-header">
      <h2 class="page-title">Gerenciar Planos</h2>
      <button @click="openModal()" class="btn-primary">
        + Novo Plano
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Carregando planos...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-msg">
      <p>{{ error }}</p>
      <button @click="fetchPlans" class="btn-retry">Tentar Novamente</button>
    </div>

    <!-- Plans Grid -->
    <div v-else class="plans-grid">
      <div v-for="plan in plans" :key="plan._id" class="plan-card">
        <div class="plan-header">
          <h3>{{ plan.name }}</h3>
          <span class="plan-slug">{{ plan.slug }}</span>
        </div>
        
        <div class="plan-price">
          <span class="currency">R$</span>
          <span class="amount">{{ (plan.value / 100).toFixed(2).replace('.', ',') }}</span>
        </div>

        <div class="plan-limits">
          <h4>Limites</h4>
          <ul>
            <li><strong>Médicos:</strong> {{ plan.limits?.doctors || 0 }}</li>
            <li><strong>Fotos:</strong> {{ plan.limits?.photos || 0 }}</li>
            <li><strong>Armazenamento:</strong> {{ plan.limits?.uploadSizeMB || 0 }} MB</li>
          </ul>
        </div>

        <div class="plan-modules">
          <h4>Módulos Ativos</h4>
          <div class="modules-tags">
            <span v-for="(active, key) in plan.modules" :key="key" class="module-tag" :class="{ active: active }">
              {{ key }}: {{ active ? 'Sim' : 'Não' }}
            </span>
          </div>
        </div>

        <div class="plan-actions">
          <button @click="openModal(plan)" class="btn-edit">Editar</button>
          <button @click="deletePlan(plan._id)" class="btn-delete">Excluir</button>
        </div>
      </div>
    </div>

    <!-- Modal Form (Create/Edit) -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <h3>{{ editingPlan ? 'Editar Plano' : 'Novo Plano' }}</h3>
        
        <form @submit.prevent="savePlan">
          <div class="form-group">
            <label>Nome</label>
            <input v-model="form.name" required type="text" placeholder="Ex: Premium">
          </div>
          
          <div class="form-group">
            <label>Slug (identificador único)</label>
            <input v-model="form.slug" required type="text" placeholder="Ex: premium">
          </div>
          
          <div class="form-group">
            <label>Preço (Centavos)</label>
            <input v-model.number="form.value" required type="number" placeholder="Ex: 15900 (R$ 159,00)">
          </div>

          <div class="form-group">
            <label>Price ID (Stripe)</label>
            <input v-model="form.priceId" required type="text" placeholder="price_...">
          </div>

          <div class="form-section">
            <h4>Limites</h4>
            <div class="row">
              <div class="col">
                <label>Médicos</label>
                <input v-model.number="form.limits.doctors" type="number">
              </div>
              <div class="col">
                <label>Fotos</label>
                <input v-model.number="form.limits.photos" type="number">
              </div>
               <div class="col">
                <label>Upload (MB)</label>
                <input v-model.number="form.limits.uploadSizeMB" type="number">
              </div>
            </div>
          </div>

          <div class="form-section">
            <h4>Módulos</h4>
            <div class="checkbox-group">
              <label><input type="checkbox" v-model="form.modules.workflows"> Workflows</label>
              <label><input type="checkbox" v-model="form.modules.finance"> Financeiro</label>
              <label><input type="checkbox" v-model="form.modules.whatsapp"> WhatsApp</label>
              <label><input type="checkbox" v-model="form.modules.ai_reports"> Relatórios IA</label>
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" @click="closeModal" class="btn-cancel">Cancelar</button>
            <button type="submit" class="btn-save" :disabled="saving">
              {{ saving ? 'Salvando...' : 'Salvar' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';
import axios from 'axios';
import { useAuthStore } from '../stores/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const authStore = useAuthStore();

const plans = ref([]);
const loading = ref(true);
const error = ref(null);
const showModal = ref(false);
const saving = ref(false);
const editingPlan = ref(null);

const form = reactive({
  name: '',
  slug: '',
  value: 0,
  priceId: '',
  limits: { doctors: 1, photos: 20, uploadSizeMB: 10 },
  modules: { workflows: false, finance: false, whatsapp: false, ai_reports: false }
});

const getHeaders = () => ({
    ...authStore.authHeaders
});

const fetchPlans = async () => {
  try {
    loading.value = true;
    const { data } = await axios.get(`${API_BASE_URL}/plans`, { headers: getHeaders() });
    plans.value = data;
  } catch (err) {
    error.value = 'Erro ao carregar planos.';
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const openModal = (plan = null) => {
  if (plan) {
    editingPlan.value = plan;
    // Copy values to form
    Object.assign(form, {
      name: plan.name,
      slug: plan.slug,
      value: plan.value,
      priceId: plan.priceId,
      limits: { ...plan.limits },
      modules: { ...plan.modules }
    });
  } else {
    editingPlan.value = null;
    Object.assign(form, {
      name: '',
      slug: '',
      value: 0,
      priceId: '',
      limits: { doctors: 1, photos: 20, uploadSizeMB: 10 },
      modules: { workflows: false, finance: false, whatsapp: false, ai_reports: false }
    });
  }
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
};

const savePlan = async () => {
  try {
    saving.value = true;
    if (editingPlan.value) {
      await axios.put(`${API_BASE_URL}/plans/${editingPlan.value._id}`, form, { headers: getHeaders() });
    } else {
      await axios.post(`${API_BASE_URL}/plans`, form, { headers: getHeaders() });
    }
    await fetchPlans();
    closeModal();
  } catch (err) {
    alert('Erro ao salvar plano: ' + (err.response?.data?.message || err.message));
  } finally {
    saving.value = false;
  }
};

const deletePlan = async (id) => {
  if (!confirm('Tem certeza que deseja excluir este plano?')) return;
  try {
    await axios.delete(`${API_BASE_URL}/plans/${id}`, { headers: getHeaders() });
    await fetchPlans();
  } catch (err) {
    alert('Erro ao excluir plano.');
  }
};

onMounted(() => {
  fetchPlans();
});
</script>

<style scoped>
.plans-manager-view {
  padding: 2rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
}

.plans-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.plan-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.plan-header h3 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
}

.plan-slug {
  font-size: 0.8rem;
  color: #64748b;
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 4px;
}

.plan-price .amount {
  font-size: 1.5rem;
  font-weight: 700;
  color: #0f172a;
}

.plan-limits ul {
  list-style: none;
  padding: 0;
  font-size: 0.9rem;
}

.modules-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.module-tag {
  font-size: 0.75rem;
  padding: 4px 8px;
  border-radius: 4px;
  background: #f1f5f9;
  color: #64748b;
}

.module-tag.active {
  background: #dcfce7;
  color: #166534;
}

.plan-actions {
  margin-top: auto;
  display: flex;
  gap: 1rem;
}

.btn-primary {
  background: #2563eb;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 500;
  border: none;
  cursor: pointer;
}

.btn-edit, .btn-delete {
  flex: 1;
  padding: 0.5rem;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  cursor: pointer;
  background: white;
}

.btn-delete {
  color: #ef4444;
  border-color: #fee2e2;
}

.btn-delete:hover {
  background: #fef2f2;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  width: 500px;
  max-width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.form-group {
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-size: 0.9rem;
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.form-group input {
  padding: 0.5rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
}

.form-section {
  margin-top: 1.5rem;
  border-top: 1px solid #e2e8f0;
  padding-top: 1rem;
}

.checkbox-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.modal-actions {
  margin-top: 2rem;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.btn-save {
  background: #2563eb;
  color: white;
  border: none;
  padding: 0.5rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
}

.btn-cancel {
  background: transparent;
  border: 1px solid #cbd5e1;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
}
</style>
