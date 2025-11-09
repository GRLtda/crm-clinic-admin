<template>
    <div class="skeleton-loader" :style="style"></div>
  </template>
  
  <script setup>
  import { computed } from 'vue'
  
  const props = defineProps({
    width: {
      type: String,
      default: '100%'
    },
    height: {
      type: String,
      default: '1em'
    },
    maxWidth: {
      type: String,
      default: '100%'
    },
    radius: {
      type: String,
      default: '0.375rem' // 6px
    }
  })
  
  const style = computed(() => ({
    width: props.width,
    height: props.height,
    maxWidth: props.maxWidth,
    borderRadius: props.radius
  }))
  </script>
  
  <style scoped>
  .skeleton-loader {
    background-color: #e5e7eb;
    position: relative;
    overflow: hidden;
    animation: shimmer 1.5s infinite linear;
  }
  
  /* Animação de brilho (shimmer) */
  @keyframes shimmer {
    0% {
      background-color: #e5e7eb;
    }
    50% {
      background-color: #f3f4f6;
    }
    100% {
      background-color: #e5e7eb;
    }
  }
  </style>