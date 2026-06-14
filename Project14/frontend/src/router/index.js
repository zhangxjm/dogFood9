import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import Devices from '../views/Devices.vue'
import DataMonitor from '../views/DataMonitor.vue'
import Irrigation from '../views/Irrigation.vue'
import Schedules from '../views/Schedules.vue'
import Alerts from '../views/Alerts.vue'

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
    meta: { title: '监控总览' }
  },
  {
    path: '/devices',
    name: 'Devices',
    component: Devices,
    meta: { title: '设备管理' }
  },
  {
    path: '/data',
    name: 'DataMonitor',
    component: DataMonitor,
    meta: { title: '数据监测' }
  },
  {
    path: '/irrigation',
    name: 'Irrigation',
    component: Irrigation,
    meta: { title: '灌溉控制' }
  },
  {
    path: '/schedules',
    name: 'Schedules',
    component: Schedules,
    meta: { title: '定时任务' }
  },
  {
    path: '/alerts',
    name: 'Alerts',
    component: Alerts,
    meta: { title: '告警中心' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
