import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: { title: '首页' }
  },
  {
    path: '/books',
    name: 'Books',
    component: () => import('../views/Books.vue'),
    meta: { title: '古籍库' }
  },
  {
    path: '/book/:id',
    name: 'BookDetail',
    component: () => import('../views/BookDetail.vue'),
    meta: { title: '古籍详情' }
  },
  {
    path: '/collation/:pageId',
    name: 'Collation',
    component: () => import('../views/Collation.vue'),
    meta: { title: '校勘工作台' }
  },
  {
    path: '/search',
    name: 'Search',
    component: () => import('../views/Search.vue'),
    meta: { title: '全文检索' }
  },
  {
    path: '/tools',
    name: 'Tools',
    component: () => import('../views/Tools.vue'),
    meta: { title: '校勘工具' }
  },
  {
    path: '/compare',
    name: 'Compare',
    component: () => import('../views/Compare.vue'),
    meta: { title: '版本比对' }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

router.beforeEach((to, from, next) => {
  document.title = to.meta.title ? `${to.meta.title} - 古籍智能校勘系统` : '古籍智能校勘系统'
  next()
})

export default router
