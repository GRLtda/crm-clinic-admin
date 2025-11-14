import { ref } from 'vue'
import { useToast } from 'vue-toastification'

export function useClipboard() {
  const toast = useToast()
  const copied = ref(false)

  const copy = async (textToCopy) => {
    if (!navigator.clipboard) {
      toast.error('O seu navegador não suporta a área de transferência.')
      return
    }

    try {
      await navigator.clipboard.writeText(textToCopy)
      copied.value = true
      toast.success('Link copiado para a área de transferência!')
      
      // Reseta o estado de "copiado" após 2s
      setTimeout(() => {
        copied.value = false
      }, 2000)

    } catch (err) {
      console.error('Falha ao copiar:', err)
      toast.error('Não foi possível copiar o link.')
    }
  }

  return {
    copied,
    copy
  }
}