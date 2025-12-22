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
        :trend="clinicTrend"
      />
      <KPICard
        title="Usuários Totais"
        :value="store.totals.totalUsers"
        :icon="Users"
        :trend="userTrend"
      />
      <KPICard
        title="Pacientes Totais"
        :value="store.totals.totalPatients"
        :icon="User"
        :trend="patientTrend"
      />
      <KPICard
        title="Atendimentos Totais"
        :value="store.totals.totalAppointments"
        :icon="Calendar"
        :trend="appointmentTrend"
      />
    </div>
    
    <div v-if="store.loading" class="loading-overlay">
      <Loader2 :size="48" class="icon-spin" />
    </div>

    <div v-else class="charts-grid">
      <!-- Gráfico de Pacientes (Lateral) -->
      <AreaChart
        title="Novos Pacientes"
        :categories="patientChartData.categories"
        :series="patientChartData.series"
        class="side-chart"
      />

      <!-- Gráfico de Status (Lateral) -->
      <DoughnutChart
        title="Status de Atendimentos"
        :labels="appointmentChartData.labels"
        :series="appointmentChartData.series"
        class="side-chart"
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

// --- Cálculo de Trends --- (Crescimento no período)
const calculateTrend = (totalAllTime, itemsInPeriod) => {
  if (!totalAllTime || !itemsInPeriod) return 0
  
  // Soma os novos itens no período visualizado
  const newInPeriod = itemsInPeriod.reduce((acc, curr) => acc + curr.count, 0)
  
  // Total anterior = Total atual - Novos no período
  const previousTotal = totalAllTime - newInPeriod

  // Se o total anterior for 0 ou menor (ex: tudo é novo), crescimento de 100%
  if (previousTotal <= 0) return 100 

  // Cálculo de crescimento percentual
  return Number(((newInPeriod / previousTotal) * 100).toFixed(1))
}

const clinicTrend = computed(() => {
  return calculateTrend(store.totals.totalClinics, store.chartsData.newClinicsPerPeriod)
})

const userTrend = computed(() => {
  return calculateTrend(store.totals.totalUsers, store.chartsData.newUsersPerPeriod)
})

const patientTrend = computed(() => {
  return calculateTrend(store.totals.totalPatients, store.chartsData.newPatientsPerPeriod)
})

const appointmentTrend = computed(() => {
  return calculateTrend(store.totals.totalAppointments, store.chartsData.appointmentStatusDistribution)
})

// --- Funções 'Computed' para transformar os dados para os gráficos ---

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
  margin-bottom: 2rem;
}

.page-title {
  font-family: var(--fonte-titulo);
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--preto);
  margin: 0;
  letter-spacing: -0.02em;
}

.period-filters {
  display: flex;
  background-color: #f3f4f6;
  padding: 0.25rem;
  border-radius: 0.75rem;
}

.filter-button {
  border: none;
  background-color: transparent;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--cinza-texto);
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-button:hover:not(:disabled) {
  color: var(--azul-principal);
  background-color: rgba(255, 255, 255, 0.5);
}

.filter-button.active {
  background-color: var(--branco);
  color: var(--azul-principal);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.filter-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Grid de KPIs */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
  margin-bottom: 2rem;
}

/* Grid de Gráficos */
.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr); /* 2 colunas para os gráficos restantes */
  gap: 1.5rem;
}

/* Gráfico menor ocupa 1 coluna */
.side-chart {
  grid-column: span 1;
}

/* Loading */
.loading-overlay {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 4rem 0;
  gap: 1rem;
  color: var(--azul-principal);
}

.icon-spin {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Responsividade */
@media (max-width: 1280px) {
  .kpi-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .charts-grid {
    grid-template-columns: 1fr;
  }
  .side-chart {
    grid-column: span 1;
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