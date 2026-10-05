import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { header: 'Home', description: 'Navigation.' },
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/AboutView.vue'),
      meta: { header: 'About', description: 'General description of the application.' },
    },
    {
      path: '/tree',
      name: 'tree',
      component: () => import('../views/TreeView.vue'),
      meta: { header: 'Tree', description: 'Management of the graph using a tree view.' },
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('../views/SettingsView.vue'),
      meta: { header: 'Settings', description: 'General settings of the application.' },
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
      meta: { header: 'Test Supabase', description: 'Testing integration with Supabase: REST API and tree_view.' },
    },
  ],
})

export default router