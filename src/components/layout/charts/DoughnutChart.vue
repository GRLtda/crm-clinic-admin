<template>
    <div class="chart-container">
      <h3 class="chart-title">{{ title }}</h3>
      <apexchart
        type="donut"
        height="350"
        :options="chartOptions"
        :series="series"
      ></apexchart>
    </div>
  </template>
  
  <script setup>
  import { computed } from 'vue'
  
  const props = defineProps({
    title: String,
    labels: {
      type: Array,
      default: () => []
    },
    series: {
      type: Array,
      default: () => [] // Formato: [10, 20, 30]
    }
  })
  
  const chartOptions = computed(() => ({
    chart: {
      height: 350,
      type: 'donut'
    },
    labels: props.labels,
    legend: {
      position: 'bottom'
    },
    // Cores personalizadas (opcional)
    colors: [
      '#0ea5e9',
      '#f43f5e',
      '#10b981',
      '#eab308',
      '#6366f1'
    ],
    dataLabels: {
      enabled: true,
      formatter: function (val, opts) {
        // Mostra a porcentagem e o valor total
        const total = opts.w.globals.seriesTotals.reduce((a, b) => a + b, 0)
        const percent = ((props.series[opts.seriesIndex] / total) * 100).toFixed(1) + '%'
        return percent
      }
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: {
            width: 200
          },
          legend: {
            position: 'bottom'
          }
        }
      }
    ]
  }))
  </script>
  
  <style scoped>
  .chart-container {
    background-color: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 0.75rem;
    padding: 1.5rem;
  }
  .chart-title {
    font-size: 1.125rem; /* 18px */
    font-weight: 600;
    color: #111827;
    margin-top: 0;
    margin-bottom: 1rem;
  }
  </style>