<template>
    <div class="avatar-placeholder" :style="avatarStyle">
      {{ initials }}
    </div>
  </template>
  
  <script setup>
  import { computed } from 'vue'
  
  const props = defineProps({
    name: {
      type: String,
      required: true
    },
    size: {
      type: String,
      default: '40px' // Pode ser '24px', '32px', '40px', '48px' etc.
    },
    fontSize: {
      type: String,
      default: '0.9rem' // Tamanho da fonte para as iniciais
    }
  })
  
  // Calcula as iniciais do nome
  const initials = computed(() => {
    const parts = props.name.split(' ').filter(p => p.length > 0)
    if (parts.length === 0) return '?'
    
    if (parts.length === 1) {
      return parts[0][0].toUpperCase()
    }
    
    // Duas primeiras letras de cada parte principal
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  })
  
  // Gera uma cor de fundo determinística baseada no nome
  const getColorFromName = (name) => {
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
  
    let color = '#'
    for (let i = 0; i < 3; i++) {
      const value = (hash >> (i * 8)) & 0xff
      color += ('00' + value.toString(16)).substr(-2)
    }
    return color
  }
  
  // Estilos dinâmicos para o avatar
  const avatarStyle = computed(() => ({
    width: props.size,
    height: props.size,
    fontSize: props.fontSize,
    backgroundColor: getColorFromName(props.name),
    lineHeight: props.size, // Centraliza verticalmente o texto
  }))
  </script>
  
  <style scoped>
  .avatar-placeholder {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    color: white; /* Texto sempre branco para contraste */
    font-weight: 600;
    text-transform: uppercase;
    user-select: none;
    overflow: hidden; /* Garante que o texto não vaze */
    flex-shrink: 0; /* Impede que o avatar encolha em flexbox */
  }
  </style>