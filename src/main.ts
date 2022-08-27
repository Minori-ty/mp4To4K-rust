import { createApp } from 'vue'
import './style.scss'
import App from './App.vue'
// import 'element-plus/dist/index.css'
// import ElementPlus from 'element-plus'
import router from './router'

createApp(App).use(router).mount('#app')
