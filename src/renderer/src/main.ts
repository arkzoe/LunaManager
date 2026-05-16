import 'virtual:uno.css'
import './assets/animations.css'

import { createApp } from 'vue'
import { pinia } from './stores'
import App from './App.vue'

const app = createApp(App)

// 使用 Pinia
app.use(pinia)

app.mount('#app')
