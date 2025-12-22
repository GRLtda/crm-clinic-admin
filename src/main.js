import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

// Toast
import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'



// CSS
import './css/normalize.css'
import './css/global.css'
import './css/custom-toast.css'

// Diretivas
import vClickOutside from './directives/click-outside.js'
import { phoneMask } from './directives/phone-mask.js'
import { cpfMask } from './directives/cpf-mask.js'
import { cnpjMask } from './directives/cnpj-mask.js'

const app = createApp(App)
const pinia = createPinia()

pinia.use(({ store }) => {
  store.router = router
})

app.use(pinia)
app.use(router)

import { setupAxiosInterceptors } from './utils/axios-setup'
setupAxiosInterceptors(router)

// Configuração do Toast
app.use(Toast, {
  transition: 'Vue-Toastification__fade',
  maxToasts: 5,
  newestOnTop: true,
  position: 'bottom-right',
  timeout: 3000,
  closeOnClick: true,
  pauseOnFocusLoss: true,
  pauseOnHover: true,
  draggable: true,
  draggablePercent: 0.6,
  showCloseButtonOnHover: false,
  hideProgressBar: false,
  closeButton: 'button',
  icon: true,
  rtl: false
})

app.directive('click-outside', vClickOutside)
app.directive('phone-mask', phoneMask)
app.directive('cpf-mask', cpfMask)
app.directive('cnpj-mask', cnpjMask)



app.mount('#app')