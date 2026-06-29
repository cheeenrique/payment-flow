import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { MotionPlugin } from '@vueuse/motion';
import App from './App.vue';
import router from './router';
import './style.css';

// Registra Pinia (estado global), router e plugin de animações
createApp(App).use(createPinia()).use(router).use(MotionPlugin).mount('#app');
