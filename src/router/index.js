import { createRouter, createWebHistory } from 'vue-router';
import TimerPage from '@/pages/TimerPage.vue'; 
import ActivitiesTable from '@/pages/ActivitiesTable.vue'; 

const routes = [
  { path: '/', component: TimerPage },
  { path: '/activities', component: ActivitiesTable }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
