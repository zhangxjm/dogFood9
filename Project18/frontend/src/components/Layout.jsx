import React from 'react'
import { Outlet, NavLink } from 'react-router-dom'

const menuItems = [
  { path: '/', label: '统计概览', icon: '📊' },
  { path: '/warehouses', label: '仓库管理', icon: '🏭' },
  { path: '/drivers', label: '司机管理', icon: '👨‍✈️' },
  { path: '/vehicles', label: '车辆管理', icon: '🚚' },
  { path: '/orders', label: '订单管理', icon: '📦' },
  { path: '/optimizer', label: '路径优化', icon: '🗺️' },
  { path: '/tracking', label: '实时跟踪', icon: '📍' }
]

export default function Layout() {
  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          🚚 配送路径优化系统
        </div>
        <ul className="sidebar-menu">
          {menuItems.map(item => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) => isActive ? 'active' : ''}
              >
                <span style={{ marginRight: '8px' }}>{item.icon}</span>
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
