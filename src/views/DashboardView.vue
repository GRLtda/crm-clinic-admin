<template>
  <div class="dashboard-view">
    <div class="filter-bar">
      <h2 class="page-title">Resumo Geral</h2>
      <div class="period-filters">
        <button
          v-for="period in periods"
          :key="period.value"
          :class="[
            'filter-button',
            { active: store.currentPeriod === period.value }
          ]"
          @click="changePeriod(period.value)"
          :disabled="store.loading"
        >
          {{ period.label }}
        </button>
      </div>
    </div>

    <div class="kpi-grid">
      <KPICard
        title="Clínicas Totais"
        :value="store.totals.totalClinics"
        :icon="Building"
      />
      <KPICard
        title="Usuários Totais"
        :value="store.totals.totalUsers"
        :icon="Users"
      />
      <KPICard
        title="Pacientes Totais"
        :value="store.totals.totalPatients"
        :icon="User"
      />
      <KPICard
        title="Atendimentos Totais"
        :value="store.totals.totalAppointments"
        :icon="Calendar"
      />
    </div>
    
    <div v-if="store.loading" class="loading-overlay">
      <Loader2 :size="48" class="icon-spin" />
    </div>

    <div v-else class="charts-grid">
      <AreaChart
        title="Novas Clínicas"
        :categories="clinicChartData.categories"
        :series="clinicChartData.series"
      />
      
      <AreaChart
        title="Novos Pacientes"
        :categories="patientChartData.categories"
        :series="patientChartData.series"
      />

      <DoughnutChart
        title="Status de Atendimentos (Período)"
        :labels="appointmentChartData.labels"
        :series="appointmentChartData.series"
        class="span-2"
      />
    </div>
  </div>
</template>

<script setup>
import { onMounted, computed } from 'vue'
import { useDashboardStore } from '../stores/dashboard.js' // (Ajuste o caminho se necessário)
import KPICard from '../components/layout/KPICard.vue'
import AreaChart from '../components/layout/charts/AreaChart.vue'
import DoughnutChart from '../components/layout/charts/DoughnutChart.vue'
import { Building, Users, User, Calendar, Loader2 } from 'lucide-vue-next'

const store = useDashboardStore()

// Opções do filtro de período
const periods = [
  { label: '7 Dias', value: '7d' },
  { label: '1 Mês', value: '1m' },
  { label: '6 Meses', value: '6m' },
  { label: '12 Meses', value: '12m' }
]

// Carrega os dados iniciais ao montar a página
onMounted(() => {
  store.fetchSummary(store.currentPeriod)
})

// Função para mudar o período e buscar dados
const changePeriod = (newPeriod) => {
  store.fetchSummary(newPeriod)
}

// --- Funções 'Computed' para transformar os dados para os gráficos ---

// Dados para o gráfico de Clínicas
const clinicChartData = computed(() => {
  const data = store.chartsData.newClinicsPerPeriod || []
  return {
    categories: data.map((item) => item.dateLabel),
    series: [
      {
        name: 'Novas Clínicas',
        data: data.map((item) => item.count)
      }
    ]
  }
})

// Dados para o gráfico de Pacientes
const patientChartData = computed(() => {
  const data = store.chartsData.newPatientsPerPeriod || []
  return {
    categories: data.map((item) => item.dateLabel),
    series: [
      {
        name: 'Novos Pacientes',
        data: data.map((item) => item.count)
      }
    ]
  }
})

// Dados para o gráfico de Atendimentos (Pizza/Donut)
const appointmentChartData = computed(() => {
  const data = store.chartsData.appointmentStatusDistribution || []
  return {
    labels: data.map((item) => item.status),
    series: data.map((item) => item.count)
  }
})
</script>

<style scoped>
/* Filtros */
.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem; /* 24px */
}

.page-title {
  font-size: 1.875rem; /* 30px */
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.period-filters {
  display: flex;
  background-color: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem; /* 8px */
  padding: 0.25rem; /* 4px */
}

.filter-button {
  border: none;
  background-color: transparent;
  padding: 0.5rem 1rem; /* 8px 16px */
  border-radius: 0.375rem; /* 6px */
  font-size: 0.875rem; /* 14px */
  font-weight: 500;
  color: #4b5563; /* Cinza */
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-button:hover:not(:disabled) {
  background-color: #f9fafb; /* Cinza bem claro */
  color: #000;
}

.filter-button.active {
  background-color: var(--color-primary, #0284c7);
  color: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.filter-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* Grid de KPIs */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem; /* 24px */
  margin-bottom: 1.5rem;
}

/* Grid de Gráficos */
.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

/* Ocupa 2 colunas */
.charts-grid .span-2 {
  grid-column: span 2 / span 2;
}

/* Loading */
.loading-overlay {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 5rem 0;
  color: var(--color-primary, #0284c7);
}

/* Animação de Spin */
.icon-spin {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Responsividade */
@media (max-width: 1280px) {
  .kpi-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .charts-grid {
    grid-template-columns: 1fr;
  }
  .charts-grid .span-2 {
    grid-column: span 1 / span 1;
  }
}

@media (max-width: 768px) {
  .filter-bar {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  .kpi-grid {
    grid-template-columns: 1fr;
  }
}
</style>