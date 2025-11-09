<template>
    <div class="chart-container">
      <h3 class="chart-title">{{ title }}</h3>
      <apexchart
        type="area"
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
    categories: {
      type: Array,
      default: () => []
    },
    series: {
      type: Array,
      default: () => [] // Formato: [{ name: 'Série 1', data: [10, 20, 30] }]
    }
  })
  
  const chartOptions = computed(() => ({
    chart: {
      height: 350,
      type: 'area',
      zoom: {
        enabled: false
      },
      toolbar: {
        show: false
      }
    },
    colors: ['#0284c7'], // Cor primária
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'smooth',
      width: 2
    },
    xaxis: {
      type: 'category',
      categories: props.categories
    },
    yaxis: {
      labels: {
        formatter: (value) => {
          // Formata para inteiro (sem casas decimais)
          return parseInt(value) 
        }
      }
    },
    tooltip: {
      x: {
        format: 'dd/MM/yy'
      }
    },
    grid: {
      borderColor: '#f1f1f1'
    }
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