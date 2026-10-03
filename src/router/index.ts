import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { header: 'Home', description: 'Навигация.' },
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/AboutView.vue'),
      meta: { header: 'About', description: 'Общее описание приложения.' },
    },
    {
      path: '/tree',
      name: 'tree',
      component: () => import('../views/TreeView.vue'),
      meta: { header: 'Tree', description: 'Управление графом с помощью древовидного представления.' },
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('../views/SettingsView.vue'),
      meta: { header: 'Settings', description: 'Общие настройки приложения.' },
    },{
      path: '/tree-v2',
      name: 'tree-v2',
      component: () => import('../views/TreeV2View.vue'),
      meta: { header: 'TreeV2', description: 'Bulk tree load.' },
    },
    {
      path: '/test-supabase',
      name: 'test-supabase',
      component: () => import('../views/TestSupabaseView.vue'),
      meta: { header: 'Test Supabase', description: 'Тестирование интеграции с Supabase: REST API иЫ tree_view.' },
    },
  ],
})

export default router