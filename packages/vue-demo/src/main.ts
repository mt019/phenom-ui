import {createApp,h} from 'vue';import {createRouter,createWebHistory,RouterView} from 'vue-router';
import '@phenomcanvas/ui-vue/styles.css';import './style.css';import ReaderPage from './ReaderPage.vue';
const router=createRouter({history:createWebHistory(import.meta.env.BASE_URL),routes:[{path:'/',component:ReaderPage}],scrollBehavior(){return false;}});
createApp({render:()=>h(RouterView)}).use(router).mount('#app');
